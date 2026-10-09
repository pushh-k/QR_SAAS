"use client";

import Link from "next/navigation";
import { useEffect, useState } from "react";
import { QrCode, PlusCircle, LayoutDashboard, LogOut, LogIn, User as UserIcon, Sparkles } from "lucide-react";

interface UserState {
  id: string;
  name: string;
  email: string;
}

export default function Navbar() {
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <QrCode className="w-5 h-5 text-indigo-400 group-hover:text-cyan-300 transition-colors" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              QR Prototype
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO
              </span>
            </span>
          </div>
        </a>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-400">
          <a
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:text-white hover:bg-slate-900 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </a>
          <a
            href="/create"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:text-white hover:bg-slate-900 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Create
          </a>
          <a
            href="/dashboard?tab=analytics"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:text-white hover:bg-slate-900 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Analytics
          </a>
        </nav>

        {/* Auth / Action */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-8 bg-slate-900 animate-pulse rounded-lg" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full text-slate-300">
                <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-medium truncate max-w-[120px]">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 px-3 py-2 rounded-lg hover:bg-rose-500/10 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <a
                href="/login"
                className="text-xs font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-900 transition-colors"
              >
                Log In
              </a>
              <a
                href="/register"
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 rounded-lg transition-all shadow-md shadow-indigo-600/30"
              >
                Sign Up
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
