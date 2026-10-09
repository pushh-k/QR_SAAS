"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import QRCodeModal from "@/components/QRCodeModal";
import {
  QrCode,
  ArrowRight,
  Sparkles,
  Zap,
  BarChart2,
  RefreshCw,
  ShieldCheck,
  Copy,
  Check,
  Download,
  ExternalLink,
  Smartphone,
  ChevronRight,
  Layers,
  Clock,
  Eye,
} from "lucide-react";

export default function LandingPage() {
  const [urlInput, setUrlInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{
    shortUrl: string;
    originalUrl: string;
    name: string;
    qrCodePng: string;
    qrCodeSvg: string;
    shortId: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const [activeModal, setActiveModal] = useState(false);

  const handleQuickGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let formattedUrl = urlInput.trim();
    if (!formattedUrl) {
      setError("Please enter a destination URL");
      return;
    }

    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/prototypes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalUrl: formattedUrl,
          name: nameInput.trim() || "Quick Prototype",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to generate QR code");
      }

      setCreatedResult({
        shortUrl: data.shortUrl,
        originalUrl: data.prototype.originalUrl,
        name: data.prototype.name,
        qrCodePng: data.qrCodePng,
        qrCodeSvg: data.qrCodeSvg,
        shortId: data.prototype.shortId,
      });
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!createdResult) return;
    try {
      await navigator.clipboard.writeText(createdResult.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadPng = () => {
    if (!createdResult?.qrCodePng) return;
    const link = document.createElement("a");
    link.href = createdResult.qrCodePng;
    link.download = `prototype-${createdResult.shortId}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden border-b border-slate-800/60">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/20 to-cyan-500/20 blur-[130px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Dynamic QR & Prototype Management Platform
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Turn Any Link Into a{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                QR-Powered Prototype
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 font-normal leading-relaxed">
              Paste a URL, generate a QR code, and share your prototype instantly. Update the destination anytime without reprinting your code.
            </p>
          </div>

          {/* Generator Form Card */}
          <div className="max-w-2xl mx-auto">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl relative">
              <form onSubmit={handleQuickGenerate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Prototype Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="e.g. Mobile Checkout Redesign"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Destination URL
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/prototype-v1"
                      required
                      className="w-full pl-4 pr-32 py-3.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="absolute right-1.5 top-1.5 bottom-1.5 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Generating</span>
                        </>
                      ) : (
                        <>
                          <span>Generate QR</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-rose-400 font-medium pt-1">{error}</p>
                )}
              </form>

              {/* Instant Output Result */}
              {createdResult && (
                <div className="mt-8 pt-6 border-t border-slate-800/80 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                    {/* QR Preview */}
                    <div className="p-3 bg-white rounded-xl shadow-lg shrink-0">
                      <img
                        src={createdResult.qrCodePng}
                        alt="Generated QR Code"
                        className="w-32 h-32 object-contain"
                      />
                    </div>

                    <div className="flex-1 w-full space-y-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Active Dynamic Link
                        </span>
                        <h4 className="font-semibold text-white text-base mt-1.5 truncate">
                          {createdResult.name}
                        </h4>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-indigo-300 truncate">
                          {createdResult.shortUrl}
                        </span>
                        <button
                          onClick={handleCopy}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition-all shrink-0"
                        >
                          {copied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          {copied ? "Copied" : "Copy"}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          onClick={handleDownloadPng}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download PNG
                        </button>
                        <a
                          href={createdResult.shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all border border-slate-700"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Test Redirect
                        </a>
                        <a
                          href="/dashboard"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 text-xs font-medium transition-all border border-indigo-800/40"
                        >
                          <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                          Manage in Dashboard
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How Dynamic Links Work Section */}
      <section className="py-20 border-b border-slate-800/60 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              How Dynamic Routing Works
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Never re-print a QR code again. Your QR points to the platform, and the platform forwards users anywhere you choose.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm mb-4">
                1
              </div>
              <h3 className="text-base font-semibold text-white mb-2">You Enter a Destination</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Provide your prototype link, Figma link, staging website, or documentation page.
              </p>
              <div className="p-3 rounded-xl bg-slate-950 text-slate-300 font-mono text-[11px] truncate border border-slate-800/80">
                https://figma.com/proto/xyz987
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm mb-4">
                2
              </div>
              <h3 className="text-base font-semibold text-white mb-2">We Generate a Static QR</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Your QR code encodes a permanent short URL routed through the platform.
              </p>
              <div className="p-3 rounded-xl bg-slate-950 text-indigo-400 font-mono text-[11px] truncate border border-slate-800/80">
                https://yourapp.com/p/abc123
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm mb-4">
                3
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Edit Anytime with 1 Click</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Change your prototype destination from v1 to v2. The QR code continues working flawlessly.
              </p>
              <div className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] truncate border border-slate-800/80">
                https://newprototype.com/v2
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">
              Enterprise Grade
            </span>
            <h2 className="text-3xl font-bold text-white mt-2 mb-4">
              Engineered for Product Teams & Designers
            </h2>
            <p className="text-sm text-slate-400">
              Everything you need to test mobile prototypes in user research, exhibitions, and client presentations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Instant Dynamic Redirects</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Superfast sub-50ms HTTP redirects ensure users experience no delay when scanning from their phone cameras.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Real-Time Scan Analytics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Track scan counts, mobile vs desktop breakdown, browser distribution, and time-series trends.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Print-Ready Vector SVG & PNG</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Export crisp PNGs or infinitely scalable vector SVGs optimized for flyers, stands, and mobile screens.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Link Disable & Kill Switch</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Temporarily pause redirect access anytime with a single toggle switch when running embargoed tests.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">High Error Correction</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Encoded with Level H error correction (30% recovery) so codes scan reliably even in poor lighting or on curved surfaces.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Multi-Prototype Dashboard</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Organize, search, and manage all your test variations and clients in one centralized workspace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <footer className="mt-auto py-12 bg-slate-950 border-t border-slate-800/80 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-300">QR Prototype Platform</span>
            <span>&copy; 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/dashboard" className="hover:text-slate-300 transition-colors">
              Dashboard
            </a>
            <a href="/create" className="hover:text-slate-300 transition-colors">
              Create Prototype
            </a>
            <a href="/login" className="hover:text-slate-300 transition-colors">
              Sign In
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
