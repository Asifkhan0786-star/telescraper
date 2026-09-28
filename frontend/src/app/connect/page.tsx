'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setAuthToken } from '@/lib/api';
import { Send, Shield, KeyRound, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

export default function ConnectPage() {
  const router = useRouter();

  const [step, setStep] = useState<'phone' | 'code' | '2fa'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [code, setCode] = useState('');
  const [password2FA, setPassword2FA] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phoneNumber.trim() || !phoneNumber.startsWith('+')) {
      setError('Please enter a valid phone number with country code (e.g. +1234567890).');
      return;
    }

    setLoading(true);
    try {
      const res = await api.startAuth(phoneNumber.trim());
      setPhoneCodeHash(res.phone_code_hash);
      setStep('code');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code to Telegram.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError('Please enter the verification code received on Telegram.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyAuth(phoneNumber.trim(), phoneCodeHash, code.trim());
      if (res.requires_2fa) {
        setStep('2fa');
      } else if (res.access_token) {
        setAuthToken(res.access_token);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password2FA) {
      setError('Please enter your 2FA password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verify2FA(phoneNumber.trim(), password2FA);
      if (res.access_token) {
        setAuthToken(res.access_token);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect 2FA password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="glass-panel p-8 rounded-3xl space-y-6 relative overflow-hidden border-slate-800">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-telegram-500">
          <Send className="w-32 h-32" />
        </div>

        {/* Step Header */}
        <div className="space-y-2 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-telegram-500/10 border border-telegram-500/30 flex items-center justify-center text-telegram-400 mb-3">
            {step === 'phone' && <Send className="w-6 h-6" />}
            {step === 'code' && <Shield className="w-6 h-6" />}
            {step === '2fa' && <KeyRound className="w-6 h-6" />}
          </div>

          <h2 className="text-2xl font-bold text-white">
            {step === 'phone' && 'Connect Telegram'}
            {step === 'code' && 'Enter Verification Code'}
            {step === '2fa' && '2FA Password Required'}
          </h2>

          <p className="text-xs text-slate-400">
            {step === 'phone' && 'Enter your phone number with country code to start authorized session.'}
            {step === 'code' && `We sent a code to Telegram on ${phoneNumber}`}
            {step === '2fa' && 'Your account is protected with Two-Step Verification.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* Form STEP 1: Phone */}
        {step === 'phone' && (
          <form onSubmit={handleStartAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Telegram Phone Number
              </label>
              <input
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-telegram-500 focus:ring-1 focus:ring-telegram-500 transition-all font-mono text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-telegram-600 to-sky-600 hover:from-telegram-500 hover:to-sky-500 text-white font-bold text-sm shadow-lg shadow-telegram-500/20 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Code...</span>
                </>
              ) : (
                <span>Send Code via Telegram</span>
              )}
            </button>
          </form>
        )}

        {/* Form STEP 2: Verification Code */}
        {step === 'code' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Telegram Verification Code
              </label>
              <input
                type="text"
                placeholder="12345"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-telegram-500 focus:ring-1 focus:ring-telegram-500 transition-all font-mono text-center text-lg tracking-widest"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-telegram-600 to-sky-600 hover:from-telegram-500 hover:to-sky-500 text-white font-bold text-sm shadow-lg shadow-telegram-500/20 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <span>Verify Code & Login</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setStep('phone'); setError(null); }}
              className="w-full text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center space-x-1 pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change phone number</span>
            </button>
          </form>
        )}

        {/* Form STEP 3: 2FA Password */}
        {step === '2fa' && (
          <form onSubmit={handleVerify2FA} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Two-Step Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password2FA}
                onChange={(e) => setPassword2FA(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-telegram-500 focus:ring-1 focus:ring-telegram-500 transition-all text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-telegram-600 to-sky-600 hover:from-telegram-500 hover:to-sky-500 text-white font-bold text-sm shadow-lg shadow-telegram-500/20 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Password...</span>
                </>
              ) : (
                <span>Submit 2FA Password</span>
              )}
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center space-y-1">
          <p className="flex items-center justify-center space-x-1">
            <CheckCircle className="w-3 h-3 text-emerald-500" />
            <span>Encrypted with AES-Fernet cryptography on server</span>
          </p>
          <p>We never persist verification codes or 2FA passwords.</p>
        </div>
      </div>
    </div>
  );
}
