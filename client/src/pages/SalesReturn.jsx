import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, RotateCcw, ArrowRightLeft, CheckCircle, AlertCircle, ShoppingBag, Plus, Trash2 } from 'lucide-react';

export default function SalesReturn() {
  const { user } = useAuth();
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [foundSale, setFoundSale] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  // Mode: 'Refund' or 'Exchange'
  const [returnType, setReturnType] = useState('Exchange');
  const [returnItems, setReturnItems] = useState([]);
  const [exchangeItems, setExchangeItems] = useState([]);

  // For selecting replacement items in Exchange
  const [allProducts, setAllProducts] = useState([]);
  const [selectedReplacementVariant, setSelectedReplacementVariant] = useState('');

  // Past returns history
  const [pastReturns, setPastReturns] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPastReturns();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      if (res.data.success) {
        setAllProducts(res.data.products);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPastReturns = async () => {
    try {
      const res = await api.get('/returns');
      if (res.data.success) {
        setPastReturns(res.data.returns);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Search invoice
  const handleSearchInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceSearch.trim()) return;
    setError('');
    setSearching(true);
    setFoundSale(null);
    setReturnItems([]);
    setExchangeItems([]);

    try {
      const res = await api.get(`/sales/${encodeURIComponent(invoiceSearch.trim())}`);
      if (res.data.success) {
        setFoundSale(res.data.sale);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invoice not found. Please check invoice number.');
    } finally {
      setSearching(false);
    }
  };

  // Add item from original sale to return list
  const toggleItemForReturn = (item) => {
    const existing = returnItems.find(r => r.variantId === item.variantId);
    if (existing) {
      setReturnItems(returnItems.filter(r => r.variantId !== item.variantId));
    } else {
      setReturnItems([
        ...returnItems,
        {
          variantId: item.variantId,
          productName: item.productName,
          sizeName: item.sizeName,
          colorName: item.colorName,
          unitPrice: item.unitPrice,
          qty: 1,
          maxQty: item.qty,
          disposition: 'saleable',
          reason: 'Size / Fit Mismatch'
        }
      ]);
    }
  };

  // Add exchange replacement item
  const handleAddExchangeItem = () => {
    if (!selectedReplacementVariant) return;
    // Find variant across products
    let foundVar = null;
    let parentProd = null;
    for (const p of allProducts) {
      const v = p.variants?.find(x => x._id === selectedReplacementVariant);
      if (v) {
        foundVar = v;
        parentProd = p;
        break;
      }
    }

    if (!foundVar) return;

    if (foundVar.stockQuantity <= 0) {
      alert('Selected replacement variant is out of stock!');
      return;
    }

    setExchangeItems([
      ...exchangeItems,
      {
        variantId: foundVar._id,
        productName: parentProd.name,
        sizeName: foundVar.sizeId?.name || '',
        colorName: foundVar.colorId?.name || '',
        unitPrice: foundVar.salePrice,
        qty: 1,
        total: foundVar.salePrice
      }
    ]);
    setSelectedReplacementVariant('');
  };

  // Calculations
  const totalReturnAmount = returnItems.reduce((acc, item) => acc + (item.unitPrice * item.qty), 0);
  const totalExchangeAmount = exchangeItems.reduce((acc, item) => acc + (item.unitPrice * item.qty), 0);
  const netDifference = totalExchangeAmount - totalReturnAmount;

  // Submit Return or Exchange
  const handleSubmit = async () => {
    if (returnItems.length === 0) {
      alert('Please select at least one item to return');
      return;
    }

    if (returnType === 'Exchange' && exchangeItems.length === 0) {
      alert('Please add replacement exchange item(s)');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        saleId: foundSale._id,
        returnType,
        returnedItems: returnItems,
        exchangeItems: returnType === 'Exchange' ? exchangeItems : [],
        refundMethod: 'Cash',
        notes: `Processed at counter for invoice ${foundSale.invoiceNo}`
      };

      const res = await api.post('/returns', payload);
      if (res.data.success) {
        alert(`${returnType} processed successfully! Inventory has been updated.`);
        setFoundSale(null);
        setReturnItems([]);
        setExchangeItems([]);
        setInvoiceSearch('');
        fetchPastReturns();
        fetchProducts();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process return');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Sales Returns & Exchanges</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Process size/color exchanges, calculate price differences, and record saleable or damaged returns
        </p>
      </div>

      {/* Invoice Lookup Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 className="font-bold text-slate-800 text-sm mb-3">1. Find Original Sales Invoice</h2>
        <form onSubmit={handleSearchInvoice} className="flex gap-3 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              required
              placeholder="e.g. INV-20261007-1234"
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
          >
            {searching ? 'Finding...' : 'Find Bill'}
          </button>
        </form>

        {error && (
          <div className="mt-3 text-xs text-rose-600 flex items-center space-x-1.5 font-medium">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Found Sale Processing Area */}
      {foundSale && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-2">
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase">Invoice Found</span>
              <h3 className="font-bold text-slate-800 text-base">{foundSale.invoiceNo}</h3>
              <p className="text-xs text-slate-500">
                Customer: <strong>{foundSale.customerName}</strong> • Date: {new Date(foundSale.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Mode Selector */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setReturnType('Exchange')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  returnType === 'Exchange' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Exchange Size / Item</span>
              </button>
              <button
                type="button"
                onClick={() => setReturnType('Refund')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  returnType === 'Refund' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Cash Refund</span>
              </button>
            </div>
          </div>

          {/* Select Items to Return */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">
              Select Item(s) Being Returned by Customer
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {foundSale.items.map(item => {
                const isSelected = returnItems.some(r => r.variantId === item.variantId);
                return (
                  <div
                    key={item.variantId}
                    onClick={() => toggleItemForReturn(item)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                          {item.image ? (
                            <img src={item.image} alt={item.productName} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                          ) : (
                            <ShoppingBag className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-xs truncate">{item.productName}</p>
                          <p className="text-[11px] text-slate-500">
                            Size: <strong className="text-indigo-600">{item.sizeName}</strong> • Color: {item.colorName} • Qty Sold: {item.qty}
                          </p>
                        </div>
                      </div>
                      <span className="font-extrabold text-slate-800 text-xs shrink-0">Rs. {item.unitPrice}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Configure Returned Items Details */}
          {returnItems.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase">Return Details & Condition</h4>
              {returnItems.map((rItem, idx) => (
                <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between text-xs">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{rItem.productName} ({rItem.sizeName})</p>
                    <p className="text-[10px] text-slate-400">Rs. {rItem.unitPrice} each</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Disposition</label>
                      <select
                        value={rItem.disposition}
                        onChange={(e) => {
                          const val = e.target.value;
                          setReturnItems(returnItems.map((it, i) => i === idx ? { ...it, disposition: val } : it));
                        }}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                      >
                        <option value="saleable">Saleable (Restock to Shelf)</option>
                        <option value="damaged">Damaged (Do Not Restock)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Reason</label>
                      <select
                        value={rItem.reason}
                        onChange={(e) => {
                          const val = e.target.value;
                          setReturnItems(returnItems.map((it, i) => i === idx ? { ...it, reason: val } : it));
                        }}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                      >
                        <option value="Size / Fit Mismatch">Size / Fit Mismatch</option>
                        <option value="Color Choice Change">Color Choice Change</option>
                        <option value="Fabric / Defect Issue">Fabric / Defect Issue</option>
                        <option value="Customer Mind Change">Customer Mind Change</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Replacement selection if Exchange mode */}
          {returnType === 'Exchange' && returnItems.length > 0 && (
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3">
              <h4 className="text-xs font-bold text-indigo-900 uppercase">
                Select Replacement Exchange Apparel
              </h4>
              <div className="flex gap-2">
                <select
                  value={selectedReplacementVariant}
                  onChange={(e) => setSelectedReplacementVariant(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                >
                  <option value="">-- Choose New Variant / Size from Store --</option>
                  {allProducts.map(p =>
                    p.variants?.filter(v => v.stockQuantity > 0).map(v => (
                      <option key={v._id} value={v._id}>
                        {p.name} - Size: {v.sizeId?.name} - {v.colorId?.name} (Rs. {v.salePrice}) [In Stock: {v.stockQuantity}]
                      </option>
                    ))
                  )}
                </select>
                <button
                  type="button"
                  onClick={handleAddExchangeItem}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Add Replacement
                </button>
              </div>

              {exchangeItems.map((ex, i) => (
                <div key={i} className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-indigo-100 text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{ex.productName}</span>
                    <span className="text-slate-500 ml-2">({ex.sizeName} / {ex.colorName})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-indigo-700">Rs. {ex.unitPrice}</span>
                    <button
                      onClick={() => setExchangeItems(exchangeItems.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Financial reconciliation */}
          {returnItems.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Value of Returned Garments:</span>
                <span className="font-bold text-white">Rs. {totalReturnAmount.toLocaleString()}</span>
              </div>
              {returnType === 'Exchange' && (
                <div className="flex justify-between text-slate-300">
                  <span>Value of Replacement Garments:</span>
                  <span className="font-bold text-white">Rs. {totalExchangeAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-700 flex justify-between font-extrabold text-sm">
                <span>
                  {returnType === 'Refund'
                    ? 'Total Refund Due to Customer:'
                    : netDifference > 0
                    ? 'Customer Pays Difference:'
                    : netDifference < 0
                    ? 'Refund Difference to Customer:'
                    : 'Even Exchange (No difference):'}
                </span>
                <span className={netDifference > 0 ? 'text-amber-400 text-base' : 'text-emerald-400 text-base'}>
                  Rs. {Math.abs(returnType === 'Refund' ? totalReturnAmount : netDifference).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {returnItems.length > 0 && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{submitting ? 'Processing Return...' : `Confirm & Complete ${returnType}`}</span>
            </button>
          )}
        </div>
      )}

      {/* Returns History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm">Past Returns & Exchanges Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase">
                <th className="py-3 px-4">Return #</th>
                <th className="py-3 px-4">Original Invoice</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Return Amount</th>
                <th className="py-3 px-4 text-right">Net Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pastReturns.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">No returns or exchanges recorded yet.</td>
                </tr>
              ) : (
                pastReturns.map(ret => (
                  <tr key={ret._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{ret.returnNo}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{ret.invoiceNo}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700 text-[10px]">
                        {ret.returnType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{new Date(ret.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800">Rs. {ret.totalReturnAmount}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-700">Rs. {ret.netDifference}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
