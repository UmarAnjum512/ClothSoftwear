import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, Phone, Mail, MapPin, Search, Eye, X, CreditCard } from 'lucide-react';

export default function Customers() {
  const { hasRole } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [customerDetails, setCustomerDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    openingBalance: 0
  });

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers?search=${encodeURIComponent(search)}`);
      if (res.data.success) {
        setCustomers(res.data.customers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/customers', form);
      if (res.data.success) {
        alert('Customer registered successfully');
        setShowAddModal(false);
        setForm({ name: '', phone: '', email: '', address: '', openingBalance: 0 });
        fetchCustomers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating customer');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      const res = await api.post(`/customers/${selectedCustomer._id}/payment`, {
        amount: Number(payAmount),
        notes: payNotes
      });
      if (res.data.success) {
        alert('Payment recorded!');
        setShowPayModal(false);
        setSelectedCustomer(null);
        setPayAmount('');
        setPayNotes('');
        fetchCustomers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording payment');
    }
  };

  const openCustomerDetails = async (c) => {
    setSelectedCustomer(c);
    try {
      const res = await api.get(`/customers/${c._id}`);
      if (res.data.success) {
        setCustomerDetails(res.data);
        setShowDetailsModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Customer Accounts & Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track shopper contact info, credit balances and past invoices</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center space-x-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-400">No customers found.</div>
        ) : (
          customers.map(c => (
            <div key={c._id} className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                    c.currentBalance > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {c.currentBalance > 0 ? `Due: Rs. ${c.currentBalance.toLocaleString()}` : 'No Dues'}
                  </span>
                </div>

                <h3 className="font-bold text-slate-800 text-sm mt-3">{c.name}</h3>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.phone}</span>
                  </div>
                  {c.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => openCustomerDetails(c)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ledger History</span>
                </button>

                {c.currentBalance > 0 && (
                  <button
                    onClick={() => {
                      setSelectedCustomer(c);
                      setShowPayModal(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-lg transition-colors"
                  >
                    Receive Due
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">New Customer Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Customer Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Farhan Siddiqui"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Mobile / WhatsApp</label>
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
                <label className="block font-semibold text-slate-600 uppercase mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Residential Address</label>
                <input
                  type="text"
                  placeholder="Gulshan / DHA, Karachi"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-sm">
                  Save Customer
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-xl">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Customer Due Payment Modal */}
      {showPayModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm mb-1">Receive Due Payment</h3>
            <p className="text-xs text-slate-500 mb-3">Customer: {selectedCustomer.name}</p>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500">Current Due Balance:</span>
                <p className="font-bold text-rose-600 text-sm">Rs. {selectedCustomer.currentBalance.toLocaleString()}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Amount Received (PKR)</label>
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
                <label className="block font-semibold text-slate-600 uppercase mb-1">Receipt Notes</label>
                <input
                  type="text"
                  placeholder="Cash / Online Transfer"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-sm">
                  Record Received
                </button>
                <button type="button" onClick={() => setShowPayModal(false)} className="px-3 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-xl">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Ledger History Modal */}
      {showDetailsModal && customerDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base">{customerDetails.customer?.name}</h3>
                <p className="text-xs text-slate-500">Phone: {customerDetails.customer?.phone}</p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl flex justify-between items-center">
                <span>Outstanding Credit Balance:</span>
                <span className="text-base font-extrabold text-rose-600">
                  Rs. {Number(customerDetails.customer?.currentBalance || 0).toLocaleString()}
                </span>
              </div>

              <h4 className="font-bold text-slate-700 uppercase">Past Purchases & Invoices</h4>
              {customerDetails.sales?.length === 0 ? (
                <p className="text-slate-400 py-4 text-center">No transactions recorded for this customer yet.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {customerDetails.sales.map(s => (
                    <div key={s._id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                      <div>
                        <span className="font-mono font-bold text-indigo-600">{s.invoiceNo}</span>
                        <p className="text-[10px] text-slate-400">{new Date(s.createdAt).toLocaleString()} • {s.paymentMethod}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-800">Rs. {s.grandTotal}</p>
                        {s.dueAmount > 0 && <p className="text-[10px] text-rose-600 font-bold">Due: Rs. {s.dueAmount}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
