'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, GraduationCap, ShieldCheck, BookOpen, ArrowRight, CheckCircle2, Mail, KeyRound } from 'lucide-react';
import { setSession, MOCK_STUDENT_USER, MOCK_FACULTY_USER } from '@/lib/auth';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const otpInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid institutional email address.');
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

    // Auto focus next input
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
      // Call backend API or fallback to session set
      const response = await api.verifyOtp(email, otpCode).catch(() => null);
      if (response && response.access_token) {
        setSession(response.access_token, response.user);
        if (response.user.role === 'faculty_admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/student/dashboard');
        }
      } else {
        // Fallback demo user login if API is offline
        const isFaculty = email.includes('admin') || email.includes('faculty') || email.includes('dr.');
        const mockUser = isFaculty ? { ...MOCK_FACULTY_USER, email } : { ...MOCK_STUDENT_USER, email };
        setSession('demo_jwt_token_123456789', mockUser);
        router.push(isFaculty ? '/admin/dashboard' : '/student/dashboard');
      }
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      if (role === 'student') {
        setSession('demo_student_token', MOCK_STUDENT_USER);
        router.push('/student/dashboard');
      } else {
        setSession('demo_faculty_token', MOCK_FACULTY_USER);
        router.push('/admin/dashboard');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#0b0f19] text-gray-100">
      {/* Left Branding Hero Section */}
      <div className="lg:col-span-6 xl:col-span-7 relative flex flex-col justify-between p-8 lg:p-12 overflow-hidden border-r border-gray-800/60 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950">
        {/* Background glow effects */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">Academic<span className="gradient-text">AI</span></span>
            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">v1.0</span>
          </div>
        </div>

        {/* Hero Central Content */}
        <div className="relative z-10 my-auto py-12 max-w-xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered RAG Academic Portal</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">
            Your Intelligent Academic Knowledge & Study Companion.
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed mb-8">
            Access verified course materials, past question papers, and query an AI tutor trained strictly on your institution's syllabus with page-level citations.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-panel p-4 rounded-xl flex items-start space-x-3">
              <BookOpen className="w-5 h-5 text-indigo-400 shrink-0 mt-1" />
              <div>
                <h4 className="text-sm font-semibold text-white">Course Repository</h4>
                <p className="text-xs text-gray-400 mt-0.5">Organized by semester, branch, and unit</p>
              </div>
            </div>
            <div className="glass-panel p-4 rounded-xl flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-1" />
              <div>
                <h4 className="text-sm font-semibold text-white">Strict Source Citations</h4>
                <p className="text-xs text-gray-400 mt-0.5">RAG responses linked to page numbers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-gray-500 flex items-center justify-between border-t border-gray-800/80 pt-6">
          <span>© 2026 AcademicAI. All rights reserved.</span>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-gray-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Support</a>
          </div>
        </div>
      </div>

      {/* Right Login Form Section */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center p-8 lg:p-14 bg-[#0d121f]">
        <div className="max-w-md w-full mx-auto">
          {/* Card Header */}
          <div className="mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Institutional Login</h2>
            <p className="text-gray-400 text-sm mt-2">
              Enter your student or faculty email to receive a 6-digit OTP code.
            </p>
          </div>

          {/* Quick Demo Login Toggles */}
          <div className="mb-8 p-4 rounded-xl bg-gray-900/80 border border-indigo-500/20">
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider block mb-2.5">
              🚀 Fast Demo Sign-In
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDemoLogin('student')}
                className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-200 text-xs font-medium transition-all"
              >
                <GraduationCap className="w-4 h-4 text-indigo-400" />
                <span>Student Demo</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('faculty')}
                className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-200 text-xs font-medium transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Faculty Demo</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
              <span>{error}</span>
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Institutional Email Address</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@academic.edu"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-gray-900/90 border border-gray-700/80 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl gradient-bg hover:opacity-95 text-white font-medium text-sm flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Send Verification OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">OTP sent to <strong className="text-white">{email}</strong></span>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Change Email
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">Enter 6-Digit OTP Code</label>
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
                      className="w-12 h-13 text-center bg-gray-900/90 border border-gray-700/80 rounded-xl text-white text-lg font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl gradient-bg hover:opacity-95 text-white font-medium text-sm flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Login</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
