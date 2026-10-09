import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Plus, Trash2, Edit2, User, Key, CheckCircle, X, Lock } from 'lucide-react';

export default function Users() {
  const { hasRole, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'Cashier'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/users', form);
      if (res.data.success) {
        alert('User created successfully');
        setShowAddModal(false);
        setForm({ name: '', email: '', password: '', phone: '', role: 'Cashier' });
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff user?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Staff Accounts & Role Permissions</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-Based Access Control (Super Admin, Manager, Cashier, Store Keeper)
          </p>
        </div>

        {hasRole('Super Admin') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Staff Member</span>
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase">
                <th className="py-3.5 px-4">Staff Name</th>
                <th className="py-3.5 px-4">Email Address</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Assigned Role</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">Loading staff...</td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-800">{u.name}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{u.email}</td>
                    <td className="py-3 px-4 text-slate-600">{u.phone || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        u.role === 'Super Admin'
                          ? 'bg-purple-50 text-purple-700'
                          : u.role === 'Manager'
                          ? 'bg-blue-50 text-blue-700'
                          : u.role === 'Cashier'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {hasRole('Super Admin') && u._id !== currentUser?.id && (
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Add New Staff Member</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asad Raza"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@hooriyaarts.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Role Permission Group</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="Cashier">Cashier (POS Checkout & Shifts)</option>
                  <option value="Store Keeper">Store Keeper (Products, Receiving & Stock)</option>
                  <option value="Manager">Manager (Operations, Stock & Reports)</option>
                  <option value="Super Admin">Super Admin (Full System Control)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="03001234567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-sm">
                  Create User
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-xl">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
