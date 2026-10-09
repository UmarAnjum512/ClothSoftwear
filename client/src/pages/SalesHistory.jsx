import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, Receipt, Eye, Ban, Calendar, Filter, Printer, X } from 'lucide-react';

export default function SalesHistory() {
  const { hasRole } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [showVoidModal, setShowVoidModal] = useState(false);

  useEffect(() => {
    fetchSales();
  }, [searchTerm]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/sales?invoiceNo=${encodeURIComponent(searchTerm)}`);
      if (res.data.success) {
        setSales(res.data.sales);
      }
    } catch (err) {
      console.error('Error fetching sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVoidSale = async () => {
    if (!selectedSale) return;
    try {
      const res = await api.post(`/sales/${selectedSale._id}/void`, { reason: voidReason || 'Order Voided by Staff' });
      if (res.data.success) {
        alert('Sale voided successfully and inventory restored');
        setShowVoidModal(false);
        setSelectedSale(null);
        setVoidReason('');
        fetchSales();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error voiding sale');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Sales Orders & Billing History</h1>
          <p className="text-xs text-slate-500 mt-0.5">View invoices, print receipts and manage transaction voids</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Invoice No</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Cashier</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-slate-400">Loading sales records...</td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-slate-400">No invoices found.</td>
                </tr>
              ) : (
                sales.map(sale => (
                  <tr key={sale._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{sale.invoiceNo}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{sale.customerName}</td>
                    <td className="py-3 px-4 text-slate-600">{sale.cashierId?.name || 'Cashier'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-800">
                      Rs. {Number(sale.grandTotal).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        sale.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : sale.status === 'Void'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => setSelectedSale(sale)}
                          title="View Invoice & Items"
                          className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {hasRole('Super Admin', 'Manager') && sale.status !== 'Void' && (
                          <button
                            onClick={() => {
                              setSelectedSale(sale);
                              setShowVoidModal(true);
                            }}
                            title="Void / Cancel Sale"
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Modal */}
      {selectedSale && !showVoidModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-800">Invoice: {selectedSale.invoiceNo}</h3>
                <p className="text-xs text-slate-500">
                  {new Date(selectedSale.createdAt).toLocaleString()} • {selectedSale.paymentMethod}
                </p>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="flex justify-between text-xs bg-slate-50 p-2.5 rounded-xl">
                <span>Customer: <strong className="text-slate-800">{selectedSale.customerName}</strong></span>
                <span>Status: <strong className="text-slate-800">{selectedSale.status}</strong></span>
              </div>

              <h4 className="text-xs font-bold text-slate-600 uppercase">Items Purchased</h4>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
                {selectedSale.items?.map((item, idx) => (
                  <div key={idx} className="p-2.5 flex justify-between items-center bg-white gap-3">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.productName} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : (
                          <Receipt className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{item.productName}</p>
                        <p className="text-[11px] text-slate-500">
                          Size: <strong className="text-indigo-600">{item.sizeName}</strong> • Color: {item.colorName} • SKU: {item.sku}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-slate-800">Rs. {item.total}</p>
                      <p className="text-[10px] text-slate-400">{item.qty} x Rs. {item.unitPrice}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>Rs. {selectedSale.subtotal}</span>
                </div>
                {selectedSale.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>- Rs. {selectedSale.discountTotal}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="text-indigo-600">Rs. {selectedSale.grandTotal}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Paid:</span>
                  <span>Rs. {selectedSale.paidAmount}</span>
                </div>
                {selectedSale.changeAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Change:</span>
                    <span>Rs. {selectedSale.changeAmount}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Bill</span>
              </button>
              <button
                onClick={() => setSelectedSale(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void Confirmation Modal */}
      {showVoidModal && selectedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-rose-600 text-base mb-1">Confirm Void Transaction</h3>
            <p className="text-xs text-slate-500 mb-4">
              Voiding invoice <strong>{selectedSale.invoiceNo}</strong> will automatically return all sold items back into inventory.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Reason for Void</label>
              <input
                type="text"
                placeholder="e.g. Customer cancelled / Billing error"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleVoidSale}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Yes, Void & Restore Stock
              </button>
              <button
                onClick={() => {
                  setShowVoidModal(false);
                  setSelectedSale(null);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
