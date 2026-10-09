import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  RotateCcw,
  Shirt,
  Boxes,
  Truck,
  Users,
  Wallet,
  PiggyBank,
  BarChart3,
  Sliders,
  ShieldCheck,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  PackageOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
  const { user, hasRole } = useAuth();

  const navigation = [
    {
      section: 'Operations',
      items: [
        { name: 'Dashboard',        path: '/',         icon: LayoutDashboard, roles: ['Super Admin', 'Manager', 'Cashier', 'Store Keeper'] },
        { name: 'POS Billing',      path: '/pos',      icon: ShoppingCart,    roles: ['Super Admin', 'Manager', 'Cashier'] },
        { name: 'Sales Orders',     path: '/sales',    icon: Receipt,         roles: ['Super Admin', 'Manager', 'Cashier'] },
        { name: 'Returns & Exchange', path: '/returns', icon: RotateCcw,      roles: ['Super Admin', 'Manager', 'Cashier', 'Store Keeper'] },
        { name: 'Cash Register',    path: '/register', icon: Wallet,          roles: ['Super Admin', 'Manager', 'Cashier'] },
      ]
    },
    {
      section: 'Catalog & stock',
      items: [
        { name: 'Products & Variants', path: '/products',  icon: Shirt,        roles: ['Super Admin', 'Manager', 'Store Keeper', 'Cashier'] },
        { name: 'Stock & Inventory',   path: '/inventory', icon: Boxes,        roles: ['Super Admin', 'Manager', 'Store Keeper'] },
        { name: 'Master Data',         path: '/master',    icon: Sliders,      roles: ['Super Admin', 'Manager', 'Store Keeper'] },
      ]
    },
    {
      section: 'Purchasing & partners',
      items: [
        { name: 'Purchases',  path: '/purchases',  icon: PackageOpen, roles: ['Super Admin', 'Manager', 'Store Keeper'] },
        { name: 'Suppliers',  path: '/suppliers',  icon: Truck,       roles: ['Super Admin', 'Manager'] },
        { name: 'Customers',  path: '/customers',  icon: Users,       roles: ['Super Admin', 'Manager', 'Cashier'] },
      ]
    },
    {
      section: 'Finance & reports',
      items: [
        { name: 'Expenses',      path: '/expenses', icon: PiggyBank, roles: ['Super Admin', 'Manager', 'Cashier'] },
        { name: 'Reports & P&L', path: '/reports',  icon: BarChart3, roles: ['Super Admin', 'Manager'] },
      ]
    },
    {
      section: 'Administration',
      items: [
        { name: 'Staff & Roles',     path: '/users',    icon: ShieldCheck, roles: ['Super Admin'] },
        { name: 'Settings & Backup', path: '/settings', icon: Settings,    roles: ['Super Admin', 'Manager'] },
      ]
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-indigo-950/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-indigo-950 text-indigo-100/70 flex flex-col transition-all duration-300 ease-in-out
          ${isCollapsed ? 'lg:w-[70px]' : 'lg:w-64'}
          ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 ring-1 ring-gold-300/40 flex items-center justify-center shrink-0">
              <span className="font-display text-lg font-semibold text-gold-200 leading-none">H</span>
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="brand-wordmark text-white text-[15px] block truncate leading-tight">
                  HOORIYA
                </span>
                <span className="brand-wordmark text-gold-300 text-[10px] block leading-tight tracking-[0.42em]">
                  ARTS
                </span>
              </div>
            )}
          </div>
          {/* Mobile close */}
          <button onClick={onClose} aria-label="Close menu" className="lg:hidden p-1.5 text-indigo-200 hover:text-white rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Nav */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-6 px-2.5">
          {navigation.map((group, idx) => {
            const visibleItems = group.items.filter(item => hasRole(...item.roles));
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-0.5">
                {!isCollapsed && (
                  <p className="px-2.5 mb-1.5 text-[11px] font-semibold text-indigo-200/50">
                    {group.section}
                  </p>
                )}
                {isCollapsed && idx > 0 && (
                  <div className="border-t border-white/10 mb-1.5 mx-1" />
                )}
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => onClose()}
                      end={item.path === '/'}
                      title={isCollapsed ? item.name : undefined}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg text-sm font-medium transition-colors group relative
                        ${isCollapsed ? 'px-2.5 py-2.5 justify-center' : 'px-3 py-2.5'}
                        ${isActive
                          ? 'bg-white/10 text-white font-semibold shadow-[inset_3px_0_0_0] shadow-gold-400'
                          : 'text-indigo-100/70 hover:text-white hover:bg-white/5'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                      {/* Tooltip when collapsed */}
                      {isCollapsed && (
                        <span className="absolute left-full ml-3 px-2.5 py-1 bg-indigo-900 text-white text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                          {item.name}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-white/10 shrink-0">
          {isCollapsed ? (
            <div className="w-9 h-9 mx-auto rounded-full bg-gold-400/15 text-gold-300 flex items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
          ) : (
            <div className="flex items-center space-x-3 p-2 rounded-lg bg-white/5">
              <div className="w-8 h-8 rounded-full bg-gold-400/15 text-gold-300 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-gold-300 truncate font-semibold">{user?.role}</p>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle Button */}
        <button
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:flex items-center justify-center h-8 w-8 absolute -right-4 top-[72px] bg-white border border-slate-200 rounded-full shadow-md text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all z-10"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>
    </>
  );
}
