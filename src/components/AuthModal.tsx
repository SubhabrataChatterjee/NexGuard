import React, { useState } from 'react';
import {
  Shield,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';

import { api } from '../lib/api';
import { isValidEmail, sanitizeEmail } from '../utils/validation';
import { User, UserSettings } from '../types';

interface AuthModalProps {
  onSuccess: (user: User, settings: UserSettings) => void;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onSuccess,
  onClose,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');

  const [step, setStep] = useState<'form' | 'verification'>('form');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(true);

  // Verification
  const [verificationCode, setVerificationCode] = useState('');
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cleanEmail = sanitizeEmail(email);

  const emailIsValid =
    email.trim().length > 0
      ? isValidEmail(cleanEmail)
      : null;

  // ============================================================
  // LOGIN / SIGNUP
  // ============================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResendStatus(null);

    const formattedEmail = sanitizeEmail(email);

    // ----------------------------------------------------------
    // EMAIL VALIDATION
    // ----------------------------------------------------------

    if (!isValidEmail(formattedEmail)) {
      setError(
        'Please enter a valid email address (e.g. name@domain.com).'
      );
      return;
    }

    // ----------------------------------------------------------
    // SIGNUP VALIDATION
    // ----------------------------------------------------------

    if (mode === 'signup') {
      if (
        !fullName.trim() ||
        !formattedEmail ||
        !password
      ) {
        setError('Please fill in all required fields.');
        return;
      }

      if (password.length < 6) {
        setError(
          'Password must be at least 6 characters.'
        );
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      if (!agreedTerms) {
        setError(
          'You must agree to the Terms of Service.'
        );
        return;
      }
    }

    // ----------------------------------------------------------
    // LOGIN VALIDATION
    // ----------------------------------------------------------

    if (mode === 'signin') {
      if (!formattedEmail || !password) {
        setError(
          'Please enter your registered email address and password.'
        );
        return;
      }
    }

    setLoading(true);

    try {
      // ========================================================
      // SIGNUP
      // ========================================================

      if (mode === 'signup') {
        const res = await api.register({
          full_name: fullName.trim(),
          email: formattedEmail,
          password,
          phone: phone.trim() || undefined,
        });

        // Email verification required
        if (res.requires_verification) {
          setVerificationCode('');
          setError('');
          setStep('verification');
          return;
        }

        // Direct login if backend doesn't require verification
        if (res.token) {
          localStorage.setItem(
            'nexguard_token',
            res.token
          );

          onSuccess(
            res.user,
            res.settings
          );

          return;
        }

        setError(
          'Account created, but the server did not return a login session.'
        );
      }

      // ========================================================
      // LOGIN
      // ========================================================

      else {
        const res = await api.login({
          email: formattedEmail,
          password,
        });

        // Unverified account
        if (res.requires_verification) {
          setVerificationCode('');
          setError('');
          setStep('verification');
          return;
        }

        // Normal verified login
        if (res.token) {
          localStorage.setItem(
            'nexguard_token',
            res.token
          );

          onSuccess(
            res.user,
            res.settings
          );

          return;
        }

        setError(
          'Login succeeded, but the server did not return a login session.'
        );
      }

    } catch (err: any) {
      setError(
        err?.message ||
        'Authentication failed. Please check your email ID or password.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // VERIFY EMAIL
  // ============================================================

  const handleVerifyCode = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError('');
    setResendStatus(null);

    const code = verificationCode.trim();

    if (code.length !== 6) {
      setError(
        'Please enter the 6-digit verification code sent to your email.'
      );
      return;
    }

    setLoading(true);

    try {
      const formattedEmail = sanitizeEmail(email);

      const res = await api.verifyEmail({
        email: formattedEmail,
        code,
      });

      if (res.token) {
        localStorage.setItem(
          'nexguard_token',
          res.token
        );

        onSuccess(
          res.user,
          res.settings
        );

        return;
      }

      setError(
        'Verification succeeded, but no login token was returned.'
      );

    } catch (err: any) {
      setError(
        err?.message ||
        'Invalid verification code. Please check your email and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RESEND VERIFICATION CODE
  // ============================================================

  const handleResendCode = async () => {
    setError('');
    setResendStatus(null);
    setLoading(true);

    try {
      const formattedEmail = sanitizeEmail(email);

      await api.resendVerificationCode(
        formattedEmail
      );

      // Never auto-fill the code.
      setVerificationCode('');

      setResendStatus(
        'A new verification code has been sent to your email.'
      );

      setTimeout(() => {
        setResendStatus(null);
      }, 4000);

    } catch (err: any) {
      setError(
        err?.message ||
        'Failed to resend verification code.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // BACK FROM VERIFICATION
  // ============================================================

  const handleBackToForm = () => {
    setStep('form');
    setVerificationCode('');
    setError('');
    setResendStatus(null);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col md:flex-row">

      {/* ======================================================
          LEFT COLUMN
      ====================================================== */}

      <div className="hidden md:flex w-1/2 bg-[#f2f3f6] relative flex-col justify-center items-center p-12 overflow-hidden border-r border-[#e1e2e5]">

        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#6c4ce8]/20 rounded-full blur-3xl" />

        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#785fe1]/20 rounded-full blur-3xl" />

        <div className="relative z-10 text-center max-w-md space-y-6">

          <div className="w-16 h-16 rounded-2xl bg-[#532dcf] text-white flex items-center justify-center mx-auto shadow-md">
            <Shield className="w-10 h-10 fill-current" />
          </div>

          <h1 className="text-4xl font-extrabold text-[#191c1e] tracking-tight">
            Adaptive Serenity.
          </h1>

          <p className="text-[#484555] text-base leading-relaxed">
            Your digital sanctuary for safety and peace of mind.
            Strict email security, verified encryption, and
            instant protection.
          </p>

          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-[#e1e2e5] text-xs font-semibold text-[#532dcf]">

            <CheckCircle2 className="w-4 h-4 text-green-600" />

            <span>
              Strict Verified Email Authentication Active
            </span>

          </div>

        </div>
      </div>

      {/* ======================================================
          RIGHT COLUMN
      ====================================================== */}

      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white">

        <div className="w-full max-w-[420px] space-y-8">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="text-center md:text-left space-y-2">

            <div className="flex items-center justify-center md:justify-start gap-2 text-[#532dcf]">

              <Shield className="w-8 h-8 fill-current" />

              <span className="text-2xl font-bold tracking-tight">
                NexGuard
              </span>

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

          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-start gap-2">

              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />

              <span>{error}</span>

            </div>
          )}

          {/* ==================================================
              RESEND SUCCESS
          ================================================== */}

          {resendStatus && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold rounded-2xl flex items-center gap-2">

              <CheckCircle2 className="w-4 h-4 text-green-600" />

              <span>{resendStatus}</span>

            </div>
          )}

          {/* ==================================================
              VERIFICATION SCREEN
          ================================================== */}

          {step === 'verification' ? (

            <form
              onSubmit={handleVerifyCode}
              className="space-y-5"
            >

              {/* Email information */}

              <div className="p-4 bg-[#f8f9fc] rounded-2xl border border-[#e1e2e5] space-y-2">

                <div className="flex flex-col gap-1">

                  <span className="text-xs font-semibold text-[#797586]">
                    Verification code sent to:
                  </span>

                  <span className="text-sm font-bold text-[#532dcf] break-all">
                    {cleanEmail}
                  </span>

                </div>

                <p className="text-xs text-[#797586] leading-relaxed">
                  Check your inbox for the 6-digit verification
                  code. If you don't see it, check your spam or
                  junk folder.
                </p>

              </div>

              {/* Verification input */}

              <div>

                <label className="block text-sm font-semibold text-[#191c1e] mb-1">
                  6-Digit Verification Code
                </label>

                <div className="relative">

                  <KeyRound className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#797586]" />

                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => {
                      const value =
                        e.target.value.replace(
                          /\D/g,
                          ''
                        );

                      setVerificationCode(value);
                    }}
                    placeholder="123456"
                    className="w-full bg-[#f2f3f6] pl-10 pr-4 py-3 rounded-xl border border-transparent focus:border-[#532dcf] focus:bg-white outline-none text-base font-mono tracking-[0.4em] text-[#191c1e]"
                  />

                </div>

              </div>

              {/* Verify button */}

              <button
                type="submit"
                disabled={
                  loading ||
                  verificationCode.length !== 6
                }
                className="w-full bg-[#532dcf] text-white font-semibold py-3.5 px-4 rounded-xl hover:bg-[#481cc4] active:scale-[0.98] transition-all shadow-md flex justify-center items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >

                <span>
                  {loading
                    ? 'Verifying...'
                    : 'Verify Email & Continue'}
                </span>

                <ArrowRight className="w-4 h-4" />

              </button>

              {/* Back + resend */}

              <div className="flex items-center justify-between pt-2 text-xs">

                <button
                  type="button"
                  onClick={handleBackToForm}
                  disabled={loading}
                  className="text-[#797586] hover:text-[#191c1e] font-bold flex items-center gap-1 disabled:opacity-50"
                >

                  <ArrowLeft className="w-3.5 h-3.5" />

                  Back

                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-[#532dcf] font-bold hover:underline flex items-center gap-1 disabled:opacity-50"
                >

                  <RefreshCw className="w-3.5 h-3.5" />

                  Resend Code

                </button>

              </div>

            </form>

          ) : (

            /* ==================================================
               NORMAL LOGIN / SIGNUP FORM
            ================================================== */

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >

              {/* =================================================
                  FULL NAME
              ================================================= */}

              {mode === 'signup' && (
                <div>

                  <label className="block text-sm font-semibold text-[#191c1e] mb-1">
                    Full Name
                  </label>

                  <div className="relative">

                    <UserIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#797586]" />

                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) =>
                        setFullName(e.target.value)
                      }
                      placeholder="Alex Johnson"
                      className="w-full bg-[#f2f3f6] pl-10 pr-4 py-3 rounded-xl border border-transparent focus:border-[#532dcf] focus:bg-white outline-none text-sm text-[#191c1e]"
                    />

                  </div>

                </div>
              )}

              {/* =================================================
                  EMAIL
              ================================================= */}

              <div>

                <div className="flex justify-between items-center mb-1">

                  <label className="block text-sm font-semibold text-[#191c1e]">
                    Email Address
                  </label>

                  {email.trim().length > 0 && (
                    <span
                      className={`text-[11px] font-bold flex items-center gap-1 ${
                        emailIsValid
                          ? 'text-green-600'
                          : 'text-red-500'
                      }`}
                    >

                      {emailIsValid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Valid Email
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          Invalid Email ID
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
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="alex@example.com"
                    className={`w-full bg-[#f2f3f6] pl-10 pr-4 py-3 rounded-xl border outline-none text-sm text-[#191c1e] transition-colors ${
                      email.trim().length > 0 &&
                      !emailIsValid
                        ? 'border-red-400 bg-red-50/50'
                        : 'border-transparent focus:border-[#532dcf] focus:bg-white'
                    }`}
                  />

                </div>

                {email.trim().length > 0 &&
                  !emailIsValid && (
                    <p className="text-[11px] text-red-500 mt-1 font-medium">
                      Must be a valid email format with domain &
                      TLD (e.g. user@domain.com).
                    </p>
                  )}

              </div>

              {/* =================================================
                  PHONE
              ================================================= */}

              {mode === 'signup' && (
                <div>

                  <label className="block text-sm font-semibold text-[#191c1e] mb-1">
                    Phone Number (Optional)
                  </label>

                  <div className="relative">

                    <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#797586]" />

                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value)
                      }
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-[#f2f3f6] pl-10 pr-4 py-3 rounded-xl border border-transparent focus:border-[#532dcf] focus:bg-white outline-none text-sm text-[#191c1e]"
                    />

                  </div>

                </div>
              )}

              {/* =================================================
                  PASSWORD
              ================================================= */}

              <div>

                <label className="block text-sm font-semibold text-[#191c1e] mb-1">
                  Password
                </label>

                <div className="relative">

                  <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#797586]" />

                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="••••••••"
                    className="w-full bg-[#f2f3f6] pl-10 pr-10 py-3 rounded-xl border border-transparent focus:border-[#532dcf] focus:bg-white outline-none text-sm text-[#191c1e]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#797586] hover:text-[#532dcf]"
                  >

                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}

                  </button>

                </div>

              </div>

              {/* =================================================
                  CONFIRM PASSWORD
              ================================================= */}

              {mode === 'signup' && (
                <div>

                  <label className="block text-sm font-semibold text-[#191c1e] mb-1">
                    Confirm Password
                  </label>

                  <div className="relative">

                    <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#797586]" />

                    <input
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(
                          e.target.value
                        )
                      }
                      placeholder="••••••••"
                      className="w-full bg-[#f2f3f6] pl-10 pr-4 py-3 rounded-xl border border-transparent focus:border-[#532dcf] focus:bg-white outline-none text-sm text-[#191c1e]"
                    />

                  </div>

                </div>
              )}

              {/* =================================================
                  TERMS
              ================================================= */}

              {mode === 'signup' && (
                <div className="flex items-start gap-2 pt-2">

                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedTerms}
                    onChange={(e) =>
                      setAgreedTerms(
                        e.target.checked
                      )
                    }
                    className="mt-1 rounded border-gray-300 text-[#532dcf] focus:ring-[#532dcf]"
                  />

                  <label
                    htmlFor="terms"
                    className="text-xs text-[#484555]"
                  >
                    I agree to the Terms of Service and
                    Privacy Policy regarding temporary
                    location sharing during active journeys.
                  </label>

                </div>
              )}

              {/* =================================================
                  SUBMIT
              ================================================= */}

              <button
                type="submit"
                disabled={
                  loading ||
                  (
                    email.trim().length > 0 &&
                    !emailIsValid
                  )
                }
                className="w-full bg-[#532dcf] text-white font-semibold py-3.5 px-4 rounded-xl hover:bg-[#481cc4] active:scale-[0.98] transition-all shadow-md flex justify-center items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >

                <span>
                  {loading
                    ? 'Processing...'
                    : mode === 'signup'
                    ? 'Create Account'
                    : 'Sign In'}
                </span>

                <ArrowRight className="w-4 h-4" />

              </button>

            </form>
          )}

          {/* ====================================================
              DEMO ACCOUNTS
          ==================================================== */}

          {step === 'form' &&
            mode === 'signin' && (
              <div className="p-3.5 bg-[#f2f3f6] rounded-2xl border border-[#e1e2e5] space-y-2">

                <div className="text-xs font-bold text-[#191c1e] flex items-center justify-between">

                  <span>
                    Quick Demo Accounts
                  </span>

                  <span className="text-[10px] text-[#532dcf] font-semibold bg-white px-2 py-0.5 rounded-full border border-[#e1e2e5]">
                    1-Click Login
                  </span>

                </div>

                <div className="grid grid-cols-2 gap-2">

                  {/* Demo User */}

                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setEmail(
                        'alex@nexguard.app'
                      );
                      setPassword(
                        'Password123!'
                      );
                      setError('');
                    }}
                    className="p-2 bg-white hover:bg-[#eef2ff] border border-[#dbe0fe] text-left rounded-xl transition-all hover:scale-[1.01]"
                  >

                    <p className="text-xs font-bold text-[#191c1e]">
                      Demo User
                    </p>

                    <p className="text-[10px] text-[#797586] truncate">
                      alex@nexguard.app
                    </p>

                  </button>

                  {/* Demo Admin */}

                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setEmail(
                        'admin@nexguard.app'
                      );
                      setPassword(
                        'Password123!'
                      );
                      setError('');
                    }}
                    className="p-2 bg-white hover:bg-[#eef2ff] border border-[#dbe0fe] text-left rounded-xl transition-all hover:scale-[1.01]"
                  >

                    <p className="text-xs font-bold text-[#191c1e]">
                      Demo Admin
                    </p>

                    <p className="text-[10px] text-[#797586] truncate">
                      admin@nexguard.app
                    </p>

                  </button>

                </div>

              </div>
            )}

          {/* ====================================================
              SIGNUP / SIGNIN TOGGLE
          ==================================================== */}

          {step === 'form' && (
            <div className="text-center pt-2">

              <p className="text-sm text-[#484555]">

                {mode === 'signup'
                  ? 'Already have an account?'
                  : "Don't have an account?"}{' '}

                <button
                  type="button"
                  onClick={() => {
                    setMode(
                      mode === 'signup'
                        ? 'signin'
                        : 'signup'
                    );

                    setError('');
                    setResendStatus(null);
                  }}
                  className="text-[#532dcf] font-semibold hover:underline"
                >

                  {mode === 'signup'
                    ? 'Sign In'
                    : 'Create Account'}

                </button>

              </p>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};