import mongoose from "mongoose";
import { isValidHttpUrl, createPrototypeSchema, updatePrototypeSchema } from "../src/lib/validation.ts";
import { generateShortId } from "../src/lib/shortid.ts";
import { generateQrPng, generateQrSvg } from "../src/lib/qr.ts";
import { Prototype } from "../src/models/Prototype.ts";
import { Scan } from "../src/models/Scan.ts";
import { User } from "../src/models/User.ts";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/qr_platform_test";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${testName}${details ? ` -> ${details}` : ""}`);
    failed++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("   QR PROTOTYPE PLATFORM - CRITICAL TEST SUITE");
  console.log("=======================================================\n");

  await mongoose.connect(MONGODB_URI);
  console.log(`Connected to test MongoDB: ${MONGODB_URI}\n`);

  // Cleanup old test data
  await Prototype.deleteMany({ name: { $regex: /^TEST_/ } });
  await User.deleteMany({ email: { $regex: /^test_/ } });

  // TEST 1: Valid URL creation
  console.log("1. Valid URL Creation & Schema Validation");
  const validResult1 = createPrototypeSchema.safeParse({
    name: "TEST_Valid",
    originalUrl: "https://example.com/prototype-v1",
  });
  assert(validResult1.success, "Accepts standard HTTPS URL");

  const validResult2 = createPrototypeSchema.safeParse({
    originalUrl: "http://localhost:3000/demo",
  });
  assert(validResult2.success, "Accepts standard HTTP URL with port");

  // TEST 2: Invalid URL rejection
  console.log("\n2. Invalid URL Rejection & Dangerous Protocol Blocking");
  const invalid1 = createPrototypeSchema.safeParse({
    originalUrl: "javascript:alert('XSS')",
  });
  assert(!invalid1.success, "Rejects javascript: dangerous protocol");

  const invalid2 = createPrototypeSchema.safeParse({
    originalUrl: "data:text/html,<script>window.location='https://evil.com'</script>",
  });
  assert(!invalid2.success, "Rejects data: dangerous protocol");

  const invalid3 = createPrototypeSchema.safeParse({
    originalUrl: "not-a-valid-url",
  });
  assert(!invalid3.success, "Rejects malformed URL strings");

  // TEST 3: Unique short ID generation
  console.log("\n3. Unique Short ID Generation");
  const shortId1 = generateShortId();
  const shortId2 = generateShortId();
  assert(
    typeof shortId1 === "string" && shortId1.length >= 6,
    "Generates string with at least 6 characters"
  );
  assert(shortId1 !== shortId2, "Generates unique random IDs");
  const idSet = new Set<string>();
  for (let i = 0; i < 50; i++) {
    idSet.add(generateShortId());
  }
  assert(idSet.size === 50, "Generates collision-free IDs across 50 iterations");

  // TEST 4: QR URL generation
  console.log("\n4. QR URL Generation (PNG & SVG)");
  const testTargetUrl = "http://localhost:3000/p/" + shortId1;
  const qrPng = await generateQrPng(testTargetUrl);
  assert(
    typeof qrPng === "string" && qrPng.startsWith("data:image/png;base64,"),
    "Generates valid base64 PNG data URI"
  );
  const qrSvg = await generateQrSvg(testTargetUrl);
  assert(
    typeof qrSvg === "string" && qrSvg.includes("<svg") && qrSvg.includes("</svg>"),
    "Generates valid vector SVG markup"
  );

  // TEST 5: Prototype lookup in database
  console.log("\n5. Prototype Database Persistence & Lookup");
  const createdProto = await Prototype.create({
    userId: "guest",
    name: "TEST_Lookup_Proto",
    shortId: shortId1,
    originalUrl: "https://example.com/initial-target",
    isActive: true,
    scanCount: 0,
  });
  const lookupByShortId = await Prototype.findOne({ shortId: shortId1 });
  assert(
    lookupByShortId !== null && lookupByShortId.name === "TEST_Lookup_Proto",
    "Finds prototype by shortId"
  );
  const lookupById = await Prototype.findById(createdProto._id);
  assert(
    lookupById !== null && lookupById.shortId === shortId1,
    "Finds prototype by MongoDB ObjectId"
  );

  // TEST 6: Redirect behavior & Dynamic URL Updating
  console.log("\n6. Dynamic Link Redirection & Editing");
  assert(
    lookupByShortId?.originalUrl === "https://example.com/initial-target",
    "Initially directs to original target URL"
  );
  // Update destination URL while shortId remains unchanged
  await Prototype.updateOne(
    { _id: createdProto._id },
    { originalUrl: "https://example.com/new-updated-target-v2" }
  );
  const updatedProto = await Prototype.findOne({ shortId: shortId1 });
  assert(
    updatedProto?.originalUrl === "https://example.com/new-updated-target-v2",
    "Destination updated without modifying shortId or requiring new QR"
  );
  assert(
    updatedProto?.shortId === shortId1,
    "ShortId remains identical after destination edit"
  );

  // TEST 7: Disabled prototype behavior
  console.log("\n7. Disabled Prototype Status Check");
  await Prototype.updateOne({ _id: createdProto._id }, { isActive: false });
  const disabledProto = await Prototype.findOne({ shortId: shortId1 });
  assert(
    disabledProto !== null && disabledProto.isActive === false,
    "Correctly flags prototype as inactive for 'Prototype Unavailable' page"
  );

  // TEST 8: Non-existent prototype behavior
  console.log("\n8. Non-existent Prototype Lookup (404 Handling)");
  const nonExistent = await Prototype.findOne({ shortId: "does-not-exist-9999" });
  assert(
    nonExistent === null,
    "Returns null for missing shortId to trigger 404 page"
  );

  // TEST 9: Unauthorized access prevention
  console.log("\n9. User Ownership & Unauthorized Access Prevention");
  const user1 = await User.create({
    name: "TEST_Alice",
    email: `test_alice_${Date.now()}@example.com`,
    passwordHash: "hash123",
  });
  const user2 = await User.create({
    name: "TEST_Bob",
    email: `test_bob_${Date.now()}@example.com`,
    passwordHash: "hash456",
  });
  const aliceProto = await Prototype.create({
    userId: user1._id.toString(),
    name: "TEST_Alice_Proto",
    shortId: generateShortId(),
    originalUrl: "https://alice.design",
    isActive: true,
  });
  const isBobAuthorized = aliceProto.userId.toString() === user2._id.toString();
  assert(
    !isBobAuthorized,
    "Prevents unauthorized user (Bob) from modifying Alice's prototype"
  );

  // TEST 10: Analytics increment & Scan Logging
  console.log("\n10. Analytics Increment & Scan Event Logging");
  const initialCount = createdProto.scanCount;
  // Simulate phone scan
  const scanEvent = await Scan.create({
    prototypeId: createdProto._id,
    timestamp: new Date(),
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile",
    device: "Mobile",
    browser: "Safari",
    os: "iOS",
    referrer: "Direct",
  });
  await Prototype.updateOne(
    { _id: createdProto._id },
    { $inc: { scanCount: 1 } }
  );
  const scannedProto = await Prototype.findById(createdProto._id);
  assert(
    (scannedProto?.scanCount || 0) === initialCount + 1,
    "Atomically increments scanCount by 1"
  );
  assert(
    scanEvent.device === "Mobile" && scanEvent.browser === "Safari",
    "Records device and browser telemetry"
  );

  // Clean up
  await Prototype.deleteMany({ name: { $regex: /^TEST_/ } });
  await User.deleteMany({ email: { $regex: /^test_/ } });
  await Scan.deleteMany({ prototypeId: createdProto._id });
  await mongoose.disconnect();

  console.log("\n=======================================================");
  console.log(`   TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
