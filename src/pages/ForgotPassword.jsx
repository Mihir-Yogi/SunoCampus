import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  HiOutlineEnvelope,
  HiOutlineShieldCheck,
  HiOutlineLockClosed,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineEye,
  HiOutlineEyeSlash,
} from 'react-icons/hi2';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import Toast from '../components/Toast';
import OTPInput from '../components/OTPInput';
import api from '../services/api';

const STEPS = [
  { label: 'Email', icon: HiOutlineEnvelope },
  { label: 'Verify', icon: HiOutlineShieldCheck },
  { label: 'Reset', icon: HiOutlineLockClosed },
];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Step 1
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Step 2
  const [otp, setOTP] = useState('');
  const [otpTimer, setOTPTimer] = useState(0);
  const [resetToken, setResetToken] = useState('');

  // Step 3
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Success state
  const [success, setSuccess] = useState(false);

  // OTP countdown timer
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => setOTPTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  // ─── Step 1: Send OTP ─────────────────────────────
  const handleSendOTP = async (e) => {
    e?.preventDefault();
    setEmailError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password/send-otp', { email });
      setToast({ type: 'success', message: 'Verification code sent to your email' });
      setOTPTimer(60);
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send verification code';
      setToast({ type: 'error', message: msg });
      if (err.response?.status === 404) setEmailError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Resend OTP ────────────────────────────────────
  const handleResendOTP = async () => {
    if (otpTimer > 0) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password/send-otp', { email });
      setOTP('');
      setOTPTimer(60);
      setToast({ type: 'success', message: 'New verification code sent' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Failed to resend code' });
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Verify OTP ───────────────────────────
  const handleVerifyOTP = async (e) => {
    e?.preventDefault();
    if (otp.length !== 6) {
      setToast({ type: 'error', message: 'Please enter the 6-digit code' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password/verify-otp', { email, otp });
      setResetToken(res.data.resetToken);
      setToast({ type: 'success', message: 'Email verified successfully' });
      setStep(3);
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Invalid verification code' });
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: Reset Password ───────────────────────
  const handleResetPassword = async (e) => {
    e?.preventDefault();
    setPasswordError('');

    if (!newPassword) {
      setPasswordError('Password is required');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password/reset', { resetToken, newPassword });
      setSuccess(true);
      setToast({ type: 'success', message: 'Password reset successfully!' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Failed to reset password' });
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { label: '', color: '', width: '0%' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: '20%' };
    if (score <= 2) return { label: 'Fair', color: 'bg-orange-500', width: '40%' };
    if (score <= 3) return { label: 'Good', color: 'bg-yellow-500', width: '60%' };
    if (score <= 4) return { label: 'Strong', color: 'bg-green-500', width: '80%' };
    return { label: 'Very Strong', color: 'bg-emerald-500', width: '100%' };
  };

  const strength = getPasswordStrength(newPassword);

  // ─── Success Screen ───────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 sm:px-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <HiOutlineCheckCircle size={36} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Password Reset!</h1>
              <p className="text-green-100 mt-1">Your password has been changed successfully</p>
            </div>
            <div className="px-6 py-8 sm:px-8 text-center">
              <p className="text-gray-600 mb-6">You can now log in with your new password.</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 active:scale-[0.98]"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-8">
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-900 px-6 py-8 sm:px-8">
            <button
              onClick={() => step === 1 ? navigate('/login') : setStep(s => s - 1)}
              className="flex items-center gap-1.5 text-blue-200 hover:text-white transition-colors text-sm mb-4"
            >
              <HiOutlineArrowLeft size={16} />
              {step === 1 ? 'Back to Login' : 'Back'}
            </button>
            <h1 className="text-2xl font-bold text-white">Reset Password</h1>
            <p className="text-blue-200 mt-1">
              {step === 1 && "Enter your email to get started"}
              {step === 2 && "Enter the verification code"}
              {step === 3 && "Create a new password"}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="px-6 sm:px-8 pt-6">
            <div className="flex items-center justify-between mb-6">
              {STEPS.map((s, i) => {
                const stepNum = i + 1;
                const isActive = step === stepNum;
                const isCompleted = step > stepNum;
                const Icon = s.icon;
                return (
                  <div key={i} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : isActive
                              ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                              : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {isCompleted ? (
                          <HiOutlineCheckCircle size={20} />
                        ) : (
                          <Icon size={18} />
                        )}
                      </div>
                      <span className={`text-[10px] mt-1.5 font-medium ${
                        isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 mt-[-12px] rounded transition-all duration-500 ${
                        isCompleted ? 'bg-green-400' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Content */}
          <div className="px-6 pb-8 sm:px-8">
            {/* ─── Step 1: Email ─── */}
            {step === 1 && (
              <form onSubmit={handleSendOTP} className="space-y-5 animate-fadeIn">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <HiOutlineEnvelope size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                      placeholder="Enter your registered email"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                        emailError ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                      } outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900`}
                      autoFocus
                    />
                  </div>
                  {emailError && <p className="text-red-500 text-xs mt-1.5">{emailError}</p>}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  We'll send a 6-digit verification code to this email address.
                </p>
                <PrimaryButton
                  type="submit"
                  isLoading={loading}
                  disabled={loading || !email}
                  size="lg"
                >
                  Send Verification Code
                </PrimaryButton>
              </form>
            )}

            {/* ─── Step 2: OTP Verification ─── */}
            {step === 2 && (
              <form onSubmit={handleVerifyOTP} className="space-y-5 animate-fadeIn">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Code sent to</p>
                  <p className="text-sm font-semibold text-gray-900">{email}</p>
                </div>

                <OTPInput value={otp} onChange={setOTP} length={6} autoFocus />

                <div className="text-center">
                  {otpTimer > 0 ? (
                    <p className="text-xs text-gray-400">
                      Resend code in <span className="font-semibold text-blue-600 tabular-nums">{otpTimer}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={loading}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50"
                    >
                      Resend Code
                    </button>
                  )}
                </div>

                <PrimaryButton
                  type="submit"
                  isLoading={loading}
                  disabled={loading || otp.length !== 6}
                  size="lg"
                >
                  Verify Code
                </PrimaryButton>
              </form>
            )}

            {/* ─── Step 3: New Password ─── */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-5 animate-fadeIn">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <HiOutlineLockClosed size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                      placeholder="At least 6 characters"
                      className={`w-full pl-10 pr-12 py-3 rounded-xl border ${
                        passwordError ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                      } outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900`}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${strength.color}`}
                            style={{ width: strength.width }}
                          />
                        </div>
                        <span className={`text-[10px] font-medium ${
                          strength.label === 'Weak' ? 'text-red-500' :
                          strength.label === 'Fair' ? 'text-orange-500' :
                          strength.label === 'Good' ? 'text-yellow-600' : 'text-green-500'
                        }`}>
                          {strength.label}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <HiOutlineLockClosed size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                      placeholder="Re-enter your password"
                      className={`w-full pl-10 pr-12 py-3 rounded-xl border ${
                        passwordError ? 'border-red-300 bg-red-50' :
                        confirmPassword && confirmPassword === newPassword ? 'border-green-300 bg-green-50' :
                        'border-gray-300 focus:border-blue-500'
                      } outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirm ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword === newPassword && (
                    <p className="text-green-500 text-xs mt-1.5 flex items-center gap-1">
                      <HiOutlineCheckCircle size={14} /> Passwords match
                    </p>
                  )}
                  {passwordError && <p className="text-red-500 text-xs mt-1.5">{passwordError}</p>}
                </div>

                <PrimaryButton
                  type="submit"
                  isLoading={loading}
                  disabled={loading || !newPassword || !confirmPassword}
                  size="lg"
                >
                  Reset Password
                </PrimaryButton>
              </form>
            )}

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Remember your password?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
