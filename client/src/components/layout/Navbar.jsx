import React from 'react';
import { Menu, LogOut, Wallet, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Navbar({ onMenuClick }) {
  const { user, logout, activeRegister } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-14 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-5 flex items-center justify-between sticky top-0 z-30">
      {/* Left — Hamburger (mobile) + Store name */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Store name */}
        <div className="hidden sm:block">
          <h1 className="font-display text-base font-semibold text-indigo-800 leading-none tracking-wide">HOORIYA ARTS</h1>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Point of sale &amp; store management</p>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Cash Register Shift Badge */}
        {user?.role !== 'Store Keeper' && (
          <Link
            to="/register"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              activeRegister
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 animate-pulse'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">
              {activeRegister ? `Shift Open · #${activeRegister.shiftNumber}` : 'Register Closed'}
            </span>
            <span className="md:hidden">{activeRegister ? 'Shift' : 'Register'}</span>
          </Link>
        )}

        {/* Quick POS Button */}
        {['Super Admin', 'Manager', 'Cashier'].includes(user?.role) && (
          <Link
            to="/pos"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">POS Billing</span>
          </Link>
        )}

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* User info + logout */}
        <div className="flex items-center gap-2.5">
          <div className="hidden md:block text-right">
            <span className="block text-xs font-bold text-slate-800 leading-none">{user?.name}</span>
            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gold-100 text-gold-700">
              {user?.role}
            </span>
          </div>
          {/* Avatar (mobile) */}
          <div className="md:hidden w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <button
            onClick={handleLogout}
            title="Sign out" aria-label="Sign out"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
