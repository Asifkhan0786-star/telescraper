import Link from 'next/link';
import { Shield, ArrowRight, Download, Users, Lock, CheckCircle2, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="space-y-20 py-6">
      {/* Hero Section */}
      <section className="text-center space-y-8 max-w-4xl mx-auto pt-10">
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass-panel text-telegram-500 text-xs font-semibold uppercase tracking-wider">
          <Shield className="w-4 h-4" />
          <span>Official MTProto API Authorization</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Export Accessible Telegram Group Data <br />
          <span className="gradient-text">Securely & Effortlessly</span>
        </h1>

        <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
          Connect your authorized Telegram account to view group dialogs, inspect accessible member details, and download clean CSV reports with built-in privacy compliance.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/connect"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-telegram-600 via-sky-500 to-indigo-600 hover:from-telegram-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-telegram-500/25 transition-all duration-300 flex items-center justify-center space-x-3 group"
          >
            <span>Connect Telegram Account</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-4 rounded-xl glass-panel text-slate-300 hover:text-white font-medium text-base transition-colors flex items-center justify-center space-x-2"
          >
            <span>Go to Dashboard</span>
          </Link>
        </div>

        {/* Security callout indicators */}
        <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400 font-medium">
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>No api_hash asked from users</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Zero OTP or Password persistence</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Revokable Fernet encrypted session</span>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-panel p-8 rounded-2xl space-y-4 hover:border-slate-700 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-telegram-500/10 border border-telegram-500/30 flex items-center justify-center text-telegram-400">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">OAuth-Style User Auth</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Authenticates directly via Telegram OTP SMS/App codes and optional 2FA. Stores credentials only as encrypted sessions on server side.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl space-y-4 hover:border-slate-700 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Group Member Pagination</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Fetch groups and channels accessible to your account. Paginate member lists dynamically with instant search and bot filtering.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl space-y-4 hover:border-slate-700 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Download className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Formatted CSV Export</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Export member lists into formatted CSV files containing names, IDs, usernames, and bot badges legitimately provided by MTProto API.
          </p>
        </div>
      </section>

      {/* User Flow Workflow Steps */}
      <section className="glass-panel rounded-3xl p-8 sm:p-12 space-y-8 border-slate-800">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono text-telegram-500 uppercase tracking-widest">How it works</span>
          <h2 className="text-3xl font-bold text-white">Simple 4-Step Export Workflow</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <span className="w-8 h-8 rounded-lg bg-telegram-500/20 text-telegram-400 flex items-center justify-center font-bold text-sm">1</span>
            <h4 className="font-semibold text-white">Connect Phone</h4>
            <p className="text-xs text-slate-400">Enter your phone number to receive an authorization code on your official Telegram app.</p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <span className="w-8 h-8 rounded-lg bg-telegram-500/20 text-telegram-400 flex items-center justify-center font-bold text-sm">2</span>
            <h4 className="font-semibold text-white">Verify OTP Code</h4>
            <p className="text-xs text-slate-400">Enter the verification code (and optional 2FA password) to authenticate your account session.</p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <span className="w-8 h-8 rounded-lg bg-telegram-500/20 text-telegram-400 flex items-center justify-center font-bold text-sm">3</span>
            <h4 className="font-semibold text-white">Select Group</h4>
            <p className="text-xs text-slate-400">View accessible groups/channels and click to fetch members allowed for your profile.</p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <span className="w-8 h-8 rounded-lg bg-telegram-500/20 text-telegram-400 flex items-center justify-center font-bold text-sm">4</span>
            <h4 className="font-semibold text-white">Download CSV</h4>
            <p className="text-xs text-slate-400">Search members in table view or instantly trigger a CSV file download for records.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
