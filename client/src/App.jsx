import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import SalesHistory from './pages/SalesHistory';
import SalesReturn from './pages/SalesReturn';
import CashRegister from './pages/CashRegister';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import MasterData from './pages/MasterData';
import Purchases from './pages/Purchases';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(...allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Authenticated Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route
          path="pos"
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Manager', 'Cashier']}>
              <POS />
            </ProtectedRoute>
          }
        />
        <Route
          path="sales"
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Manager', 'Cashier']}>
              <SalesHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="returns"
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Manager', 'Cashier', 'Store Keeper']}>
              <SalesReturn />
            </ProtectedRoute>
          }
        />
        <Route
          path="register"
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Manager', 'Cashier']}>
              <CashRegister />
            </ProtectedRoute>
          }
        />
        <Route path="products" element={<Products />} />
        <Route
          path="inventory"
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Manager', 'Store Keeper']}>
              <Inventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="master"
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Manager', 'Store Keeper']}>
              <MasterData />
            </ProtectedRoute>
          }
        />
        <Route
          path="purchases"
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Manager', 'Store Keeper']}>
              <Purchases />
            </ProtectedRoute>
          }
        />
        <Route
          path="suppliers"
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Manager']}>
              <Suppliers />
            </ProtectedRoute>
          }
        />
        <Route
          path="customers"
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Manager', 'Cashier']}>
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route
          path="expenses"
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Manager', 'Cashier']}>
              <Expenses />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Manager']}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={['Super Admin']}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Manager']}>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
