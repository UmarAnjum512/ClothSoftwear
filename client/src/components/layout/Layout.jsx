import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);       // mobile drawer open/close
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop icon-only mode

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
      />

      {/* Main content — shifts right based on sidebar width */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300
          ${sidebarCollapsed ? 'lg:pl-[70px]' : 'lg:pl-64'}
        `}
      >
        <Navbar onMenuClick={() => setSidebarOpen(true)} sidebarCollapsed={sidebarCollapsed} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
