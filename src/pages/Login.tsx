import React, { useState } from 'react';
import { useApp } from '../context/AppContext.js';
import { KeyRound, Lock, User, Users, GraduationCap, ArrowRight, Eye, EyeOff, CheckSquare, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { login, isLoading } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'teacher' | 'student' | 'parent'>('admin');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    try {
      await login(username.trim(), password.trim(), role, rememberMe);
    } catch {
      // Handled in Context
    }
  };

  return (
    <div id="login-root" className="min-h-screen relative bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-200">
      {/* Background Mesh Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(at_top_right,rgba(99,102,241,0.06),transparent_50%),radial-gradient(at_bottom_left,rgba(99,102,241,0.04),transparent_50%)] pointer-events-none z-0" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-3xl p-8 md:p-10 glass-card z-10"
      >
        {/* Logo and Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-indigo-600 dark:bg-indigo-500 text-white p-3 rounded-2xl shadow-lg shadow-indigo-600/20 mb-3 hover:scale-105 transition-transform duration-200">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
            LGEA PRIMARY SCHOOL DUTSE
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sign in to unlock classroom operations
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role selector dropdown with stylized layout */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-indigo-500" />
              Identify Your Access Role
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={e => setRole(e.target.value as any)}
                className="w-full px-4 py-3 text-slate-800 dark:text-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-500 outline-none transition-all cursor-pointer appearance-none glass-input"
              >
                <option value="admin">Administrator / Principal</option>
                <option value="teacher">Classroom Instructor / Teacher</option>
                <option value="student">Student Portal</option>
                <option value="parent">Parent Portal</option>
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-indigo-500" />
              Username or ID Code
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. admin, teacher, STU001"
                required
                className="w-full pl-11 pr-4 py-3 text-slate-800 dark:text-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-500 outline-none transition-all glass-input"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <User className="h-4.5 w-4.5" />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-indigo-500" />
                Security Password
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-11 pr-11 py-3 text-slate-800 dark:text-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-500 outline-none transition-all glass-input"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="h-4.5 w-4.5" />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password link */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-slate-150"
              />
              Remember credential persistence
            </label>
            <button
              type="button"
              onClick={() => setIsForgotOpen(true)}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Forgot secret key?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-600/15 disabled:bg-indigo-400 disabled:shadow-none cursor-pointer transition-all mt-6"
          >
            {isLoading ? 'Accessing Secure Terminal...' : 'Authenticate Identity'}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        {/* Quick Demo Credentials Panel */}
       {/* <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
            <KeyRound className="h-3 w-3" />
            Quick Demo Accounts (Autoseeded)
          </h4>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
            <div className="p-2 bg-slate-50 dark:bg-slate-850 rounded-lg">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Admin:</span> admin / admin123
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-850 rounded-lg">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Teacher:</span> teacher / teacher123
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-850 rounded-lg">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Student:</span> student / student123
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-850 rounded-lg">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Parent:</span> parent / parent123
            </div>
          </div>
        </div>*/}
      </motion.div>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xl"
          >
            <div className="flex gap-3 mb-4">
              <div className="p-2 h-10 w-10 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 rounded-xl flex items-center justify-center">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                  Password Recovery Advisory
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  How secret keys are managed in LGEA PRIMARY SCHOOL
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
              Standard credentials are fully managed by the <strong>LGEA Administrative Office</strong>. 
              If you have lost your passkey, please contact the Principal's IT helpdesk directly at 
              <span className="text-indigo-600 ml-1">it-support@school.edu</span> to securely cycle your access token.
            </p>
            <button
              onClick={() => setIsForgotOpen(false)}
              className="mt-5 w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-250 rounded-xl font-medium text-xs transition cursor-pointer"
            >
              Acknowledge Guidance
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
