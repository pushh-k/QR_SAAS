import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Prototype } from "@/models/Prototype";
import { Scan } from "@/models/Scan";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

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

    if (session && prototype.userId && prototype.userId !== "guest" && prototype.userId.toString() !== session.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [todayCount, last7DaysCount, last30DaysCount] = await Promise.all([
      Scan.countDocuments({
        prototypeId: prototype._id,
        timestamp: { $gte: startOfToday },
      }),
      Scan.countDocuments({
        prototypeId: prototype._id,
        timestamp: { $gte: sevenDaysAgo },
      }),
      Scan.countDocuments({
        prototypeId: prototype._id,
        timestamp: { $gte: thirtyDaysAgo },
      }),
    ]);

    // Device breakdown
    const deviceAggregation = await Scan.aggregate([
      { $match: { prototypeId: prototype._id } },
      { $group: { _id: "$device", count: { $sum: 1 } } },
    ]);

    // Browser breakdown
    const browserAggregation = await Scan.aggregate([
      { $match: { prototypeId: prototype._id } },
      { $group: { _id: "$browser", count: { $sum: 1 } } },
    ]);

    // Daily scans over last 7 days for chart
    const dailyScans = await Scan.aggregate([
      {
        $match: {
          prototypeId: prototype._id,
          timestamp: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          scans: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing days in last 7 days
    const chartData: { date: string; label: string; scans: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const found = dailyScans.find((item) => item._id === dateStr);
      chartData.push({
        date: dateStr,
        label: `${dayName} ${d.getDate()}`,
        scans: found ? found.scans : 0,
      });
    }

    // Recent 15 scans
    const recentScans = await Scan.find({ prototypeId: prototype._id })
      .sort({ timestamp: -1 })
      .limit(15)
      .lean();

    return NextResponse.json({
      success: true,
      analytics: {
        prototypeName: prototype.name,
        shortId: prototype.shortId,
        totalScans: prototype.scanCount,
        today: todayCount,
        last7Days: last7DaysCount,
        last30Days: last30DaysCount,
        devices: deviceAggregation.map((d) => ({
          label: d._id || "Other",
          count: d.count,
        })),
        browsers: browserAggregation.map((b) => ({
          label: b._id || "Other",
          count: b.count,
        })),
        chartData,
        recentScans: recentScans.map((s) => ({
          _id: s._id.toString(),
          timestamp: s.timestamp,
          device: s.device,
          browser: s.browser,
          os: s.os,
          referrer: s.referrer,
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/prototypes/:id/analytics error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
