'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, getAuthToken, removeAuthToken } from '@/lib/api';
import { ShieldCheck, LogOut, Send, LayoutDashboard, Users } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api.getAuthStatus()
        .then((res) => {
          if (res.is_authenticated) {
            setUser(res);
          } else {
            removeAuthToken();
            setUser(null);
          }
        })
        .catch(() => {
          removeAuthToken();
          setUser(null);
        });
    } else {
      setUser(null);
    }
  }, [pathname]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await api.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      removeAuthToken();
      setUser(null);
      setLoading(false);
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="p-2 rounded-xl bg-telegram-500/10 border border-telegram-500/30 text-telegram-500 group-hover:bg-telegram-500 group-hover:text-white transition-all duration-300">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-white tracking-tight">TeleExport</span>
            <span className="text-xs ml-1.5 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">MVP</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link
            href="/"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/' ? 'text-white bg-slate-800/60' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            Home
          </Link>
          {user && (
            <>
              <Link
                href="/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  pathname === '/dashboard' ? 'text-white bg-slate-800/60' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/groups"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  pathname.startsWith('/groups') ? 'text-white bg-slate-800/60' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Groups</span>
              </Link>
            </>
          )}
        </nav>

        {/* Right Auth Action */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-mono text-slate-400">@{user.username || 'Connected'}</span>
              </div>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{loading ? 'Disconnecting...' : 'Disconnect'}</span>
              </button>
            </div>
          ) : (
            <Link
              href="/connect"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-telegram-600 to-sky-600 hover:from-telegram-500 hover:to-sky-500 text-white font-medium text-sm shadow-lg shadow-telegram-500/20 transition-all duration-200"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Connect Telegram</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
