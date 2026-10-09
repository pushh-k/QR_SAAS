"use client";

import { useEffect, useState } from "react";
import { X, BarChart3, Smartphone, Laptop, Tablet, Globe, RefreshCw, AlertCircle } from "lucide-react";

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prototypeId: string;
  prototypeName: string;
}

interface AnalyticsData {
  prototypeName: string;
  shortId: string;
  totalScans: number;
  today: number;
  last7Days: number;
  last30Days: number;
  devices: { label: string; count: number }[];
  browsers: { label: string; count: number }[];
  chartData: { date: string; label: string; scans: number }[];
  recentScans: {
    _id: string;
    timestamp: string;
    device: string;
    browser: string;
    os: string;
    referrer: string;
  }[];
}

export default function AnalyticsModal({
  isOpen,
  onClose,
  prototypeId,
  prototypeName,
}: AnalyticsModalProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);

    fetch(`/api/prototypes/${prototypeId}/analytics`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.analytics) {
          setData(resData.analytics);
        } else {
          setError(resData.message || "Failed to load analytics");
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch analytics");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, prototypeId]);

  if (!isOpen) return null;

  const maxScanValue = data?.chartData?.length
    ? Math.max(...data.chartData.map((d) => d.scans), 5)
    : 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-xl text-white">{prototypeName}</h3>
            <p className="text-xs text-slate-400">Prototype Scan Analytics & Engagement</p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
            <p className="text-xs">Aggregating scan data...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 block mb-1">Total Scans</span>
                <span className="text-2xl font-bold text-white tracking-tight">{data.totalScans}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 block mb-1">Today</span>
                <span className="text-2xl font-bold text-indigo-400 tracking-tight">{data.today}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 block mb-1">Last 7 Days</span>
                <span className="text-2xl font-bold text-cyan-400 tracking-tight">{data.last7Days}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 block mb-1">Last 30 Days</span>
                <span className="text-2xl font-bold text-emerald-400 tracking-tight">{data.last30Days}</span>
              </div>
            </div>

            {/* Scans Chart */}
            <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Daily Scan Velocity (Last 7 Days)
                </h4>
                <span className="text-xs text-slate-500">Live Telemetry</span>
              </div>

              <div className="h-44 flex items-end gap-2 sm:gap-4 pt-6 pb-2 px-2 border-b border-slate-800">
                {data.chartData.map((day, idx) => {
                  const heightPercent = Math.max((day.scans / maxScanValue) * 100, 4);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <div className="text-[10px] text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.scans}
                      </div>
                      <div
                        className="w-full max-w-[36px] rounded-t-md bg-gradient-to-t from-indigo-600 to-cyan-400 group-hover:from-indigo-500 group-hover:to-cyan-300 transition-all cursor-pointer relative"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[10px] text-slate-500 mt-2 truncate w-full text-center">
                        {day.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Devices & Browsers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Devices */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                  Devices
                </h4>
                {data.devices.length === 0 ? (
                  <p className="text-xs text-slate-500">No device data recorded yet</p>
                ) : (
                  <div className="space-y-2.5">
                    {data.devices.map((dev, i) => {
                      const total = data.totalScans || 1;
                      const pct = Math.round((dev.count / total) * 100);
                      return (
                        <div key={i} className="text-xs">
                          <div className="flex justify-between text-slate-300 mb-1">
                            <span className="flex items-center gap-1.5">
                              {dev.label === "Mobile" ? (
                                <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                              ) : dev.label === "Tablet" ? (
                                <Tablet className="w-3.5 h-3.5 text-cyan-400" />
                              ) : (
                                <Laptop className="w-3.5 h-3.5 text-slate-400" />
                              )}
                              {dev.label}
                            </span>
                            <span className="font-mono text-slate-400">{dev.count} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Browsers */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                  Browsers
                </h4>
                {data.browsers.length === 0 ? (
                  <p className="text-xs text-slate-500">No browser data recorded yet</p>
                ) : (
                  <div className="space-y-2.5">
                    {data.browsers.map((b, i) => {
                      const total = data.totalScans || 1;
                      const pct = Math.round((b.count / total) * 100);
                      return (
                        <div key={i} className="text-xs">
                          <div className="flex justify-between text-slate-300 mb-1">
                            <span className="flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5 text-cyan-400" />
                              {b.label}
                            </span>
                            <span className="font-mono text-slate-400">{b.count} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Scans Table */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Recent Scan Logs (Latest {data.recentScans.length})
              </h4>
              {data.recentScans.length === 0 ? (
                <p className="text-xs text-slate-500">No scan events logged yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-2 font-medium">Timestamp</th>
                        <th className="pb-2 font-medium">Device</th>
                        <th className="pb-2 font-medium">Browser</th>
                        <th className="pb-2 font-medium">OS</th>
                        <th className="pb-2 font-medium">Referrer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {data.recentScans.map((scan) => (
                        <tr key={scan._id} className="hover:bg-slate-900/50">
                          <td className="py-2.5 pr-2 font-mono text-slate-400 text-[11px]">
                            {new Date(scan.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2.5 pr-2">{scan.device}</td>
                          <td className="py-2.5 pr-2">{scan.browser}</td>
                          <td className="py-2.5 pr-2">{scan.os}</td>
                          <td className="py-2.5 text-slate-400 truncate max-w-[120px]">{scan.referrer}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
