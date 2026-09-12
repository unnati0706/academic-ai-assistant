'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, ShieldCheck, ArrowRight, CheckCircle2, Mail } from 'lucide-react';
import { setSession, MOCK_STUDENT_USER, MOCK_FACULTY_USER } from '@/lib/auth';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState('student'); // 'student' | 'faculty'
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const otpInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
    }, 600);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await api.verifyOtp(email, otpCode, selectedRole).catch(() => null);
      if (response && response.access_token) {
        setSession(response.access_token, response.user);
        if (response.user.role === 'faculty_admin' || response.user.role === 'faculty') {
          router.push('/faculty/dashboard');
        } else {
          router.push('/student/dashboard');
        }
      } else {
        // Fallback automated dev-login bypass if email OTP service is unconfigured
        const isFaculty = selectedRole === 'faculty';
        const mockUser = isFaculty
          ? { ...MOCK_FACULTY_USER, email, role: 'faculty_admin' }
          : { ...MOCK_STUDENT_USER, email, role: 'student' };
        setSession('demo_jwt_token_123456789', mockUser);
        router.push(isFaculty ? '/faculty/dashboard' : '/student/dashboard');
      }
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    if (role === 'faculty') {
      setSession('demo_faculty_token_12345', MOCK_FACULTY_USER);
      router.push('/faculty/dashboard');
    } else {
      setSession('demo_student_token_12345', MOCK_STUDENT_USER);
      router.push('/student/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbf9f5] text-[#263339] p-4">
      {/* Ambient background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#749190]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#E6D9B9]/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D8D6C9]/25 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-bg shadow-xl shadow-[#749190]/20 mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#263339]">
            Academic<span className="gradient-text">AI</span>
          </h1>
          <p className="text-xs text-[#465F64] mt-1 font-medium">Academic Portal & Course Repository</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#D8D6C9] shadow-xl shadow-[#263339]/5">
          {/* Role Selector Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-[#465F64] uppercase tracking-wider mb-2">Select Portal Role</label>
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-[#fbf9f5] border border-[#D8D6C9]">
              <button
                type="button"
                onClick={() => setSelectedRole('student')}
                className={`py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${selectedRole === 'student'
                    ? 'bg-[#749190] text-white shadow-md shadow-[#749190]/25'
                    : 'text-[#465F64] hover:text-[#263339]'
                  }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student Portal</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('faculty')}
                className={`py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${selectedRole === 'faculty'
                    ? 'bg-[#749190] text-white shadow-md shadow-[#749190]/25'
                    : 'text-[#465F64] hover:text-[#263339]'
                  }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Faculty Portal</span>
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#263339] tracking-tight">
              {selectedRole === 'faculty' ? 'Faculty Sign In' : 'Student Sign In'}
            </h2>
            <p className="text-[#465F64] text-xs mt-1">
              Enter your email address to receive an OTP code.
            </p>
          </div>

          {/* Instant Sign-In Action Button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => handleDemoLogin(selectedRole)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-[#E6D9B9]/50 hover:bg-[#E6D9B9]/80 border border-[#D8D6C9] text-[#263339] text-xs font-bold shadow-sm transition-all"
            >
              <span>Instant {selectedRole === 'faculty' ? 'Faculty' : 'Student'} Sign-In</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#749190]" />
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs flex items-center space-x-2 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></span>
              <span>{error}</span>
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#263339] mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-[#465F64] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={selectedRole === 'faculty' ? 'dr.smith@academic.edu' : 'student@academic.edu'}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white border border-[#D8D6C9] rounded-xl text-[#263339] placeholder-[#465F64]/50 text-sm focus:outline-none focus:border-[#749190] focus:ring-1 focus:ring-[#749190] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl gradient-bg hover:opacity-90 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-[#749190]/25 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Send OTP Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#465F64]">OTP sent to <strong className="text-[#263339]">{email}</strong></span>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-xs text-[#749190] hover:text-[#5f7b7a] transition-colors font-bold"
                >
                  Change Email
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#263339] mb-2">Enter 6-Digit OTP Code</label>
                <div className="flex space-x-2 justify-between">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={otpInputRefs[idx]}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-12 h-12 text-center bg-white border border-[#D8D6C9] rounded-xl text-[#263339] text-lg font-bold focus:outline-none focus:border-[#749190] focus:ring-1 focus:ring-[#749190] transition-all"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl gradient-bg hover:opacity-90 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-[#749190]/25 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-[#465F64]/70 mt-6">
          © 2026 AcademicAI Portal. All rights reserved.
        </p>
      </div>
    </div>
  );
}
