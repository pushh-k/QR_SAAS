"use client";

import { useState } from "react";
import { X, Copy, Check, Download, ExternalLink, QrCode } from "lucide-react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  prototypeName: string;
  shortUrl: string;
  originalUrl: string;
  qrCodePng?: string;
  qrCodeSvg?: string;
}

export default function QRCodeModal({
  isOpen,
  onClose,
  prototypeName,
  shortUrl,
  originalUrl,
  qrCodePng,
  qrCodeSvg,
}: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy:", e);
    }
  };

  const handleDownloadPng = () => {
    if (!qrCodePng) return;
    const link = document.createElement("a");
    link.href = qrCodePng;
    link.download = `${prototypeName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSvg = () => {
    if (!qrCodeSvg) return;
    const blob = new Blob([qrCodeSvg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${prototypeName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-qr.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white leading-tight">{prototypeName}</h3>
            <p className="text-xs text-slate-400">Scannable High-Resolution QR Code</p>
          </div>
        </div>

        {/* QR Code Container (White background, proper quiet zone) */}
        <div className="flex justify-center my-4">
          <div className="p-4 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-200">
            {qrCodePng ? (
              <img
                src={qrCodePng}
                alt={`QR code for ${prototypeName}`}
                className="w-56 h-56 object-contain"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-sm">
                Generating QR...
              </div>
            )}
          </div>
        </div>

        {/* Platform URL Card */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Dynamic QR Target</p>
            <p className="text-xs font-mono text-indigo-400 truncate">{shortUrl}</p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition-all shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {/* Destination preview */}
        <div className="mt-2 text-xs text-slate-400 px-1 truncate flex items-center gap-1.5">
          <span>Redirects to:</span>
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-300 hover:text-white underline truncate inline-flex items-center gap-1"
          >
            {originalUrl}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Download Actions */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={handleDownloadPng}
            disabled={!qrCodePng}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </button>
          <button
            onClick={handleDownloadSvg}
            disabled={!qrCodeSvg}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            Download SVG
          </button>
        </div>
      </div>
    </div>
  );
}
