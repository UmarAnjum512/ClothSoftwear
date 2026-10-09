import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

const DEMO_ROLES = [
  { role: 'Super Admin', hint: 'Owner, full access', email: 'admin@hooriyaarts.com', password: 'admin123' },
  { role: 'Manager', hint: 'Operations and stock', email: 'manager@hooriyaarts.com', password: 'manager123' },
  { role: 'Cashier', hint: 'Billing and register', email: 'cashier@hooriyaarts.com', password: 'cashier123' },
  { role: 'Store Keeper', hint: 'Receiving and stock', email: 'storekeeper@hooriyaarts.com', password: 'store123' },
];

export default function Login() {
  const [email, setEmail] = useState('admin@hooriyaarts.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Sign in failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demo) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setError('');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-white">
      {/* Brand panel */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-indigo-950 text-white p-14">
        {/* Woven-thread texture: thin diagonal lines, a nod to fabric */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 1px, transparent 14px), repeating-linear-gradient(-45deg, #fff 0, #fff 1px, transparent 1px, transparent 14px)',
          }}
        />
        <div aria-hidden="true" className="absolute -bottom-40 -left-32 w-[28rem] h-[28rem] rounded-full bg-indigo-700/40 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 ring-1 ring-gold-300/40 flex items-center justify-center">
            <span className="font-display text-xl font-semibold text-gold-200 leading-none">H</span>
          </div>
          <span className="text-sm text-indigo-100/70 font-medium">Point of sale &amp; store management</span>
        </div>

        <div className="relative">
          <p className="font-display text-6xl xl:text-7xl font-semibold leading-[1.02] tracking-[0.04em]">
            HOORIYA
          </p>
          <p className="brand-wordmark text-gold-300 text-2xl xl:text-3xl tracking-[0.55em] mt-2">ARTS</p>
          <p className="mt-8 max-w-sm text-indigo-100/75 text-base leading-relaxed">
            Billing, stock, purchases and profit in one place, built for the way a clothing store really runs.
          </p>
        </div>

        <p className="relative text-xs text-indigo-200/50">&copy; {new Date().getFullYear()} HOORIYA ARTS</p>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center px-5 py-12 sm:px-10 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Compact brand for small screens */}
          <div className="lg:hidden mb-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-700 ring-1 ring-gold-300/50 flex items-center justify-center">
              <span className="font-display text-2xl font-semibold text-gold-200 leading-none">H</span>
            </div>
            <p className="mt-3 font-display text-3xl font-semibold tracking-[0.08em] text-indigo-900">HOORIYA ARTS</p>
          </div>

          <h1 className="font-display text-2xl font-semibold text-slate-900 tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Use your staff account to open the store.</p>

          {error && (
            <div role="alert" className="mt-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="name@hooriyaarts.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-600 transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm font-semibold text-slate-600 mb-3">Demo accounts</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ROLES.map((demo) => (
                <button
                  key={demo.role}
                  type="button"
                  onClick={() => fillDemo(demo)}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    email === demo.email
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-sm font-semibold text-slate-800">{demo.role}</span>
                  <span className="block text-xs text-slate-500">{demo.hint}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
