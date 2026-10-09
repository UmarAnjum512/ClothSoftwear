import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  Printer,
  CheckCircle,
  AlertCircle,
  X,
  UserPlus,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function POS() {
  const { user, activeRegister, fetchActiveRegister } = useAuth();

  // Search & Catalog state
  const [searchInput, setSearchInput] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState([]);

  // Customer state
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', email: '', address: '' });

  // Calculation state
  const [discountType, setDiscountType] = useState('flat'); // 'flat' or 'percent'
  const [discountValue, setDiscountValue] = useState(0);
  const [taxRate, setTaxRate] = useState(0);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [tenderedAmount, setTenderedAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Shift warning/opener modal
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [openingCashInput, setOpeningCashInput] = useState(5000);

  // Receipt Modal state
  const [completedSale, setCompletedSale] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptFormat, setReceiptFormat] = useState('thermal'); // 'thermal' or 'a4'

  // Store details printed on receipts (editable in Settings)
  const [storeInfo, setStoreInfo] = useState({
    storeName: 'HOORIYA ARTS',
    storeAddress: '',
    storePhone: '',
    receiptFooterNote: ''
  });

  const barcodeInputRef = useRef(null);

  // Load initial catalog, categories, customers
  useEffect(() => {
    fetchCatalog();
    fetchCategories();
    fetchCustomers();
    fetchStoreInfo();
  }, []);

  // Auto focus barcode input
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [showPaymentModal, showReceiptModal]);

  const fetchCatalog = async () => {
    try {
      const res = await api.get('/products');
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/master/categories');
      if (res.data.success) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchStoreInfo = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.success && res.data.settings) {
        setStoreInfo(prev => ({ ...prev, ...res.data.settings }));
      }
    } catch (err) {
      console.error('Error fetching store settings:', err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      if (res.data.success) {
        setCustomers(res.data.customers);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  // Barcode / SKU scanner handler
  const handleBarcodeScan = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = searchInput.trim();
      if (!code) return;

      try {
        const res = await api.get(`/products/search/${encodeURIComponent(code)}`);
        if (res.data.success && res.data.matches.length > 0) {
          // If direct match found
          const variant = res.data.matches[0];
          addToCart(variant);
          setSearchInput('');
        } else {
          alert(`No variant found with Barcode or SKU: "${code}"`);
        }
      } catch (err) {
        console.error('Search error:', err);
      }
    }
  };

  // Add variant to cart
  const addToCart = (variant) => {
    if (variant.stockQuantity <= 0) {
      alert(`Cannot add: "${variant.productId?.name || 'Item'} (${variant.sku})" is Out of Stock!`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.variantId === variant._id);
      if (existing) {
        if (existing.qty + 1 > variant.stockQuantity) {
          alert(`Only ${variant.stockQuantity} items in stock for ${variant.sku}`);
          return prev;
        }
        return prev.map(item =>
          item.variantId === variant._id ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        return [
          ...prev,
          {
            variantId: variant._id,
            productId: variant.productId?._id,
            productName: variant.productId?.name || 'Clothing Item',
            image: (variant.productId?.images && variant.productId.images.length > 0) ? variant.productId.images[0] : (variant.image || ''),
            sku: variant.sku,
            barcode: variant.barcode,
            sizeName: variant.sizeId?.name || '-',
            colorName: variant.colorId?.name || '-',
            costPrice: variant.costPrice,
            unitPrice: variant.salePrice,
            stockQuantity: variant.stockQuantity,
            qty: 1,
            discount: 0
          }
        ];
      }
    });
  };

  const updateCartQty = (variantId, delta) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.variantId === variantId) {
            const newQty = item.qty + delta;
            if (newQty <= 0) return null;
            if (newQty > item.stockQuantity) {
              alert(`Maximum stock available is ${item.stockQuantity}`);
              return item;
            }
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeCartItem = (variantId) => {
    setCart(prev => prev.filter(item => item.variantId !== variantId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Clear all items in the cart?')) {
      setCart([]);
    }
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.unitPrice * item.qty) - (item.discount || 0), 0);

  const discountAmount =
    discountType === 'percent'
      ? Math.round((subtotal * Number(discountValue)) / 100)
      : Math.min(subtotal, Number(discountValue) || 0);

  const taxAmount = Math.round(((subtotal - discountAmount) * Number(taxRate)) / 100);
  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount);

  const tendered = Number(tenderedAmount) || grandTotal;
  const changeDue = Math.max(0, tendered - grandTotal);
  const remainingDue = Math.max(0, grandTotal - tendered);

  // Quick Open shift if none is active
  const handleOpenShift = async () => {
    try {
      await api.post('/register/open', { openingCash: openingCashInput, notes: 'Shift opened from POS screen' });
      await fetchActiveRegister();
      setShowOpenShiftModal(false);
      alert('Shift opened successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to open register shift');
    }
  };

  // Create new customer inline
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/customers', newCustomerForm);
      if (res.data.success) {
        setCustomers(prev => [...prev, res.data.customer]);
        setSelectedCustomer(res.data.customer);
        setShowNewCustomerModal(false);
        setNewCustomerForm({ name: '', phone: '', email: '', address: '' });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create customer');
    }
  };

  // Complete checkout
  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    setProcessing(true);

    try {
      const payload = {
        customerId: selectedCustomer?._id || null,
        customerName: selectedCustomer?.name || 'Walk-in Customer',
        customerPhone: selectedCustomer?.phone || '',
        items: cart.map(item => ({
          variantId: item.variantId,
          qty: item.qty,
          unitPrice: item.unitPrice,
          image: item.image || '',
          discount: item.discount || 0
        })),
        discountTotal: discountAmount,
        taxRate,
        taxTotal: taxAmount,
        paidAmount: tendered > grandTotal ? grandTotal : tendered,
        paymentMethod,
        notes: paymentNotes
      };

      const res = await api.post('/sales', payload);
      if (res.data.success) {
        setCompletedSale(res.data.sale);
        setShowPaymentModal(false);
        setShowReceiptModal(true);
        setCart([]);
        setSelectedCustomer(null);
        setDiscountValue(0);
        setTenderedAmount('');
        setPaymentNotes('');
        fetchCatalog(); // Refresh available stock counts
        fetchActiveRegister(); // Refresh shift stats
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error completing transaction');
    } finally {
      setProcessing(false);
    }
  };

  // Filter products for catalog grid
  const filteredProducts = products.filter(p => {
    if (selectedCategory && p.categoryId?._id !== selectedCategory) return false;
    if (searchInput) {
      const q = searchInput.toLowerCase();
      const nameMatch = p.name.toLowerCase().includes(q);
      const variantMatch = p.variants?.some(v => v.sku.toLowerCase().includes(q) || v.barcode.includes(q));
      return nameMatch || variantMatch;
    }
    return true;
  });

  return (
    <div className="flex flex-col lg:flex-row -m-4 sm:-m-6 lg:-m-8 h-[calc(100vh-3.5rem)] bg-slate-100 overflow-hidden">
      {/* LEFT SECTION: Search, Categories, Product Catalog */}
      <div className="flex-1 flex flex-col min-w-0 p-3 sm:p-4 lg:p-5 overflow-hidden gap-3">
        {/* Search & Barcode Scan Bar */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Barcode className="w-5 h-5" />
            </div>
            <input
              ref={barcodeInputRef}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleBarcodeScan}
              placeholder="Scan Barcode / Enter SKU / Search Product (Press Enter to add)..."
              className="block w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
            />
          </div>
          <button
            onClick={() => handleBarcodeScan({ key: 'Enter', preventDefault: () => {} })}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center space-x-1"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === ''
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Apparel ({products.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat._id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat._id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid — 2 cols mobile, 3 cols md, 4 cols xl */}
        <div className="flex-1 overflow-y-auto pb-2">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400 mt-1">
              <Layers className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-600 text-sm">No items found matching your filter</p>
              <p className="text-xs text-slate-400 mt-1">Try searching another keyword or scan barcode</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pt-1">
              {filteredProducts.map(product => (
                <div
                  key={product._id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all overflow-hidden flex flex-col"
                >
                  {/* Product Image */}
                  <div className="w-full aspect-[4/3] bg-slate-100 overflow-hidden flex items-center justify-center relative">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <Shirt className="w-8 h-8 text-slate-300" />
                    )}
                    {/* Variant count badge */}
                    <span className="absolute top-2 right-2 text-[10px] font-bold bg-white/90 backdrop-blur-sm text-slate-600 px-1.5 py-0.5 rounded-full border border-slate-200 shadow-xs">
                      {product.variants?.length || 0} var
                    </span>
                  </div>

                  {/* Product Info */}
                  <div className="p-2.5 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-800 text-xs leading-tight line-clamp-1">{product.name}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {product.categoryId?.name}{product.brandId?.name ? ` · ${product.brandId.name}` : ''}
                    </p>

                    {/* Variant Buttons */}
                    <div className="mt-2 grid grid-cols-2 gap-1 flex-1">
                      {product.variants?.map(variant => {
                        const isOut = variant.stockQuantity <= 0;
                        const isLow = variant.stockQuantity <= variant.reorderLevel && !isOut;
                        return (
                          <button
                            key={variant._id}
                            disabled={isOut}
                            onClick={() => addToCart({ ...variant, productId: product })}
                            className={`p-1.5 rounded-lg text-left border transition-all text-[10px] ${
                              isOut
                                ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                : 'bg-slate-50 hover:bg-indigo-50 border-slate-200 hover:border-indigo-400 text-slate-700 active:scale-95'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-indigo-600 font-mono">{variant.sizeId?.name}</span>
                              <span className={`text-[9px] font-semibold ${isOut ? 'text-rose-500' : isLow ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {isOut ? '✕ Out' : `${variant.stockQuantity}✓`}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className="text-slate-500 truncate max-w-[50px]">{variant.colorId?.name}</span>
                              <span className="font-bold text-slate-800">Rs.{Number(variant.salePrice).toLocaleString()}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* RIGHT SECTION: Cart, Customer Selector, Payment Checkout */}
      <div className="w-full lg:w-[420px] bg-white border-l border-slate-200 flex flex-col h-full shadow-lg z-20">
        {/* Customer Select Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Customer</span>
            </span>
            <button
              onClick={() => setShowNewCustomerModal(true)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ New Customer</span>
            </button>
          </div>

          <div className="relative">
            <select
              value={selectedCustomer?._id || ''}
              onChange={(e) => {
                const found = customers.find(c => c._id === e.target.value);
                setSelectedCustomer(found || null);
              }}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Walk-in Customer (General)</option>
              {customers.map(c => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.phone}) {c.currentBalance > 0 ? `[Due: Rs. ${c.currentBalance}]` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Barcode className="w-12 h-12 text-slate-300 mb-2 stroke-1" />
              <p className="font-semibold text-slate-600 text-sm">Cart is currently empty</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                Scan barcode or select apparel variant to start billing
              </p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.variantId} className="pt-2.5 first:pt-0 flex items-center justify-between text-xs gap-2.5">
                <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                  {item.image ? (
                    <img src={item.image} alt={item.productName} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <Shirt className="w-5 h-5 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <h4 className="font-semibold text-slate-800 line-clamp-1">{item.productName}</h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    Size: <span className="font-bold text-indigo-600">{item.sizeName}</span> • Color: {item.colorName}
                  </p>
                  <p className="text-[11px] font-bold text-slate-700 mt-0.5">
                    Rs. {Number(item.unitPrice).toLocaleString()}
                  </p>
                </div>

                {/* Qty changer */}
                <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => updateCartQty(item.variantId, -1)}
                    className="w-6 h-6 rounded bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center font-bold shadow-xs"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-bold text-slate-800">{item.qty}</span>
                  <button
                    onClick={() => updateCartQty(item.variantId, 1)}
                    className="w-6 h-6 rounded bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center font-bold shadow-xs"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Line total & delete */}
                <div className="text-right pl-3">
                  <p className="font-bold text-slate-800">
                    Rs. {Number(item.unitPrice * item.qty).toLocaleString()}
                  </p>
                  <button
                    onClick={() => removeCartItem(item.variantId)}
                    className="text-slate-400 hover:text-rose-600 transition-colors mt-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Financial Summary & Checkout */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 space-y-3">
          {/* Discount and tax row */}
          <div className="flex items-center space-x-2">
            <div className="flex-1 flex items-center space-x-1 bg-white p-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-400 px-1 font-semibold">Discount:</span>
              <input
                type="number"
                min="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="0"
                className="w-16 focus:outline-none font-bold text-slate-800 text-right"
              />
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="bg-slate-100 rounded px-1.5 py-0.5 text-[11px] font-bold text-slate-600 focus:outline-none"
              >
                <option value="flat">PKR</option>
                <option value="percent">%</option>
              </select>
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="px-2.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Subtotal and Grand Total */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-700">Rs. {subtotal.toLocaleString()}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount applied:</span>
                <span className="font-semibold">- Rs. {discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
              <span>Grand Total:</span>
              <span className="text-xl text-indigo-600">Rs. {grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Pay & Bill Button */}
          {!activeRegister && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Shift register is not open!</span>
              </div>
              <button
                onClick={() => setShowOpenShiftModal(true)}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px]"
              >
                Open Shift
              </button>
            </div>
          )}

          <button
            disabled={cart.length === 0}
            onClick={() => {
              setTenderedAmount(grandTotal.toString());
              setShowPaymentModal(true);
            }}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
          >
            <Banknote className="w-5 h-5" />
            <span>Pay & Print Bill (Rs. {grandTotal.toLocaleString()})</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: Checkout & Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Complete Payment</h3>
                <p className="text-xs text-slate-500">Select payment channel and enter tendered amount</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {['Cash', 'Card', 'Bank Transfer', 'Easypaisa', 'JazzCash'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`p-2.5 rounded-xl border font-bold text-center transition-all ${
                        paymentMethod === method
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tendered Amount */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase">Cash Tendered (Received)</label>
                  <span className="text-xs text-indigo-600 font-bold">Total: Rs. {grandTotal.toLocaleString()}</span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-slate-400 text-sm">Rs.</span>
                  <input
                    type="number"
                    value={tenderedAmount}
                    onChange={(e) => setTenderedAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Quick Cash Buttons */}
              {paymentMethod === 'Cash' && (
                <div className="flex space-x-2 text-xs">
                  {[grandTotal, 1000, 2000, 5000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTenderedAmount(val.toString())}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                    >
                      Rs. {val.toLocaleString()}
                    </button>
                  ))}
                </div>
              )}

              {/* Change calculation */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Bill Amount:</span>
                  <span className="font-bold text-slate-800">Rs. {grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Amount Tendered:</span>
                  <span className="font-bold text-slate-800">Rs. {tendered.toLocaleString()}</span>
                </div>
                {changeDue > 0 && (
                  <div className="flex justify-between text-sm font-extrabold text-emerald-700 pt-2 border-t border-slate-200">
                    <span>Change Due to Customer:</span>
                    <span className="text-base">Rs. {changeDue.toLocaleString()}</span>
                  </div>
                )}
                {remainingDue > 0 && (
                  <div className="flex justify-between text-sm font-extrabold text-rose-700 pt-2 border-t border-slate-200">
                    <span>Remaining Balance (Due):</span>
                    <span className="text-base">Rs. {remainingDue.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <button
                disabled={processing}
                onClick={handleCompleteSale}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>{processing ? 'Processing...' : 'Confirm Payment & Generate Invoice'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Receipt Preview & Printing Modal */}
      {showReceiptModal && completedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-700">Format:</span>
                <button
                  onClick={() => setReceiptFormat('thermal')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    receiptFormat === 'thermal' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  80mm Thermal
                </button>
                <button
                  onClick={() => setReceiptFormat('a4')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    receiptFormat === 'a4' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  A4 Receipt
                </button>
              </div>

              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Paper Container */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center">
              <div
                id="printable-receipt"
                className={`bg-white p-6 shadow-md border border-slate-200 text-slate-900 font-mono ${
                  receiptFormat === 'thermal' ? 'w-[300px] text-[11px]' : 'w-[380px] text-xs'
                }`}
              >
                {/* Store Header */}
                <div className="text-center pb-3 border-b border-dashed border-slate-300">
                  <h2 className="font-extrabold text-sm uppercase tracking-wider">{storeInfo.storeName || 'HOORIYA ARTS'}</h2>
                  {storeInfo.storeAddress && <p className="text-[10px] text-slate-600">{storeInfo.storeAddress}</p>}
                  {storeInfo.storePhone && <p className="text-[10px] text-slate-600">Ph: {storeInfo.storePhone}</p>}
                </div>

                {/* Bill Meta */}
                <div className="py-2.5 border-b border-dashed border-slate-300 space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>Invoice #:</span>
                    <span className="font-bold">{completedSale.invoiceNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date & Time:</span>
                    <span>{new Date(completedSale.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span>{completedSale.cashierId?.name || user?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span>{completedSale.customerName}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1.5">
                  <div className="flex justify-between font-bold text-[10px] border-b border-slate-200 pb-1">
                    <span>Item / Size</span>
                    <span>Qty x Price = Total</span>
                  </div>
                  {completedSale.items.map((item, i) => (
                    <div key={i} className="text-[10px] leading-tight">
                      <div className="font-semibold">{item.productName}</div>
                      <div className="flex justify-between text-slate-600">
                        <span>{item.sizeName} | {item.colorName}</span>
                        <span>{item.qty} x {item.unitPrice} = Rs. {item.total}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rs. {completedSale.subtotal}</span>
                  </div>
                  {completedSale.discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span>- Rs. {completedSale.discountTotal}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-sm border-t border-slate-300 pt-1">
                    <span>Grand Total:</span>
                    <span>Rs. {completedSale.grandTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid ({completedSale.paymentMethod}):</span>
                    <span>Rs. {completedSale.paidAmount}</span>
                  </div>
                  {completedSale.changeAmount > 0 && (
                    <div className="flex justify-between font-bold">
                      <span>Change Tendered:</span>
                      <span>Rs. {completedSale.changeAmount}</span>
                    </div>
                  )}
                  {completedSale.dueAmount > 0 && (
                    <div className="flex justify-between font-bold text-rose-600">
                      <span>Balance Due:</span>
                      <span>Rs. {completedSale.dueAmount}</span>
                    </div>
                  )}
                </div>

                {/* Footer notes */}
                <div className="pt-3 text-center text-[9px] text-slate-500 space-y-1">
                  <p>{storeInfo.receiptFooterNote || 'Exchange allowed within 7 days with original sales bill & tags intact.'}</p>
                  <p className="font-bold">*** THANK YOU FOR VISITING ***</p>
                </div>
              </div>
            </div>

            {/* Print action buttons */}
            <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Open Register Shift */}
      {showOpenShiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-slate-800 text-base mb-1">Open Register Shift</h3>
            <p className="text-xs text-slate-500 mb-4">Enter starting drawer cash for cashier shift</p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Opening Cash (PKR)</label>
              <input
                type="number"
                value={openingCashInput}
                onChange={(e) => setOpeningCashInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleOpenShift}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Open Register
              </button>
              <button
                onClick={() => setShowOpenShiftModal(false)}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Quick New Customer Inline */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-slate-800 text-base mb-1">New Customer Registration</h3>
            <p className="text-xs text-slate-500 mb-4">Add customer contact for receipts and ledger</p>
            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  placeholder="e.g. Asad Ali"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  placeholder="03001234567"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Address / City</label>
                <input
                  type="text"
                  value={newCustomerForm.address}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                  placeholder="Karachi"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Save Customer
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl"
                >
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
