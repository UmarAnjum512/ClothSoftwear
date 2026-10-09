import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Search,
  Shirt,
  Barcode,
  Layers,
  Archive,
  Printer,
  X,
  CheckCircle,
  Tag
} from 'lucide-react';

export default function Products() {
  const { hasRole } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBarcodeLabelModal, setShowBarcodeLabelModal] = useState(false);
  const [selectedVariantForLabel, setSelectedVariantForLabel] = useState(null);

  // New product form
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    categoryId: '',
    brandId: '',
    description: '',
    imagePreview: '',  // base64 preview or uploaded URL
    imageFile: null,   // actual File object
    variants: [
      { sizeId: '', colorId: '', costPrice: '', salePrice: '', stockQuantity: 10, reorderLevel: 5 }
    ]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, cRes, bRes, sRes, colRes] = await Promise.all([
        api.get('/products'),
        api.get('/master/categories'),
        api.get('/master/brands'),
        api.get('/master/sizes'),
        api.get('/master/colors')
      ]);

      if (pRes.data.success) setProducts(pRes.data.products);
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

  const addVariantRow = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        { sizeId: '', colorId: '', costPrice: '', salePrice: '', stockQuantity: 10, reorderLevel: 5 }
      ]
    }));
  };

  const removeVariantRow = (index) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const updateVariantRow = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v, i) => i === index ? { ...v, [field]: value } : v)
    }));
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = '';

      // Upload the image file first if one was selected
      if (formData.imageFile) {
        const uploadData = new FormData();
        uploadData.append('image', formData.imageFile);
        const uploadRes = await api.post('/products/upload-image', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (uploadRes.data.success) {
          imageUrl = uploadRes.data.imageUrl;
        }
      }

      const { imagePreview, imageFile, ...rest } = formData;
      const payload = { ...rest, images: imageUrl ? [imageUrl] : [] };
      const res = await api.post('/products', payload);
      if (res.data.success) {
        alert('Product with variants added successfully!');
        setShowAddModal(false);
        setFormData({
          name: '',
          code: '',
          categoryId: '',
          brandId: '',
          description: '',
          imagePreview: '',
          imageFile: null,
          variants: [
            { sizeId: '', colorId: '', costPrice: '', salePrice: '', stockQuantity: 10, reorderLevel: 5 }
          ]
        });
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating product');
    }
  };

  const handleArchiveProduct = async (id) => {
    if (window.confirm('Are you sure you want to archive this product?')) {
      try {
        await api.patch(`/products/${id}/archive`);
        fetchData();
      } catch (err) {
        alert('Error updating status');
      }
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Apparel Catalog & Variants</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage multi-variant garments (Sizes, Colors, SKUs, Barcodes, Selling Prices)
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search product or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {hasRole('Super Admin', 'Manager', 'Store Keeper') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center space-x-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Product List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading catalog...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
            <Shirt className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-700 text-sm">No products found</p>
          </div>
        ) : (
          filtered.map(product => (
            <div
              key={product._id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden"
            >
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50/50">
                <div className="flex items-center space-x-3.5">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <Shirt className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{product.name}</h3>
                    <p className="text-xs text-slate-500">
                      Code: <span className="font-mono">{product.code}</span> • Category: <strong>{product.categoryId?.name}</strong> • Brand: <strong>{product.brandId?.name || 'N/A'}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                    {product.variants?.length || 0} Sellable Variants
                  </span>
                  {hasRole('Super Admin', 'Manager') && (
                    <button
                      onClick={() => handleArchiveProduct(product._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Archive Product"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Variants Nested Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-white border-b border-slate-100 text-slate-400 font-semibold uppercase">
                      <th className="py-2.5 px-4">Size</th>
                      <th className="py-2.5 px-4">Color</th>
                      <th className="py-2.5 px-4">SKU</th>
                      <th className="py-2.5 px-4">Barcode</th>
                      <th className="py-2.5 px-4 text-right">Cost</th>
                      <th className="py-2.5 px-4 text-right">Retail Sale</th>
                      <th className="py-2.5 px-4 text-center">Stock</th>
                      <th className="py-2.5 px-4 text-center">Barcode Tag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {product.variants?.map(v => (
                      <tr key={v._id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 font-bold text-slate-800">{v.sizeId?.name}</td>
                        <td className="py-2.5 px-4 text-slate-600">
                          <span className="inline-flex items-center space-x-1.5">
                            <span className="w-2.5 h-2.5 rounded-full border border-slate-300" style={{ backgroundColor: v.colorId?.hexCode || '#ccc' }}></span>
                            <span>{v.colorId?.name}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-indigo-600">{v.sku}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-500">{v.barcode}</td>
                        <td className="py-2.5 px-4 text-right text-slate-500">Rs. {v.costPrice}</td>
                        <td className="py-2.5 px-4 text-right font-extrabold text-slate-800">Rs. {v.salePrice}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] ${
                            v.stockQuantity <= 0
                              ? 'bg-rose-50 text-rose-700'
                              : v.stockQuantity <= v.reorderLevel
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {v.stockQuantity} pcs
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedVariantForLabel({ ...v, productName: product.name });
                              setShowBarcodeLabelModal(true);
                            }}
                            title="Generate / Print Barcode Tag"
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50"
                          >
                            <Barcode className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL 1: Add New Clothing Product with Variants */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Create Clothing Product & Variants</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="py-4 space-y-4 text-xs">
              {/* Product Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 uppercase mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wash & Wear Kurta Shalwar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 uppercase mb-1">Product Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="Auto generated if empty"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 uppercase mb-1">Category</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 uppercase mb-1">Brand</label>
                  <select
                    value={formData.brandId}
                    onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="">-- Select Brand (Optional) --</option>
                    {brands.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Garment Photo</label>
                <div className="flex items-center gap-3">
                  {/* Preview */}
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                    {formData.imagePreview ? (
                      <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <span className="text-2xl">👕</span>
                    )}
                  </div>
                  {/* File input */}
                  <div className="flex-1">
                    <label
                      htmlFor="garment-image-upload"
                      className="flex items-center gap-2 cursor-pointer px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-indigo-700 font-semibold text-xs transition-colors w-fit"
                    >
                      📂 Choose Photo
                    </label>
                    <input
                      id="garment-image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        setFormData(prev => ({
                          ...prev,
                          imageFile: file,
                          imagePreview: URL.createObjectURL(file)
                        }));
                      }}
                    />
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      {formData.imageFile ? `✅ ${formData.imageFile.name}` : 'JPG, PNG, WEBP — max 5 MB'}
                    </p>
                    {formData.imageFile && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, imageFile: null, imagePreview: '' }))}
                        className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold mt-0.5"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Fabric specs, collar cut, wash care..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Variants Builder */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-slate-800 uppercase">Sellable Variants (Size & Color combinations)</h4>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg text-[11px] flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variant</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.variants.map((v, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-6 gap-2 items-center">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-semibold">Size</label>
                        <select
                          required
                          value={v.sizeId}
                          onChange={(e) => updateVariantRow(idx, 'sizeId', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="">Size</option>
                          {sizes.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-semibold">Color</label>
                        <select
                          required
                          value={v.colorId}
                          onChange={(e) => updateVariantRow(idx, 'colorId', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="">Color</option>
                          {colors.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-semibold">Cost (Rs)</label>
                        <input
                          type="number"
                          required
                          placeholder="2000"
                          value={v.costPrice}
                          onChange={(e) => updateVariantRow(idx, 'costPrice', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-semibold">Retail Sale (Rs)</label>
                        <input
                          type="number"
                          required
                          placeholder="3500"
                          value={v.salePrice}
                          onChange={(e) => updateVariantRow(idx, 'salePrice', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-semibold">Initial Stock</label>
                        <input
                          type="number"
                          required
                          value={v.stockQuantity}
                          onChange={(e) => updateVariantRow(idx, 'stockQuantity', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div className="flex justify-end pt-3">
                        {formData.variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariantRow(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Save Product & Generate SKUs
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Barcode Sticker Label Printing Preview */}
      {showBarcodeLabelModal && selectedVariantForLabel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">Retail Price Tag & Barcode</h3>
              <button onClick={() => setShowBarcodeLabelModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sticker Graphic */}
            <div className="my-6 p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center text-center">
              <span className="text-[10px] font-extrabold tracking-widest uppercase text-slate-500">HOORIYA ARTS</span>
              <p className="font-bold text-slate-800 text-xs mt-0.5">{selectedVariantForLabel.productName}</p>
              <p className="text-[11px] text-slate-500">
                Size: <strong className="text-slate-800">{selectedVariantForLabel.sizeId?.name}</strong> • {selectedVariantForLabel.colorId?.name}
              </p>

              {/* Barcode Lines Visual */}
              <div className="my-2 bg-white px-4 py-2 border border-slate-200 rounded">
                <div className="h-9 w-40 flex items-center justify-between tracking-widest text-[9px] font-mono select-none">
                  ||||| | |||| |||| ||||| || |||
                </div>
                <div className="text-[10px] font-mono font-bold text-slate-700 tracking-wider">
                  {selectedVariantForLabel.barcode}
                </div>
              </div>

              <div className="mt-1 font-mono text-[10px] text-slate-400">
                SKU: {selectedVariantForLabel.sku}
              </div>
              <div className="text-sm font-extrabold text-slate-900 mt-1">
                MRP: Rs. {Number(selectedVariantForLabel.salePrice).toLocaleString()}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Barcode Label</span>
              </button>
              <button
                onClick={() => setShowBarcodeLabelModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
