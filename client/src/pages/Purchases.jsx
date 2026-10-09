import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Truck, Plus, Search, Eye, X, CheckCircle, RotateCcw } from 'lucide-react';

export default function Purchases() {
  const { hasRole } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Purchase Modal
  const [showModal, setShowModal] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [items, setItems] = useState([{ variantId: '', qty: 10, unitCost: 1500 }]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');

  // View purchase modal
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [purRes, supRes, prodRes] = await Promise.all([
        api.get('/purchases'),
        api.get('/suppliers'),
        api.get('/products')
      ]);

      if (purRes.data.success) setPurchases(purRes.data.purchases);
      if (supRes.data.success) setSuppliers(supRes.data.suppliers);
      if (prodRes.data.success) setProducts(prodRes.data.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addItemRow = () => {
    setItems([...items, { variantId: '', qty: 10, unitCost: 1500 }]);
  };

  const removeItemRow = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItemRow = (idx, field, val) => {
    setItems(items.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  };

  const subtotal = items.reduce((acc, it) => acc + (Number(it.qty) * Number(it.unitCost)), 0);
  const totalAmount = Math.max(0, subtotal - Number(discount) + Number(tax));

  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    if (!supplierId || items.some(it => !it.variantId)) {
      alert('Please select supplier and all garment variants');
      return;
    }

    try {
      const res = await api.post('/purchases', {
        supplierId,
        invoiceNo,
        items,
        discount: Number(discount),
        tax: Number(tax),
        paidAmount: Number(paidAmount),
        paymentMethod,
        notes
      });

      if (res.data.success) {
        alert('Purchase invoice recorded! Inventory updated.');
        setShowModal(false);
        setSupplierId('');
        setInvoiceNo('');
        setItems([{ variantId: '', qty: 10, unitCost: 1500 }]);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving purchase');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Merchandise Purchases</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Procure inventory from textile suppliers; stock increases automatically upon receiving
          </p>
        </div>

        {hasRole('Super Admin', 'Manager', 'Store Keeper') && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Bill</span>
          </button>
        )}
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <th className="py-3.5 px-4">Bill No</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Items Count</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
                <th className="py-3.5 px-4 text-right">Paid</th>
                <th className="py-3.5 px-4 text-right">Balance Due</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-slate-400">Loading purchases...</td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-slate-400">No purchase invoices recorded yet.</td>
                </tr>
              ) : (
                purchases.map(p => (
                  <tr key={p._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{p.invoiceNo}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{p.supplierId?.name}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(p.purchaseDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{p.items?.length || 0} variants</td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-800">Rs. {p.totalAmount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-emerald-700 font-semibold">Rs. {p.paidAmount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-rose-600 font-bold">Rs. {p.dueAmount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedPurchase(p)}
                        className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        title="View Purchase Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Create Purchase */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">New Purchase Receiving</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 uppercase mb-1">Supplier</label>
                  <select
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="">-- Select Supplier --</option>
                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 uppercase mb-1">Supplier Invoice #</label>
                  <input
                    type="text"
                    placeholder="e.g. BILL-99882"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-slate-700 uppercase">Received Garments</h4>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-[11px]"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-2 items-center">
                      <select
                        required
                        value={it.variantId}
                        onChange={(e) => updateItemRow(idx, 'variantId', e.target.value)}
                        className="flex-1 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="">-- Choose Variant / SKU --</option>
                        {products.map(p =>
                          p.variants?.map(v => (
                            <option key={v._id} value={v._id}>
                              {p.name} ({v.sizeId?.name} / {v.colorId?.name}) - SKU: {v.sku}
                            </option>
                          ))
                        )}
                      </select>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="Qty"
                          value={it.qty}
                          onChange={(e) => updateItemRow(idx, 'qty', e.target.value)}
                          className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                        <input
                          type="number"
                          min="0"
                          required
                          placeholder="Cost"
                          value={it.unitCost}
                          onChange={(e) => updateItemRow(idx, 'unitCost', e.target.value)}
                          className="w-24 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                        <span className="font-bold text-slate-700 w-20 text-right">
                          Rs. {Number(it.qty) * Number(it.unitCost)}
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold">Subtotal</label>
                  <p className="font-extrabold text-sm text-slate-800">Rs. {subtotal.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold">Discount (Rs)</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold">Total Payable</label>
                  <p className="font-extrabold text-sm text-indigo-700">Rs. {totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold">Amount Paid</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Receive Stock & Post Purchase
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: View Purchase Details */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">Purchase Bill: {selectedPurchase.invoiceNo}</h3>
              <button onClick={() => setSelectedPurchase(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between bg-slate-50 p-2.5 rounded-xl">
                <span>Supplier: <strong>{selectedPurchase.supplierId?.name}</strong></span>
                <span>Date: <strong>{new Date(selectedPurchase.purchaseDate).toLocaleDateString()}</strong></span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                {selectedPurchase.items?.map((item, idx) => (
                  <div key={idx} className="p-2.5 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-800">{item.variantId?.productId?.name || 'Garment'}</p>
                      <p className="text-[10px] text-slate-400">SKU: {item.variantId?.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">Rs. {item.total}</p>
                      <p className="text-[10px] text-slate-400">{item.qty} pcs @ Rs. {item.unitCost}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span>Grand Total:</span>
                  <span className="font-bold text-slate-800">Rs. {selectedPurchase.totalAmount}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Paid Amount:</span>
                  <span className="font-bold">Rs. {selectedPurchase.paidAmount}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Due Balance:</span>
                  <span className="font-bold">Rs. {selectedPurchase.dueAmount}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPurchase(null)}
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
