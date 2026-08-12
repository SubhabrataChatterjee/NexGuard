import React, { useState } from 'react';
import { Shield, Mail, Lock, User as UserIcon, Phone, ArrowRight, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound, RefreshCw, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { isValidEmail, sanitizeEmail } from '../utils/validation';
import { User, UserSettings } from '../types';

interface AuthModalProps {
  onSuccess: (user: User, settings: UserSettings) => void;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, onClose }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [step, setStep] = useState<'form' | 'verification'>('form');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(true);

  // Email verification step states
  const [verificationCode, setVerificationCode] = useState('');
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cleanEmail = sanitizeEmail(email);
  const emailIsValid = email.trim().length > 0 ? isValidEmail(cleanEmail) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formattedEmail = sanitizeEmail(email);

    if (!isValidEmail(formattedEmail)) {
      setError('Please enter a valid email address (e.g. name@domain.com). Invalid domain or format.');
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim() || !formattedEmail || !password) {
        setError('Please fill in all required fields.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!agreedTerms) {
        setError('You must agree to the Terms of Service.');
        return;
      }
    } else {
      if (!formattedEmail || !password) {
        setError('Please enter your registered email address and password.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const res = await api.register({
          full_name: fullName,
          email: formattedEmail,
          password,
          phone: phone || undefined,
        });

        if (res.requires_verification) {
          setStep('verification');
          if (res.demo_code) {
            setDemoCodeHint(res.demo_code);
            setVerificationCode(res.demo_code);
          }
        } else if (res.token) {
          localStorage.setItem('nexguard_token', res.token);
          onSuccess(res.user, res.settings);
        }
      } else {
        const res = await api.login({ email: formattedEmail, password });

        if (res.requires_verification) {
          setStep('verification');
          if (res.demo_code) {
            setDemoCodeHint(res.demo_code);
            setVerificationCode(res.demo_code);
          }
        } else if (res.token) {
          localStorage.setItem('nexguard_token', res.token);
          onSuccess(res.user, res.settings);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your email ID or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!verificationCode || verificationCode.trim().length < 4) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const formattedEmail = sanitizeEmail(email);
      const res = await api.verifyEmail({ email: formattedEmail, code: verificationCode.trim() });
      if (res.token) {
        localStorage.setItem('nexguard_token', res.token);
        onSuccess(res.user, res.settings);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setResendStatus(null);
    try {
      const formattedEmail = sanitizeEmail(email);
      const res = await api.resendVerificationCode(formattedEmail);
      if (res.demo_code) {
        setDemoCodeHint(res.demo_code);
        setVerificationCode(res.demo_code);
      }
      setResendStatus('New verification code sent to your email!');
      setTimeout(() => setResendStatus(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col md:flex-row">
      {/* Left Column - Visual Branding */}
      <div className="hidden md:flex w-1/2 bg-[#f2f3f6] relative flex-col justify-center items-center p-12 overflow-hidden border-r border-[#e1e2e5]">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#6c4ce8]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#785fe1]/20 rounded-full blur-3xl" />

        <div className="relative z-10 text-center max-w-md space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#532dcf] text-white flex items-center justify-center mx-auto shadow-md">
            <Shield className="w-10 h-10 fill-current" />
          </div>
          <h1 className="text-4xl font-extrabold text-[#191c1e] tracking-tight">Adaptive Serenity.</h1>
          <p className="text-[#484555] text-base leading-relaxed">
            Your digital sanctuary for safety and peace of mind. Strict email security, verified encryption, and instant protection.
          </p>
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-[#e1e2e5] text-xs font-semibold text-[#532dcf]">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Strict Verified Email Authentication Active</span>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-[420px] space-y-8">
          {/* Header */}
          <div className="text-center md:text-left space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-2 text-[#532dcf]">
              <Shield className="w-8 h-8 fill-current" />
              <span className="text-2xl font-bold tracking-tight">NexGuard</span>
            </div>
            <h2 className="text-2xl font-bold text-[#191c1e]">
              {step === 'verification'
                ? 'Verify Your Email'
                : mode === 'signup'
                ? 'Create an account'
                : 'Welcome back'}
            </h2>
            <p className="text-sm text-[#484555]">
              {step === 'verification'
                ? `Enter the 6-digit code sent to ${cleanEmail}`
                : mode === 'signup'
                ? 'Join our verified safety platform today.'
                : 'Sign in with your verified email address.'}
            </p>
          </div>

          {/* Demo Account Quick Selector */}
          {step === 'form' && mode === 'signin' && (
            <div className="p-3.5 bg-[#f2f3f6] rounded-2xl border border-[#e1e2e5] space-y-2">
              <div className="text-xs font-bold text-[#191c1e] flex items-center justify-between">
                <span>Quick Demo Accounts</span>
                <span className="text-[10px] text-[#532dcf] font-semibold bg-white px-2 py-0.5 rounded-full border border-[#e1e2e5]">1-Click Login</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setEmail('alex@nexguard.app');
                    setPassword('Password123!');
                    setError('');
                  }}
                  className="p-2 bg-white hover:bg-[#eef2ff] border border-[#dbe0fe] text-left rounded-xl transition-all hover:scale-[1.01]"
                >
                  <p className="text-xs font-bold text-[#191c1e]">Demo User</p>
                  <p className="text-[10px] text-[#797586] truncate">alex@nexguard.app</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setEmail('admin@nexguard.app');
                    setPassword('Password123!');
                    setError('');
                  }}
                  className="p-2 bg-white hover:bg-[#eef2ff] border border-[#dbe0fe] text-left rounded-xl transition-all hover:scale-[1.01]"
                >
                  <p className="text-xs font-bold text-[#191c1e]">Demo Admin</p>
                  <p className="text-[10px] text-[#797586] truncate">admin@nexguard.app</p>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {resendStatus && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span>{resendStatus}</span>
            </div>
          )}

          {/* Verification Code Form */}
          {step === 'verification' ? (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div className="p-4 bg-[#f8f9fc] rounded-2xl border border-[#e1e2e5] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#191c1e] font-semibold">
                  <span>Verification Code Sent To:</span>
                  <span className="text-[#532dcf] font-bold">{cleanEmail}</span>
                </div>
                {demoCodeHint && (
                  <p className="text-[11px] text-emerald-700 font-bold bg-emerald-50 p-2 rounded-xl border border-emerald-200 flex items-center justify-between">
                    <span>Demo Email Verification Code:</span>
                    <span className="font-mono text-xs text-[#532dcf] bg-white px-2 py-0.5 rounded border">{demoCodeHint}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#191c1e] mb-1">6-Digit Verification PIN</label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#797586]" />
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-[#f2f3f6] pl-10 pr-4 py-3 rounded-xl border border-transparent focus:border-[#532dcf] focus:bg-white outline-none text-base font-mono tracking-widest text-[#191c1e]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || verificationCode.trim().length < 4}
                className="w-full bg-[#532dcf] text-white font-semibold py-3.5 px-4 rounded-xl hover:bg-[#481cc4] active:scale-[0.98] transition-all shadow-md flex justify-center items-center gap-2 text-sm disabled:opacity-50"
              >
                <span>{loading ? 'Verifying...' : 'Verify Email & Complete Login'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="text-[#797586] hover:text-[#191c1e] font-bold flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-[#532dcf] font-bold hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Resend Code
                </button>
              </div>
            </form>
          ) : (
            /* Standard Auth Form with Real-time Email Format Feedback */
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-semibold text-[#191c1e] mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#797586]" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Johnson"
                      className="w-full bg-[#f2f3f6] pl-10 pr-4 py-3 rounded-xl border border-transparent focus:border-[#532dcf] focus:bg-white outline-none text-sm text-[#191c1e]"
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-semibold text-[#191c1e]">Email Address</label>
                  {email.trim().length > 0 && (
                    <span
                      className={`text-[11px] font-bold flex items-center gap-1 ${
                        emailIsValid ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {emailIsValid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Valid Email
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" /> Invalid Email ID
                        </>
                      )}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#797586]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className={`w-full bg-[#f2f3f6] pl-10 pr-4 py-3 rounded-xl border outline-none text-sm text-[#191c1e] transition-colors ${
                      email.trim().length > 0 && !emailIsValid
                        ? 'border-red-400 bg-red-50/50'
                        : 'border-transparent focus:border-[#532dcf] focus:bg-white'
                    }`}
                  />
                </div>
                {email.trim().length > 0 && !emailIsValid && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">
                    Must be a valid email format with domain & TLD (e.g. user@domain.com).
                  </p>
                )}
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-semibold text-[#191c1e] mb-1">Phone Number (Optional)</label>
                  <div className="relative">
                    <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#797586]" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-[#f2f3f6] pl-10 pr-4 py-3 rounded-xl border border-transparent focus:border-[#532dcf] focus:bg-white outline-none text-sm text-[#191c1e]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-[#191c1e] mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#797586]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#f2f3f6] pl-10 pr-10 py-3 rounded-xl border border-transparent focus:border-[#532dcf] focus:bg-white outline-none text-sm text-[#191c1e]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#797586] hover:text-[#532dcf]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-semibold text-[#191c1e] mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#797586]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#f2f3f6] pl-10 pr-4 py-3 rounded-xl border border-transparent focus:border-[#532dcf] focus:bg-white outline-none text-sm text-[#191c1e]"
                    />
                  </div>
                </div>
              )}

              {mode === 'signup' && (
                <div className="flex items-start gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-[#532dcf] focus:ring-[#532dcf]"
                  />
                  <label htmlFor="terms" className="text-xs text-[#484555]">
                    I agree to the Terms of Service and Privacy Policy regarding temporary location sharing during active journeys.
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (email.trim().length > 0 && !emailIsValid)}
                className="w-full bg-[#532dcf] text-white font-semibold py-3.5 px-4 rounded-xl hover:bg-[#481cc4] active:scale-[0.98] transition-all shadow-md flex justify-center items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Processing...' : mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Toggle mode */}
          {step === 'form' && (
            <div className="text-center pt-2">
              <p className="text-sm text-[#484555]">
                {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'signup' ? 'signin' : 'signup');
                    setError('');
                  }}
                  className="text-[#532dcf] font-semibold hover:underline"
                >
                  {mode === 'signup' ? 'Sign In' : 'Create Account'}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
