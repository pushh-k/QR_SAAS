import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Prototype } from "@/models/Prototype";
import { Scan } from "@/models/Scan";
import { parseUserAgent } from "@/lib/device-parser";

export const dynamic = "force-dynamic";

function renderNotFoundHtml(shortId: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prototype Not Found - QR Prototype</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #020617;
      color: #f8fafc;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 1.5rem;
      box-sizing: border-box;
    }
    .card {
      max-width: 440px;
      width: 100%;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 1.25rem;
      padding: 2.25rem 2rem;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .icon-box {
      width: 4rem;
      height: 4rem;
      margin: 0 auto 1.5rem;
      border-radius: 1rem;
      background: rgba(244, 63, 94, 0.1);
      border: 1px solid rgba(244, 63, 94, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fb7185;
      font-size: 2rem;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: rgba(244, 63, 94, 0.1);
      color: #fb7185;
      border: 1px solid rgba(244, 63, 94, 0.2);
      margin-bottom: 0.75rem;
    }
    h1 {
      font-size: 1.5rem;
      margin: 0 0 0.5rem;
      font-weight: 700;
    }
    p {
      color: #94a3b8;
      font-size: 0.875rem;
      line-height: 1.5;
      margin: 0 0 1.5rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      box-sizing: border-box;
      padding: 0.75rem 1.25rem;
      border-radius: 0.75rem;
      background: #4f46e5;
      color: #ffffff;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.875rem;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #4338ca;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-box">⚠️</div>
    <div class="badge">Error 404</div>
    <h1>Prototype Not Found</h1>
    <p>This prototype may have been deleted, moved, or does not exist.</p>
    <a href="/" class="btn">Go Home</a>
  </div>
</body>
</html>`;
}

function renderDisabledHtml(prototypeName: string, shortId: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prototype Unavailable - QR Prototype</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #020617;
      color: #f8fafc;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 1.5rem;
      box-sizing: border-box;
    }
    .card {
      max-width: 440px;
      width: 100%;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 1.25rem;
      padding: 2.25rem 2rem;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .icon-box {
      width: 4rem;
      height: 4rem;
      margin: 0 auto 1.5rem;
      border-radius: 1rem;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fbbf24;
      font-size: 2rem;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: rgba(245, 158, 11, 0.1);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.2);
      margin-bottom: 0.75rem;
    }
    h1 {
      font-size: 1.5rem;
      margin: 0 0 0.5rem;
      font-weight: 700;
    }
    p {
      color: #94a3b8;
      font-size: 0.875rem;
      line-height: 1.5;
      margin: 0 0 1.5rem;
    }
    .info {
      background: #1e293b;
      border-radius: 0.75rem;
      padding: 0.75rem 1rem;
      text-align: left;
      font-size: 0.75rem;
      color: #cbd5e1;
      margin-bottom: 1.5rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      box-sizing: border-box;
      padding: 0.75rem 1.25rem;
      border-radius: 0.75rem;
      background: #334155;
      color: #f8fafc;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.875rem;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #475569;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-box">🔒</div>
    <div class="badge">Inactive Link</div>
    <h1>Prototype Unavailable</h1>
    <p>This prototype has been temporarily disabled.</p>
    <div class="info">
      <div><strong>Prototype:</strong> ${prototypeName}</div>
      <div><strong>Short ID:</strong> ${shortId}</div>
    </div>
    <a href="/" class="btn">Go Home</a>
  </div>
</body>
</html>`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shortId: string }> }
) {
  try {
    const { shortId } = await params;

    await connectToDatabase();
    const prototype = await Prototype.findOne({ shortId });

    // 1. Link does not exist -> 404
    if (!prototype) {
      return new NextResponse(renderNotFoundHtml(shortId), {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // 2. Link is disabled -> Prototype Unavailable page
    if (!prototype.isActive) {
      return new NextResponse(renderDisabledHtml(prototype.name, shortId), {
        status: 403,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // 3. Link is active -> Record analytics & redirect
    const userAgent = req.headers.get("user-agent") || "";
    const referrer = req.headers.get("referer") || "Direct";
    const { device, browser, os } = parseUserAgent(userAgent);

    // Asynchronously log scan & increment scanCount
    try {
      await Promise.all([
        Scan.create({
          prototypeId: prototype._id,
          timestamp: new Date(),
          userAgent,
          device,
          browser,
          os,
          referrer,
        }),
        Prototype.updateOne({ _id: prototype._id }, { $inc: { scanCount: 1 } }),
      ]);
    } catch (logErr) {
      console.error("Error logging scan:", logErr);
    }

    // Perform HTTP 307 redirect
    return NextResponse.redirect(prototype.originalUrl, 307);
  } catch (error) {
    console.error("GET /p/[shortId] redirect error:", error);
    return new NextResponse(renderNotFoundHtml("error"), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
