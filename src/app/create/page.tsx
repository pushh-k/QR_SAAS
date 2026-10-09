"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import {
  QrCode,
  ArrowRight,
  Copy,
  Check,
  Download,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowLeft,
} from "lucide-react";

export default function CreatePrototypePage() {
  const [name, setName] = useState("");
  const [originalUrl, setOriginalUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<{
    shortUrl: string;
    originalUrl: string;
    name: string;
    qrCodePng: string;
    qrCodeSvg: string;
    shortId: string;
    _id: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let urlToUse = originalUrl.trim();
    if (!urlToUse) {
      setError("Please enter a destination URL");
      return;
    }

    if (!/^https?:\/\//i.test(urlToUse)) {
      urlToUse = `https://${urlToUse}`;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/prototypes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "My New Prototype",
          originalUrl: urlToUse,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create prototype");
      }

      setResult({
        shortUrl: data.shortUrl,
        originalUrl: data.prototype.originalUrl,
        name: data.prototype.name,
        qrCodePng: data.qrCodePng,
        qrCodeSvg: data.qrCodeSvg,
        shortId: data.prototype.shortId,
        _id: data.prototype._id,
      });
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadPng = () => {
    if (!result?.qrCodePng) return;
    const link = document.createElement("a");
    link.href = result.qrCodePng;
    link.download = `${result.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSvg = () => {
    if (!result?.qrCodeSvg) return;
    const blob = new Blob([result.qrCodeSvg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${result.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-qr.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="mb-8">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </a>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Create New Prototype
          </h1>
          <p className="text-sm text-slate-400">
            Generate an editable dynamic QR code that forwards visitors to your interactive design or app.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Creation Form */}
          <div className="md:col-span-7 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Prototype Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My New Prototype"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Destination URL
                </label>
                <input
                  type="text"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  You can update this destination anytime later without re-printing the QR code.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating QR Code...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    Generate QR
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Result or Placeholder Preview */}
          <div className="md:col-span-5">
            {result ? (
              <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl animate-in fade-in duration-300 relative overflow-hidden">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Prototype created successfully
                </div>

                <div className="text-center">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-2">
                    QR CODE
                  </span>

                  {/* QR Image with crisp white quiet zone */}
                  <div className="p-4 bg-white rounded-2xl shadow-xl inline-block border border-slate-200 mb-4">
                    <img
                      src={result.qrCodePng}
                      alt="Generated QR"
                      className="w-48 h-48 object-contain"
                    />
                  </div>

                  <div className="text-left bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 mb-4">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                      Scan URL:
                    </p>
                    <p className="font-mono text-xs text-indigo-400 truncate select-all">
                      {result.shortUrl}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleCopy}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Copied URL" : "Copy URL"}
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleDownloadPng}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/20"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download PNG
                      </button>
                      <button
                        onClick={handleDownloadSvg}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                        Download SVG
                      </button>
                    </div>

                    <a
                      href={result.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-medium border border-cyan-500/30 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Prototype
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[320px]">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-center text-slate-500 mb-4">
                  <QrCode className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-semibold text-slate-300 mb-1">
                  Live Preview Standby
                </h3>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Fill in your prototype details on the left to generate your unique scannable dynamic QR code.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
