import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Prototype } from "@/models/Prototype";
import { Scan } from "@/models/Scan";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSessionFromRequest(req);
    const userQuery = session ? { userId: session.userId } : { userId: "guest" };

    const prototypes = await Prototype.find(userQuery).lean();
    const prototypeIds = prototypes.map((p) => p._id);

    const totalPrototypes = prototypes.length;
    const activeLinks = prototypes.filter((p) => p.isActive).length;
    const totalScans = prototypes.reduce((acc, curr) => acc + (curr.scanCount || 0), 0);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Daily scans across user prototypes
    const dailyScans = await Scan.aggregate([
      {
        $match: {
          prototypeId: { $in: prototypeIds },
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

    const chartData = [];
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

    return NextResponse.json({
      success: true,
      stats: {
        totalPrototypes,
        totalScans,
        activeLinks,
        chartData,
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
