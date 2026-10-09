import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Truck, Plus, Phone, Mail, MapPin, DollarSign, X } from 'lucide-react';

export default function Suppliers() {
  const { hasRole } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    openingBalance: 0
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/suppliers');
      if (res.data.success) {
        setSuppliers(res.data.suppliers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/suppliers', form);
      if (res.data.success) {
        alert('Supplier added successfully');
        setShowAddModal(false);
        setForm({ name: '', contactPerson: '', phone: '', email: '', address: '', openingBalance: 0 });
        fetchSuppliers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating supplier');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    try {
      const res = await api.post(`/suppliers/${selectedSupplier._id}/payment`, {
        amount: Number(payAmount),
        notes: payNotes
      });
      if (res.data.success) {
        alert('Payment recorded!');
        setShowPayModal(false);
        setSelectedSupplier(null);
        setPayAmount('');
        setPayNotes('');
        fetchSuppliers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording payment');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Suppliers & Fabric Mills</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage garment manufacturers, accounts and payment history</p>
        </div>

        {hasRole('Super Admin', 'Manager') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400">Loading suppliers...</div>
        ) : suppliers.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-400">No suppliers registered.</div>
        ) : (
          suppliers.map(sup => (
            <div key={sup._id} className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                    <Truck className="w-5 h-5" />
                  </div>
                  <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                    sup.currentBalance > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {sup.currentBalance > 0 ? `Payable: Rs. ${sup.currentBalance.toLocaleString()}` : 'Settled'}
                  </span>
                </div>

                <h3 className="font-bold text-slate-800 text-sm mt-3">{sup.name}</h3>
                <p className="text-xs text-slate-500">Contact: {sup.contactPerson || 'N/A'}</p>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sup.phone}</span>
                  </div>
                  {sup.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sup.email}</span>
                    </div>
                  )}
                  {sup.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sup.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {hasRole('Super Admin', 'Manager') && (
                <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedSupplier(sup);
                      setShowPayModal(true);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 font-bold text-xs rounded-lg transition-colors"
                  >
                    Record Payment
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">New Supplier Profile</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Company / Mill Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sapphire Finishing Mills"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Tariq Khan"
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Phone</label>
                <input
                  type="text"
                  required
                  placeholder="03001234567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Address / Industrial Area</label>
                <input
                  type="text"
                  placeholder="Karachi SITE"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-sm">
                  Save Supplier
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-xl">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayModal && selectedSupplier && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm mb-1">Supplier Payment</h3>
            <p className="text-xs text-slate-500 mb-3">Pay dues for {selectedSupplier.name}</p>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500">Current Due Balance:</span>
                <p className="font-bold text-rose-600 text-sm">Rs. {selectedSupplier.currentBalance.toLocaleString()}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Payment Amount (PKR)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Payment Notes / Cheque #</label>
                <input
                  type="text"
                  placeholder="Bank transfer / Cash"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-sm">
                  Confirm Payment
                </button>
                <button type="button" onClick={() => setShowPayModal(false)} className="px-3 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-xl">
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
