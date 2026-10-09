import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Boxes,
  AlertTriangle,
  ArrowUpDown,
  History,
  SlidersHorizontal,
  X,
  CheckCircle,
  Search,
  Filter
} from 'lucide-react';

export default function Inventory() {
  const { hasRole } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(''); // '', 'lowStock', 'outOfStock'
  const [search, setSearch] = useState('');

  // Stock Adjustment modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    adjustmentType: 'Addition',
    quantity: 1,
    reason: 'Physical Count Discrepancy',
    notes: ''
  });

  // Stock Movement History modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [movements, setMovements] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, [filterStatus]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/inventory?filterStatus=${filterStatus}`);
      if (res.data.success) {
        setInventory(res.data.inventory);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!selectedVariant) return;

    try {
      const res = await api.post('/inventory/adjust', {
        variantId: selectedVariant._id,
        ...adjustForm
      });
      if (res.data.success) {
        alert('Stock adjusted successfully!');
        setShowAdjustModal(false);
        setSelectedVariant(null);
        setAdjustForm({
          adjustmentType: 'Addition',
          quantity: 1,
          reason: 'Physical Count Discrepancy',
          notes: ''
        });
        fetchInventory();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error adjusting stock');
    }
  };

  const openMovementsHistory = async (variant = null) => {
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const url = variant ? `/inventory/movements?variantId=${variant._id}` : '/inventory/movements';
      const res = await api.get(url);
      if (res.data.success) {
        setMovements(res.data.movements);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filtered = inventory.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.productId?.name?.toLowerCase().includes(q) ||
      v.sku.toLowerCase().includes(q) ||
      v.barcode.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Stock & Inventory Control</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Variant-level stock levels, low-stock threshold triggers, and audit-logged manual adjustments
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => openMovementsHistory(null)}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <History className="w-4 h-4 text-indigo-600" />
            <span>Traceable Movement Logs</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setFilterStatus('')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${filterStatus === '' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            All Stock Items
          </button>
          <button
            onClick={() => setFilterStatus('lowStock')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${filterStatus === 'lowStock' ? 'bg-amber-600 text-white' : 'text-amber-700 hover:bg-amber-50'}`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Alert</span>
          </button>
          <button
            onClick={() => setFilterStatus('outOfStock')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${filterStatus === 'outOfStock' ? 'bg-rose-600 text-white' : 'text-rose-700 hover:bg-rose-50'}`}
          >
            Out of Stock
          </button>
        </div>

        <div className="relative sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by SKU, name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <th className="py-3.5 px-4">Garment / Item</th>
                <th className="py-3.5 px-4">Size & Color</th>
                <th className="py-3.5 px-4">SKU / Barcode</th>
                <th className="py-3.5 px-4 text-right">Cost Price</th>
                <th className="py-3.5 px-4 text-right">Retail Sale</th>
                <th className="py-3.5 px-4 text-center">In-Stock Qty</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-slate-400">Loading stock data...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-slate-400">No matching variants found.</td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {item.productId?.images?.[0] ? (
                          <img
                            src={item.productId.images[0]}
                            alt={item.productId.name}
                            className="w-9 h-9 rounded-md object-cover border border-slate-200 shrink-0"
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                            <span className="text-slate-400 text-xs">👕</span>
                          </div>
                        )}
                        <span className="font-bold text-slate-800">{item.productId?.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="font-bold text-indigo-600">{item.sizeId?.name}</span> / {item.colorId?.name}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="font-semibold text-slate-700">{item.sku}</div>
                      <div className="text-[10px] text-slate-400">{item.barcode}</div>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">Rs. {item.costPrice}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-800">Rs. {item.salePrice}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm font-extrabold text-slate-800">{item.stockQuantity}</span>
                      <span className="text-[10px] text-slate-400 block">Min: {item.reorderLevel}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Out of Stock
                        </span>
                      ) : item.isLowStock ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {hasRole('Super Admin', 'Manager', 'Store Keeper') && (
                          <button
                            onClick={() => {
                              setSelectedVariant(item);
                              setShowAdjustModal(true);
                            }}
                            title="Adjust Stock (+ / -)"
                            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => openMovementsHistory(item)}
                          title="Movement History"
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Stock Adjustment */}
      {showAdjustModal && selectedVariant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">Stock Adjustment Audit</h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="py-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-800">{selectedVariant.productId?.name}</p>
                <p className="text-slate-500">
                  Size: {selectedVariant.sizeId?.name} • SKU: {selectedVariant.sku} • Current Stock: <strong className="text-indigo-600">{selectedVariant.stockQuantity}</strong>
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Adjustment Action</label>
                <select
                  value={adjustForm.adjustmentType}
                  onChange={(e) => setAdjustForm({ ...adjustForm, adjustmentType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="Addition">Addition (+) Increase Stock</option>
                  <option value="Deduction">Deduction (-) Decrease Stock</option>
                  <option value="Set Exact">Set Exact Quantity</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Mandatory Audit Reason</label>
                <select
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="Physical Count Discrepancy">Physical Count Discrepancy</option>
                  <option value="Damage/Spoilage">Damage / Spoilage</option>
                  <option value="Theft/Loss">Theft / Loss</option>
                  <option value="Inventory Restock">Inventory Restock</option>
                  <option value="Sample Given">Sample Given</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Audit Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Physical inventory check on shelf B"
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Confirm Stock Adjustment
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Stock Movement Logs History */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Traceable Stock Movements</h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4">
              {loadingHistory ? (
                <p className="text-center py-8 text-slate-400 text-xs">Loading movement logs...</p>
              ) : movements.length === 0 ? (
                <p className="text-center py-8 text-slate-400 text-xs">No stock movements recorded yet.</p>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {movements.map(m => (
                    <div key={m._id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800">{m.productName}</span>
                        <span className="text-slate-500 ml-2 font-mono">({m.sku})</span>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(m.createdAt).toLocaleString()} • Logged by: {m.userName} • {m.notes}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] ${
                          m.qtyChange > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {m.qtyChange > 0 ? `+${m.qtyChange}` : m.qtyChange} ({m.type})
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {m.previousStock} &rarr; <strong>{m.newStock}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowHistoryModal(false)}
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
