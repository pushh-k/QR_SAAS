import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Prototype } from "@/models/Prototype";
import { Scan } from "@/models/Scan";
import { updatePrototypeSchema } from "@/lib/validation";
import { getSessionFromRequest } from "@/lib/auth";
import { generateQrPng, generateQrSvg } from "@/lib/qr";

export const dynamic = "force-dynamic";

function getBaseUrl(req: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid prototype ID" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const session = await getSessionFromRequest(req);
    const prototype = await Prototype.findById(id);

    if (!prototype) {
      return NextResponse.json(
        { success: false, message: "Prototype not found" },
        { status: 404 }
      );
    }

    // Verify ownership if prototype belongs to a registered user
    if (session && prototype.userId && prototype.userId !== "guest" && prototype.userId.toString() !== session.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    const baseUrl = getBaseUrl(req);
    const shortUrl = `${baseUrl}/p/${prototype.shortId}`;
    const [qrCodePng, qrCodeSvg] = await Promise.all([
      generateQrPng(shortUrl),
      generateQrSvg(shortUrl),
    ]);

    return NextResponse.json({
      success: true,
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
      qrCodePng,
      qrCodeSvg,
    });
  } catch (error) {
    console.error("GET /api/prototypes/:id error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch prototype" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid prototype ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parseResult = updatePrototypeSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: parseResult.error.errors[0]?.message || "Invalid input data",
        },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const session = await getSessionFromRequest(req);
    const prototype = await Prototype.findById(id);

    if (!prototype) {
      return NextResponse.json(
        { success: false, message: "Prototype not found" },
        { status: 404 }
      );
    }

    // Security: Check ownership
    if (session && prototype.userId && prototype.userId !== "guest" && prototype.userId.toString() !== session.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to edit this prototype" },
        { status: 403 }
      );
    }

    const updates = parseResult.data;
    if (updates.name !== undefined) prototype.name = updates.name;
    if (updates.originalUrl !== undefined) prototype.originalUrl = updates.originalUrl;
    if (updates.isActive !== undefined) prototype.isActive = updates.isActive;

    await prototype.save();

    const baseUrl = getBaseUrl(req);
    const shortUrl = `${baseUrl}/p/${prototype.shortId}`;

    return NextResponse.json({
      success: true,
      message: "Prototype updated successfully",
      prototype: {
        _id: prototype._id.toString(),
        name: prototype.name,
        shortId: prototype.shortId,
        originalUrl: prototype.originalUrl,
        isActive: prototype.isActive,
        scanCount: prototype.scanCount,
        shortUrl,
        updatedAt: prototype.updatedAt,
      },
    });
  } catch (error) {
    console.error("PATCH /api/prototypes/:id error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update prototype" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid prototype ID" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const session = await getSessionFromRequest(req);
    const prototype = await Prototype.findById(id);

    if (!prototype) {
      return NextResponse.json(
        { success: false, message: "Prototype not found" },
        { status: 404 }
      );
    }

    // Security: Check ownership
    if (session && prototype.userId && prototype.userId !== "guest" && prototype.userId.toString() !== session.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to delete this prototype" },
        { status: 403 }
      );
    }

    // Delete scans associated with prototype
    await Scan.deleteMany({ prototypeId: prototype._id });
    await Prototype.findByIdAndDelete(prototype._id);

    return NextResponse.json({
      success: true,
      message: "Prototype and scan logs deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/prototypes/:id error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete prototype" },
      { status: 500 }
    );
  }
}
