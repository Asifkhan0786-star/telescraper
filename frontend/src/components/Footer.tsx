import { Shield, Lock, FileSpreadsheet } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-sm">
          <div>
            <div className="flex items-center space-x-2 text-telegram-500 font-semibold mb-2">
              <Shield className="w-4 h-4" />
              <span>Legitimate Authorized Access</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Only exports member details accessible to your authenticated Telegram account. Respects user privacy flags, hidden members, and community permissions.
            </p>
          </div>

          <div>
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold mb-2">
              <Lock className="w-4 h-4" />
              <span>Encrypted Session Security</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Sessions are encrypted with AES-Fernet cryptography. OTP codes and 2FA passwords are never stored. Disconnect anytime with session revocation.
            </p>
          </div>

          <div>
            <div className="flex items-center space-x-2 text-sky-400 font-semibold mb-2">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Instant CSV Export</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Export Telegram group member lists to formatted CSV files directly for analytical or record-keeping purposes.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} TeleExport MVP. Production-structured Telegram export platform.</p>
          <p className="mt-2 sm:mt-0 font-mono">FastAPI • Telethon • Next.js • Tailwind</p>
        </div>
      </div>
    </footer>
  );
}
