import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Prototype } from "@/models/Prototype";
import { createPrototypeSchema } from "@/lib/validation";
import { getSessionFromRequest } from "@/lib/auth";
import { generateShortId } from "@/lib/shortid";
import { generateQrPng, generateQrSvg } from "@/lib/qr";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function getBaseUrl(req: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSessionFromRequest(req);

    // If user is logged in, fetch their prototypes; otherwise demo/guest prototypes
    const query = session ? { userId: session.userId } : { userId: "guest" };
    const prototypes = await Prototype.find(query).sort({ createdAt: -1 });

    const baseUrl = getBaseUrl(req);
    const enriched = prototypes.map((p) => ({
      _id: p._id.toString(),
      name: p.name,
      shortId: p.shortId,
      originalUrl: p.originalUrl,
      isActive: p.isActive,
      scanCount: p.scanCount,
      shortUrl: `${baseUrl}/p/${p.shortId}`,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return NextResponse.json({ success: true, prototypes: enriched });
  } catch (error) {
    console.error("GET /api/prototypes error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch prototypes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rateCheck = checkRateLimit(`create_prototype_${ip}`, 30, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many creations. Please slow down." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parseResult = createPrototypeSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: parseResult.error.errors[0]?.message || "Invalid input data",
        },
        { status: 400 }
      );
    }

    const { name, originalUrl } = parseResult.data;

    await connectToDatabase();
    const session = await getSessionFromRequest(req);
    const userId = session ? session.userId : "guest";

    // Generate unique shortId with collision check
    let shortId = generateShortId();
    let collision = await Prototype.findOne({ shortId });
    let attempts = 0;
    while (collision && attempts < 5) {
      shortId = generateShortId();
      collision = await Prototype.findOne({ shortId });
      attempts++;
    }

    const prototype = await Prototype.create({
      userId,
      name: name || "Untitled Prototype",
      shortId,
      originalUrl,
      isActive: true,
      scanCount: 0,
    });

    const baseUrl = getBaseUrl(req);
    const shortUrl = `${baseUrl}/p/${shortId}`;

    // Generate high resolution PNG Data URL and SVG
    const [qrCodePng, qrCodeSvg] = await Promise.all([
      generateQrPng(shortUrl),
      generateQrSvg(shortUrl),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "Prototype created successfully",
        prototype: {
          _id: prototype._id.toString(),
          name: prototype.name,
          shortId: prototype.shortId,
          originalUrl: prototype.originalUrl,
          isActive: prototype.isActive,
          scanCount: prototype.scanCount,
          shortUrl,
          createdAt: prototype.createdAt,
          updatedAt: prototype.updatedAt,
        },
        shortUrl,
        qrCodePng,
        qrCodeSvg,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/prototypes error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create prototype" },
      { status: 500 }
    );
  }
}
