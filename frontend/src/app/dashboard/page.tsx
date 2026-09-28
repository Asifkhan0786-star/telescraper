'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getAuthToken, removeAuthToken } from '@/lib/api';
import { ShieldCheck, Users, LogOut, ArrowRight, Activity, Lock, Layers } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [userStatus, setUserStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/connect');
      return;
    }

    api.getAuthStatus()
      .then((res) => {
        if (res.is_authenticated) {
          setUserStatus(res);
        } else {
          removeAuthToken();
          router.push('/connect');
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load user session.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const handleDisconnect = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      removeAuthToken();
      router.push('/connect');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-telegram-500/30 border-t-telegram-500 rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-400">Loading Telegram Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border-slate-800">
        <div>
          <span className="text-xs font-mono text-telegram-500 uppercase tracking-widest">Authenticated Overview</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">Telegram Account Dashboard</h1>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/groups"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-telegram-600 to-sky-600 hover:from-telegram-500 hover:to-sky-500 text-white font-medium text-sm shadow-md flex items-center space-x-2 transition-all"
          >
            <Users className="w-4 h-4" />
            <span>Browse Groups</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-sm font-medium transition-all flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Disconnect</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Account Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Account Info */}
        <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Account Identity</span>
            <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Active MTProto Session</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
              <span className="text-slate-400">Phone Number</span>
              <span className="font-mono text-white font-medium">{userStatus?.phone_number || 'N/A'}</span>
            </div>

            <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
              <span className="text-slate-400">Telegram ID</span>
              <span className="font-mono text-white font-medium">{userStatus?.telegram_id || 'N/A'}</span>
            </div>

            <div className="flex justify-between items-center text-sm pt-1">
              <span className="text-slate-400">Username</span>
              <span className="font-mono text-telegram-400 font-medium">@{userStatus?.username || 'none'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Security & Session Status */}
        <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Encryption Status</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
              <p className="font-semibold text-slate-200">Fernet Session Vault</p>
              <p className="text-slate-400">Session key is encrypted at rest on backend using AES-256 Fernet payload encryption.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
              <p className="font-semibold text-slate-200">Zero Credential Exposure</p>
              <p className="text-slate-400">Neither raw session strings nor api_hash are accessible to browser code.</p>
            </div>
          </div>
        </div>

        {/* Card 3: Quick Export Actions */}
        <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Export Controls</span>
              <Layers className="w-4 h-4 text-sky-400" />
            </div>
            <h3 className="text-lg font-bold text-white pt-2">Ready to Export</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Access your legitimate Telegram chats, select any group or supergroup, view accessible members, and download CSV reports.
            </p>
          </div>

          <Link
            href="/groups"
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center justify-center space-x-2 transition-all border border-slate-700"
          >
            <span>View All Groups & Channels</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
