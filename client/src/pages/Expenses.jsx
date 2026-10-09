import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PiggyBank, Plus, Trash2, Calendar, Filter, X } from 'lucide-react';

export default function Expenses() {
  const { hasRole } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  const [form, setForm] = useState({
    title: '',
    category: 'Shop Rent',
    amount: '',
    paymentMethod: 'Cash',
    description: ''
  });

  const categoriesList = [
    'Shop Rent',
    'Electricity & Utility',
    'Staff Salaries',
    'Maintenance & Repair',
    'Packaging & Bags',
    'Tea & Refreshments',
    'Marketing & Ads',
    'Transportation / Fuel',
    'Internet / Software',
    'Miscellaneous'
  ];

  useEffect(() => {
    fetchExpenses();
  }, [selectedCategory]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const url = selectedCategory ? `/expenses?category=${encodeURIComponent(selectedCategory)}` : '/expenses';
      const res = await api.get(url);
      if (res.data.success) {
        setExpenses(res.data.expenses);
        setTotalAmount(res.data.totalAmount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/expenses', form);
      if (res.data.success) {
        alert('Expense recorded successfully');
        setShowAddModal(false);
        setForm({
          title: '',
          category: 'Shop Rent',
          amount: '',
          paymentMethod: 'Cash',
          description: ''
        });
        fetchExpenses();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      alert('Error deleting expense');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Operating Expenses</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log shop utilities, rent, salaries and packaging costs for real-time Net Profit calculations
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Top Banner Total */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <PiggyBank className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Expenses Recorded</span>
            <p className="text-2xl font-extrabold text-slate-800">Rs. {Number(totalAmount).toLocaleString()}</p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-60 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="">All Categories ({expenses.length})</option>
            {categoriesList.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase">
                <th className="py-3.5 px-4">Expense Title</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4">Recorded By</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">Loading expenses...</td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">No expenses recorded.</td>
                </tr>
              ) : (
                expenses.map(exp => (
                  <tr key={exp._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {exp.title}
                      {exp.description && <p className="text-[11px] text-slate-400 font-normal">{exp.description}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{new Date(exp.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-slate-600">{exp.paymentMethod}</td>
                    <td className="py-3 px-4 text-slate-600">{exp.recordedBy?.name || 'Staff'}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-rose-600">
                      Rs. {exp.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {hasRole('Super Admin', 'Manager') && (
                        <button
                          onClick={() => handleDeleteExpense(exp._id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete Expense"
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

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Record Operating Expense</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Expense Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electricity bill for September"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Amount (PKR)</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 15000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Cash">Cash (from Drawer)</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Easypaisa">Easypaisa</option>
                  <option value="JazzCash">JazzCash</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Notes / Description</label>
                <input
                  type="text"
                  placeholder="Additional details..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-sm">
                  Save Expense
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
