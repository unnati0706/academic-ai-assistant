'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, ShieldCheck, Eye, EyeOff, Mail, Lock, User, Briefcase, BookOpen, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { setSession } from '@/lib/auth';
import { api } from '@/lib/api';

// ─── Field component ──────────────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, icon: Icon, rightEl }) {
  const safeOnChange = (e) => {
    if (!e || !e.target) return;
    onChange(e);
  };
  return (
    <div>
      <label className="block text-xs font-semibold text-[#c8ded7] mb-1.5">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon className="w-4 h-4 text-[#8fb1a5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        )}
        <input
          type={type}
          value={value}
          onChange={safeOnChange}
          placeholder={placeholder}
          required
          className={`w-full ${Icon ? 'pl-10' : 'pl-3.5'} ${rightEl ? 'pr-10' : 'pr-3.5'} py-3 bg-[#1e2c29] border border-[#2e433e] rounded-xl text-sm text-[#f4f1ea] placeholder-[#8fb1a5]/50 focus:outline-none focus:border-[#4f7c6e] focus:ring-1 focus:ring-[#4f7c6e]/30 transition-all`}
        />
        {rightEl && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>
        )}
      </div>
    </div>
  );
}

// ─── Password Field ───────────────────────────────────────────────────────────
function PasswordField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  const safeOnChange = (e) => {
    if (!e || !e.target) return;
    onChange(e);
  };
  return (
    <Field
      label={label}
      type={show ? 'text' : 'password'}
      value={value}
      onChange={safeOnChange}
      placeholder={placeholder}
      icon={Lock}
      rightEl={
        <button
          type="button"
          onClick={() => setShow(p => !p)}
          className="text-[#8fb1a5] hover:text-[#f4f1ea] transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      }
    />
  );
}

// ─── Main Login Page ──────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();

  // Mode & Role
  const [mode, setMode] = useState('login');          // 'login' | 'signup'
  const [selectedRole, setSelectedRole] = useState('student');

  // Shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Signup-only fields
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('1');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmEmailMsg, setConfirmEmailMsg] = useState(false);

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setConfirmEmailMsg(false);
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setConfirmEmailMsg(false);

    // Client-side validation for signup
    if (mode === 'signup') {
      if (!name.trim()) { setError('Please enter your full name.'); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    }

    setLoading(true);
    try {
      let response;

      if (mode === 'login') {
        response = await api.login(email, password, selectedRole);
      } else {
        response = await api.signup(
          email,
          password,
          selectedRole,
          name.trim(),
          selectedRole === 'faculty' ? department.trim() || null : null,
          selectedRole === 'student' ? parseInt(semester) : null,
        );
      }

      // Safely extract token — backend may return access_token or token
      const token = response?.access_token || response?.token;
      if (!token) throw new Error('Login failed: no token received from server.');

      // Safely build the user object — response.user may be undefined
      const userData = {
        id: response?.user?.id ?? null,
        email: response?.user?.email ?? email,
        name: (response?.user?.name ?? name.trim()) || (response?.user?.email ?? email),
        role: response?.user?.role ?? (selectedRole === 'faculty' ? 'faculty_admin' : 'student'),
        phone: response?.user?.phone ?? null,
        semester: selectedRole === 'student' ? parseInt(semester) || null : null,
        department: selectedRole === 'faculty' ? department.trim() || null : null,
        created_at: response?.user?.created_at ?? new Date().toISOString(),
      };
      setSession(token, userData);

      const isFaculty = userData.role === 'faculty_admin' || selectedRole === 'faculty';
      router.push(isFaculty ? '/faculty/dashboard' : '/student/dashboard');

    } catch (err) {
      // 202 CONFIRM_EMAIL sentinel
      if (err.message === 'CONFIRM_EMAIL') {
        setConfirmEmailMsg(true);
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === 'login';
  const isFaculty = selectedRole === 'faculty';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#151f1d] text-[#f4f1ea] p-4">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#4f7c6e]/12 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#3d6459]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2e5048]/6 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-bg shadow-xl shadow-[#4f7c6e]/20 mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#f4f1ea]">
            Academic<span className="gradient-text">AI</span>
          </h1>
          <p className="text-xs text-[#8fb1a5] mt-1">Academic Portal & Course Repository</p>
        </div>

        {/* Auth Card */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-[#2e433e] shadow-2xl shadow-black/30">

          {/* Role Tabs */}
          <div className="mb-5">
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-[#1e2c29] border border-[#2e433e]">
              <button
                type="button"
                onClick={() => setSelectedRole('student')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  selectedRole === 'student'
                    ? 'bg-[#4f7c6e] text-white shadow-md shadow-[#4f7c6e]/30'
                    : 'text-[#8fb1a5] hover:text-[#f4f1ea]'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('faculty')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  selectedRole === 'faculty'
                    ? 'bg-[#4f7c6e] text-white shadow-md shadow-[#4f7c6e]/30'
                    : 'text-[#8fb1a5] hover:text-[#f4f1ea]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Faculty</span>
              </button>
            </div>
          </div>

          {/* Mode Heading */}
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[#f4f1ea] tracking-tight">
              {isLogin
                ? `${isFaculty ? 'Faculty' : 'Student'} Log In`
                : `Create ${isFaculty ? 'Faculty' : 'Student'} Account`}
            </h2>
            <p className="text-[#8fb1a5] text-xs mt-0.5">
              {isLogin ? 'Welcome back — sign in to continue.' : 'Fill in your details to get started.'}
            </p>
          </div>

          {/* Email confirmation success */}
          {confirmEmailMsg && (
            <div className="mb-5 p-4 rounded-xl bg-[#4f7c6e]/10 border border-[#4f7c6e]/30 flex items-start space-x-3">
              <CheckCircle2 className="w-4 h-4 text-[#5ea891] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[#c8ded7]">Check your email!</p>
                <p className="text-xs text-[#8fb1a5] mt-0.5">
                  We sent a confirmation link to <strong className="text-[#f4f1ea]">{email}</strong>. Click it to activate your account, then log in.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-xs text-red-400">{error}</span>
            </div>
          )}

          {/* Form */}
          {!confirmEmailMsg && (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Signup-only: Full Name */}
              {!isLogin && (
                <Field
                  label="Full Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={isFaculty ? 'e.g. Dr. Anita Sharma' : 'e.g. Rahul Verma'}
                  icon={User}
                />
              )}

              {/* Email */}
              <Field
                label="Email Address"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={isFaculty ? 'dr.name@college.edu' : 'student@college.edu'}
                icon={Mail}
              />

              {/* Password */}
              <PasswordField
                label="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isLogin ? 'Enter your password' : 'Min. 6 characters'}
              />

              {/* Signup-only: Confirm Password */}
              {!isLogin && (
                <PasswordField
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={e => { if (e?.target) setConfirmPassword(e.target.value); }}
                  placeholder="Re-enter your password"
                />
              )}

              {/* Signup-only: Faculty → Department */}
              {!isLogin && isFaculty && (
                <Field
                  label="Department"
                  value={department}
                  onChange={e => { if (e?.target) setDepartment(e.target.value); }}
                  placeholder="e.g. Computer Science & Engineering"
                  icon={Briefcase}
                />
              )}

              {/* Signup-only: Student → Semester */}
              {!isLogin && !isFaculty && (
                <div>
                  <label className="block text-xs font-semibold text-[#c8ded7] mb-1.5">Current Semester</label>
                  <div className="relative">
                    <BookOpen className="w-4 h-4 text-[#8fb1a5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={semester}
                      onChange={e => { if (e?.target) setSemester(e.target.value ?? '1'); }}
                      required
                      className="w-full pl-10 pr-3.5 py-3 bg-[#1e2c29] border border-[#2e433e] rounded-xl text-sm text-[#f4f1ea] focus:outline-none focus:border-[#4f7c6e] focus:ring-1 focus:ring-[#4f7c6e]/30 transition-all appearance-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl gradient-bg hover:opacity-90 text-white font-semibold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-[#4f7c6e]/20 transition-all disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isLogin ? (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    <span>Log In</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Mode Switcher */}
          <div className="mt-6 pt-5 border-t border-[#2e433e] text-center">
            {isLogin ? (
              <p className="text-xs text-[#8fb1a5]">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="font-semibold text-[#5ea891] hover:text-[#8fb1a5] transition-colors"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p className="text-xs text-[#8fb1a5]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-semibold text-[#5ea891] hover:text-[#8fb1a5] transition-colors"
                >
                  Log In
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-[#8fb1a5]/50 mt-6">
          © 2026 AcademicAI Portal. All rights reserved.
        </p>
      </div>
    </div>
  );
}
