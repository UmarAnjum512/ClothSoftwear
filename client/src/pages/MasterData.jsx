import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Sliders, Plus, Trash2, Edit2, X, CheckCircle, Tag, Palette } from 'lucide-react';

export default function MasterData() {
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('categories'); // 'categories', 'brands', 'sizes', 'colors'

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryCode, setCategoryCode] = useState('');

  const [brandName, setBrandName] = useState('');
  const [sizeName, setSizeName] = useState('');
  const [sizeType, setSizeType] = useState('Alpha');
  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#1E3A8A');

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      setLoading(true);
      const [cRes, bRes, sRes, colRes] = await Promise.all([
        api.get('/master/categories'),
        api.get('/master/brands'),
        api.get('/master/sizes'),
        api.get('/master/colors')
      ]);
      if (cRes.data.success) setCategories(cRes.data.categories);
      if (bRes.data.success) setBrands(bRes.data.brands);
      if (sRes.data.success) setSizes(sRes.data.sizes);
      if (colRes.data.success) setColors(colRes.data.colors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/master/categories', { name: categoryName, code: categoryCode });
      setShowAddModal(false);
      setCategoryName('');
      setCategoryCode('');
      fetchMasterData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    try {
      await api.post('/master/brands', { name: brandName });
      setShowAddModal(false);
      setBrandName('');
      fetchMasterData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleAddSize = async (e) => {
    e.preventDefault();
    try {
      await api.post('/master/sizes', { name: sizeName, type: sizeType });
      setShowAddModal(false);
      setSizeName('');
      fetchMasterData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleAddColor = async (e) => {
    e.preventDefault();
    try {
      await api.post('/master/colors', { name: colorName, hexCode: colorHex });
      setShowAddModal(false);
      setColorName('');
      fetchMasterData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Master Data Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage Categories, Brands, Sizes and Color palettes</p>
        </div>

        {hasRole('Super Admin', 'Manager', 'Store Keeper') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New {activeTab === 'categories' ? 'Category' : activeTab === 'brands' ? 'Brand' : activeTab === 'sizes' ? 'Size' : 'Color'}</span>
          </button>
        )}
      </div>

      {/* TABS */}
      <div className="flex bg-white p-1 rounded-2xl border border-slate-200/90 shadow-xs max-w-md text-xs font-bold">
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 py-2 rounded-xl transition-colors ${activeTab === 'categories' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('brands')}
          className={`flex-1 py-2 rounded-xl transition-colors ${activeTab === 'brands' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Brands ({brands.length})
        </button>
        <button
          onClick={() => setActiveTab('sizes')}
          className={`flex-1 py-2 rounded-xl transition-colors ${activeTab === 'sizes' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Sizes ({sizes.length})
        </button>
        <button
          onClick={() => setActiveTab('colors')}
          className={`flex-1 py-2 rounded-xl transition-colors ${activeTab === 'colors' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Colors ({colors.length})
        </button>
      </div>

      {/* CONTENT LIST */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map(c => (
              <div key={c._id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-800">{c.name}</span>
                  {c.code && <p className="text-[10px] text-slate-400 font-mono">Code: {c.code}</p>}
                </div>
                <Tag className="w-4 h-4 text-indigo-400" />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'brands' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {brands.map(b => (
              <div key={b._id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-800">{b.name}</span>
                  {b.description && <p className="text-[10px] text-slate-400">{b.description}</p>}
                </div>
                <Tag className="w-4 h-4 text-indigo-400" />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'sizes' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {sizes.map(s => (
              <div key={s._id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-center text-xs">
                <span className="text-base font-extrabold text-indigo-600 block">{s.name}</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">{s.type}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'colors' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {colors.map(col => (
              <div key={col._id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center space-x-3 text-xs">
                <span className="w-6 h-6 rounded-lg border border-slate-300 shadow-xs" style={{ backgroundColor: col.hexCode }}></span>
                <div>
                  <span className="font-bold text-slate-800 block">{col.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{col.hexCode}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QUICK ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">
                Add New {activeTab === 'categories' ? 'Category' : activeTab === 'brands' ? 'Brand' : activeTab === 'sizes' ? 'Size' : 'Color'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeTab === 'categories' && (
              <form onSubmit={handleAddCategory} className="py-4 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 uppercase mb-1">Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shalwar Kameez"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 uppercase mb-1">Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SK-MEN"
                    value={categoryCode}
                    onChange={(e) => setCategoryCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl">Save</button>
              </form>
            )}

            {activeTab === 'brands' && (
              <form onSubmit={handleAddBrand} className="py-4 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 uppercase mb-1">Brand Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bonanza Satrangi"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl">Save</button>
              </form>
            )}

            {activeTab === 'sizes' && (
              <form onSubmit={handleAddSize} className="py-4 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 uppercase mb-1">Size (e.g. 38 or XXXL)</label>
                  <input
                    type="text"
                    required
                    value={sizeName}
                    onChange={(e) => setSizeName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 uppercase mb-1">Size Classification</label>
                  <select
                    value={sizeType}
                    onChange={(e) => setSizeType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Alpha">Alpha (S, M, L, XL)</option>
                    <option value="Numeric">Numeric (30, 32, 34)</option>
                    <option value="Free Size">Free Size</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl">Save</button>
              </form>
            )}

            {activeTab === 'colors' && (
              <form onSubmit={handleAddColor} className="py-4 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 uppercase mb-1">Color Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Emerald Green"
                    value={colorName}
                    onChange={(e) => setColorName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 uppercase mb-1">Hex Color Code</label>
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="w-full h-10 p-1 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl">Save</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
