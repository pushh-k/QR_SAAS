"use client";

import { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import QRCodeModal from "@/components/QRCodeModal";
import EditPrototypeModal from "@/components/EditPrototypeModal";
import AnalyticsModal from "@/components/AnalyticsModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import {
  QrCode,
  Plus,
  Copy,
  Check,
  Download,
  Edit,
  Power,
  Trash2,
  BarChart2,
  ExternalLink,
  Layers,
  Activity,
  CheckCircle,
  Eye,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface PrototypeItem {
  _id: string;
  name: string;
  shortId: string;
  originalUrl: string;
  isActive: boolean;
  scanCount: number;
  shortUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardStats {
  totalPrototypes: number;
  totalScans: number;
  activeLinks: number;
  chartData: { date: string; label: string; scans: number }[];
}

export default function DashboardPage() {
  const [prototypes, setPrototypes] = useState<PrototypeItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [selectedQr, setSelectedQr] = useState<PrototypeItem | null>(null);
  const [qrPng, setQrPng] = useState<string | undefined>(undefined);
  const [qrSvg, setQrSvg] = useState<string | undefined>(undefined);

  const [editingPrototype, setEditingPrototype] = useState<PrototypeItem | null>(null);
  const [analyticsPrototype, setAnalyticsPrototype] = useState<PrototypeItem | null>(null);
  const [deletingPrototype, setDeletingPrototype] = useState<PrototypeItem | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [protoRes, statsRes] = await Promise.all([
        fetch("/api/prototypes"),
        fetch("/api/dashboard/stats"),
      ]);

      const protoData = await protoRes.json();
      const statsData = await statsRes.json();

      if (protoData.success) {
        setPrototypes(protoData.prototypes || []);
      }
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered prototypes
  const filteredPrototypes = useMemo(() => {
    return prototypes.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.originalUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.shortId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? item.isActive
          : !item.isActive;

      return matchesSearch && matchesStatus;
    });
  }, [prototypes, searchQuery, statusFilter]);

  const handleCopyUrl = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error("Failed to copy:", e);
    }
  };

  const handleToggleActive = async (proto: PrototypeItem) => {
    try {
      const res = await fetch(`/api/prototypes/${proto._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !proto.isActive }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenQrModal = async (proto: PrototypeItem) => {
    setSelectedQr(proto);
    try {
      const res = await fetch(`/api/prototypes/${proto._id}`);
      const data = await res.json();
      if (data.success) {
        setQrPng(data.qrCodePng);
        setQrSvg(data.qrCodeSvg);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPrototype) return;
    try {
      const res = await fetch(`/api/prototypes/${deletingPrototype._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Prototypes Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage dynamic destination links, download QR graphics, and inspect live scan telemetry.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <a
              href="/create"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm transition-all shadow-md shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              New Prototype
            </a>
          </div>
        </div>

        {/* Dashboard 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative overflow-hidden backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Prototypes
              </span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {stats ? stats.totalPrototypes : prototypes.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">Managed dynamic QR routes</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative overflow-hidden backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Scans
              </span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-cyan-400 tracking-tight">
              {stats
                ? stats.totalScans.toLocaleString()
                : prototypes.reduce((a, b) => a + (b.scanCount || 0), 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">Across all live test prototypes</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative overflow-hidden backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Links
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              {stats
                ? stats.activeLinks
                : prototypes.filter((p) => p.isActive).length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">Currently active & redirecting</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, URL, or short ID..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-500 hidden sm:inline">Status:</span>
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === "active"
                  ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("disabled")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === "disabled"
                  ? "bg-amber-600/30 text-amber-300 border border-amber-500/40"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              Disabled
            </button>
          </div>
        </div>

        {/* Main Content Area: Responsive Table (Desktop) & Cards (Mobile) */}
        {loading && prototypes.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
            <p className="text-sm">Loading prototypes...</p>
          </div>
        ) : filteredPrototypes.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-slate-900/40 border border-slate-800 p-8">
            <QrCode className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">No Prototypes Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
              {searchQuery
                ? "No prototypes match your search query."
                : "You haven't generated any prototypes yet. Create your first dynamic QR code now!"}
            </p>
            <a
              href="/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-md shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              Create Prototype
            </a>
          </div>
        ) : (
          <div>
            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400">
                    <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Name</th>
                    <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Destination URL</th>
                    <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Short URL</th>
                    <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Scans</th>
                    <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Status</th>
                    <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Created</th>
                    <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPrototypes.map((proto) => (
                    <tr key={proto._id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Name */}
                      <td className="py-4 px-4 font-medium text-white max-w-[180px] truncate">
                        <div className="font-semibold text-slate-100 truncate">{proto.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">ID: {proto.shortId}</div>
                      </td>

                      {/* Original URL */}
                      <td className="py-4 px-4 max-w-[220px]">
                        <a
                          href={proto.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-300 hover:text-white truncate block flex items-center gap-1.5"
                          title={proto.originalUrl}
                        >
                          <span className="truncate">{proto.originalUrl}</span>
                          <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                        </a>
                      </td>

                      {/* Short URL */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-indigo-400 truncate max-w-[150px]">
                            {proto.shortUrl}
                          </span>
                          <button
                            onClick={() => handleCopyUrl(proto._id, proto.shortUrl)}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Copy short link"
                          >
                            {copiedId === proto._id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Scans */}
                      <td className="py-4 px-4 font-bold text-cyan-400 font-mono text-sm">
                        {proto.scanCount || 0}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleToggleActive(proto)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                            proto.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
                          }`}
                          title="Click to toggle status"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              proto.isActive ? "bg-emerald-400" : "bg-amber-400"
                            }`}
                          />
                          {proto.isActive ? "Active" : "Disabled"}
                        </button>
                      </td>

                      {/* Created Date */}
                      <td className="py-4 px-4 text-slate-400 text-[11px]">
                        {new Date(proto.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenQrModal(proto)}
                            className="p-2 rounded-lg bg-slate-800/80 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 transition-all border border-slate-700/60"
                            title="View & Download QR"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setAnalyticsPrototype(proto)}
                            className="p-2 rounded-lg bg-slate-800/80 hover:bg-cyan-600/30 text-slate-300 hover:text-cyan-300 transition-all border border-slate-700/60"
                            title="View Analytics"
                          >
                            <BarChart2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingPrototype(proto)}
                            className="p-2 rounded-lg bg-slate-800/80 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 transition-all border border-slate-700/60"
                            title="Edit Destination URL"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingPrototype(proto)}
                            className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-600/30 text-slate-300 hover:text-rose-400 transition-all border border-slate-700/60"
                            title="Delete Prototype"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (Shown on small/medium screens) */}
            <div className="lg:hidden space-y-4">
              {filteredPrototypes.map((proto) => (
                <div
                  key={proto._id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-white text-base">{proto.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        ID: {proto.shortId} &bull; Created {new Date(proto.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleActive(proto)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                        proto.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          proto.isActive ? "bg-emerald-400" : "bg-amber-400"
                        }`}
                      />
                      {proto.isActive ? "Active" : "Disabled"}
                    </button>
                  </div>

                  {/* URLs */}
                  <div className="space-y-1.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                      <span className="font-mono text-indigo-400 truncate text-[11px]">
                        {proto.shortUrl}
                      </span>
                      <button
                        onClick={() => handleCopyUrl(proto._id, proto.shortUrl)}
                        className="p-1 text-slate-400 hover:text-white shrink-0"
                      >
                        {copiedId === proto._id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="text-slate-400 truncate flex items-center gap-1 text-[11px] px-1">
                      <span>Destination:</span>
                      <a
                        href={proto.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-300 underline truncate"
                      >
                        {proto.originalUrl}
                      </a>
                    </div>
                  </div>

                  {/* Scans & Actions Bar */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="text-xs">
                      <span className="text-slate-500">Scans: </span>
                      <span className="font-bold text-cyan-400 font-mono">{proto.scanCount || 0}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenQrModal(proto)}
                        className="p-2 rounded-lg bg-slate-800 text-slate-200"
                        title="View QR"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setAnalyticsPrototype(proto)}
                        className="p-2 rounded-lg bg-slate-800 text-cyan-300"
                        title="Analytics"
                      >
                        <BarChart2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingPrototype(proto)}
                        className="p-2 rounded-lg bg-slate-800 text-indigo-300"
                        title="Edit Link"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingPrototype(proto)}
                        className="p-2 rounded-lg bg-slate-800 text-rose-400"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* QR Code Modal */}
      {selectedQr && (
        <QRCodeModal
          isOpen={!!selectedQr}
          onClose={() => setSelectedQr(null)}
          prototypeName={selectedQr.name}
          shortUrl={selectedQr.shortUrl}
          originalUrl={selectedQr.originalUrl}
          qrCodePng={qrPng}
          qrCodeSvg={qrSvg}
        />
      )}

      {/* Edit Prototype Modal */}
      {editingPrototype && (
        <EditPrototypeModal
          isOpen={!!editingPrototype}
          onClose={() => setEditingPrototype(null)}
          prototype={editingPrototype}
          onSuccess={fetchData}
        />
      )}

      {/* Analytics Modal */}
      {analyticsPrototype && (
        <AnalyticsModal
          isOpen={!!analyticsPrototype}
          onClose={() => setAnalyticsPrototype(null)}
          prototypeId={analyticsPrototype._id}
          prototypeName={analyticsPrototype.name}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingPrototype && (
        <DeleteConfirmModal
          isOpen={!!deletingPrototype}
          onClose={() => setDeletingPrototype(null)}
          prototypeName={deletingPrototype.name}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
