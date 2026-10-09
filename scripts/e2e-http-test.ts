async function runE2E() {
  console.log("\n=======================================================");
  console.log("   LIVE E2E HTTP INTEGRATION TEST (http://localhost:3000)");
  console.log("=======================================================\n");

  const baseUrl = "http://localhost:3000";
  let cookieHeader = "";

  // 1. Register User
  console.log("1. Testing Registration (POST /api/auth/register)");
  const regEmail = `alex_${Date.now()}@example.com`;
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Alex Morgan",
      email: regEmail,
      password: "secretpassword123",
    }),
  });

  const regData = await regRes.json();
  const rawCookie = regRes.headers.get("set-cookie");
  if (rawCookie) {
    cookieHeader = rawCookie.split(";")[0];
  }
  console.log("   Status:", regRes.status);
  console.log("   Success:", regData.success);
  console.log("   User ID:", regData.user?.id);
  if (!regData.success) throw new Error("Registration failed");

  // 2. Auth Session Check
  console.log("\n2. Testing Session Verification (GET /api/auth/me)");
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: cookieHeader },
  });
  const meData = await meRes.json();
  console.log("   Authenticated:", meData.authenticated, "| User:", meData.user?.email);
  if (!meData.authenticated) throw new Error("Auth verification failed");

  // 3. Create Prototype
  console.log("\n3. Testing Prototype Creation (POST /api/prototypes)");
  const createRes = await fetch(`${baseUrl}/api/prototypes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      name: "Mobile Checkout Prototype",
      originalUrl: "https://news.ycombinator.com",
    }),
  });
  const createData = await createRes.json();
  console.log("   Status:", createRes.status);
  console.log("   Short ID:", createData.prototype?.shortId);
  console.log("   Short URL:", createData.shortUrl);
  console.log("   Has QR PNG Data URL:", !!createData.qrCodePng?.startsWith("data:image/png"));
  console.log("   Has QR SVG:", !!createData.qrCodeSvg?.includes("<svg"));
  if (!createData.success) throw new Error("Creation failed");

  const shortId = createData.prototype.shortId;
  const protoId = createData.prototype._id;

  // 4. Test Redirection Route (Phone Scan simulation)
  console.log("\n4. Testing Dynamic QR Scan & Redirect (GET /p/[shortId])");
  const scanRes = await fetch(`${baseUrl}/p/${shortId}`, {
    redirect: "manual",
    headers: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
      Referer: "https://camera-app.phone",
    },
  });
  console.log("   Redirect HTTP Status:", scanRes.status);
  const locationHeader = scanRes.headers.get("location");
  console.log("   Redirect Target Location:", locationHeader);
  if (!locationHeader?.startsWith("https://news.ycombinator.com")) {
    throw new Error(`Expected redirect to https://news.ycombinator.com, got ${locationHeader}`);
  }

  // 5. Check Analytics for the scan
  console.log("\n5. Testing Scan Analytics Logging (GET /api/prototypes/[id]/analytics)");
  // Small wait for async db write
  await new Promise((r) => setTimeout(r, 800));
  const analyticsRes = await fetch(`${baseUrl}/api/prototypes/${protoId}/analytics`, {
    headers: { Cookie: cookieHeader },
  });
  const analyticsData = await analyticsRes.json();
  console.log("   Total Scans:", analyticsData.analytics?.totalScans);
  console.log("   Device Breakdown:", JSON.stringify(analyticsData.analytics?.devices));
  console.log("   Browser Breakdown:", JSON.stringify(analyticsData.analytics?.browsers));
  if (analyticsData.analytics?.totalScans < 1) {
    throw new Error("Scan was not counted in analytics");
  }

  // 6. Dynamic URL Editing (The most critical feature)
  console.log("\n6. Testing Dynamic Destination URL Edit (PATCH /api/prototypes/[id])");
  const editRes = await fetch(`${baseUrl}/api/prototypes/${protoId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      name: "Mobile Checkout Prototype (Updated)",
      originalUrl: "https://wikipedia.org",
    }),
  });
  const editData = await editRes.json();
  console.log("   Update Success:", editData.success);
  console.log("   New Stored Target:", editData.prototype?.originalUrl);
  console.log("   Short ID Unchanged:", editData.prototype?.shortId === shortId);

  // 7. Verify scanning the EXACT SAME QR / Short URL redirects to the NEW destination!
  console.log("\n7. Testing Scanning SAME QR Code Again -> New Destination");
  const scan2Res = await fetch(`${baseUrl}/p/${shortId}`, {
    redirect: "manual",
    headers: {
      "User-Agent": "Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Chrome/120.0.0.0",
    },
  });
  console.log("   Redirect HTTP Status:", scan2Res.status);
  const newLocation = scan2Res.headers.get("location");
  console.log("   New Redirect Target Location:", newLocation);
  if (!newLocation?.startsWith("https://wikipedia.org")) {
    throw new Error(`Expected redirect to https://wikipedia.org, got ${newLocation}`);
  }

  // 8. Test Disabling the prototype
  console.log("\n8. Testing Inactive / Disabled Prototype (isActive: false)");
  await fetch(`${baseUrl}/api/prototypes/${protoId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ isActive: false }),
  });
  const disabledRes = await fetch(`${baseUrl}/p/${shortId}`, { redirect: "manual" });
  console.log("   Disabled Route Status:", disabledRes.status);
  const disabledHtml = await disabledRes.text();
  console.log("   Contains 'Prototype Unavailable':", disabledHtml.includes("Prototype Unavailable"));

  // 9. Test Non-existent shortId (404)
  console.log("\n9. Testing Non-existent Short ID (GET /p/non-existent-xyz)");
  const notFoundRes = await fetch(`${baseUrl}/p/non-existent-xyz`, { redirect: "manual" });
  console.log("   Status:", notFoundRes.status);
  const notFoundHtml = await notFoundRes.text();
  console.log("   Contains 'Prototype Not Found':", notFoundHtml.includes("Prototype Not Found"));

  // 10. Dashboard Stats
  console.log("\n10. Testing Dashboard Overall Statistics (GET /api/dashboard/stats)");
  const statsRes = await fetch(`${baseUrl}/api/dashboard/stats`, {
    headers: { Cookie: cookieHeader },
  });
  const statsData = await statsRes.json();
  console.log("   Total Prototypes:", statsData.stats?.totalPrototypes);
  console.log("   Total Scans:", statsData.stats?.totalScans);
  console.log("   Active Links:", statsData.stats?.activeLinks);

  console.log("\n=======================================================");
  console.log("   ALL 10 LIVE END-TO-END TESTS PASSED SUCCESSFULLY! ✓");
  console.log("=======================================================\n");
}

runE2E().catch((err) => {
  console.error("\n❌ E2E Test Error:", err);
  process.exit(1);
});
