import { Product } from '../models/Product.js';
import { ProductVariant } from '../models/ProductVariant.js';
import { StockMovement } from '../models/StockMovement.js';
import { logAudit } from '../utils/auditLogger.js';
import { getCloudinary } from '../config/cloudinary.js';

// Get all products with their variants
export const getProducts = async (req, res) => {
  try {
    const { search, category, brand, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    else filter.status = 'active';

    if (category) filter.categoryId = category;
    if (brand) filter.brandId = brand;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .populate('brandId', 'name')
      .sort({ createdAt: -1 });

    // Fetch variants for each product
    const productIds = products.map(p => p._id);
    const variants = await ProductVariant.find({ productId: { $in: productIds } })
      .populate('sizeId', 'name type')
      .populate('colorId', 'name hexCode');

    // Group variants by productId
    const variantsMap = {};
    variants.forEach(v => {
      const pId = v.productId.toString();
      if (!variantsMap[pId]) variantsMap[pId] = [];
      variantsMap[pId].push(v);
    });

    const populatedProducts = products.map(p => {
      const pObj = p.toObject();
      pObj.variants = variantsMap[p._id.toString()] || [];
      return pObj;
    });

    res.json({ success: true, count: populatedProducts.length, products: populatedProducts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get single product
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categoryId', 'name')
      .populate('brandId', 'name');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const variants = await ProductVariant.find({ productId: product._id })
      .populate('sizeId', 'name type')
      .populate('colorId', 'name hexCode');

    const productObj = product.toObject();
    productObj.variants = variants;

    res.json({ success: true, product: productObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create product and its initial variants
export const createProduct = async (req, res) => {
  try {
    const { name, code, categoryId, brandId, description, images, variants = [] } = req.body;

    const product = await Product.create({
      name,
      code: code || `PRD-${Date.now().toString().slice(-6)}`,
      categoryId,
      brandId: brandId || null,
      description,
      images: images || []
    });

    const createdVariants = [];
    for (const v of variants) {
      const sku = v.sku || `${product.name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`;
      const barcode = v.barcode || Date.now().toString().slice(-8) + Math.floor(1000 + Math.random() * 9000);
      const initialStock = Number(v.stockQuantity) || 0;

      const variant = await ProductVariant.create({
        productId: product._id,
        sku,
        barcode,
        sizeId: v.sizeId,
        colorId: v.colorId,
        costPrice: Number(v.costPrice) || 0,
        salePrice: Number(v.salePrice) || 0,
        stockQuantity: initialStock,
        reorderLevel: Number(v.reorderLevel) || 5
      });

      if (initialStock > 0) {
        await StockMovement.create({
          variantId: variant._id,
          sku: variant.sku,
          productName: product.name,
          type: 'Stock Adjustment +',
          qtyChange: initialStock,
          previousStock: 0,
          newStock: initialStock,
          referenceType: 'Manual Adjustment',
          notes: 'Initial Product Stock Setup',
          userId: req.user._id,
          userName: req.user.name
        });
      }

      createdVariants.push(variant);
    }

    await logAudit({
      req,
      action: 'CREATE_PRODUCT',
      entity: 'Product',
      entityId: product._id.toString(),
      details: { name: product.name, variantsCount: createdVariants.length }
    });

    res.status(201).json({
      success: true,
      product: { ...product.toObject(), variants: createdVariants }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { name, code, categoryId, brandId, description, images, status } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, code, categoryId, brandId, description, images, status },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await logAudit({
      req,
      action: 'UPDATE_PRODUCT',
      entity: 'Product',
      entityId: product._id.toString(),
      details: { name: product.name }
    });

    res.json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Archive product
export const archiveProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.status = product.status === 'active' ? 'archived' : 'active';
    await product.save();

    await ProductVariant.updateMany(
      { productId: product._id },
      { status: product.status }
    );

    await logAudit({
      req,
      action: product.status === 'archived' ? 'ARCHIVE_PRODUCT' : 'RESTORE_PRODUCT',
      entity: 'Product',
      entityId: product._id.toString(),
      details: { status: product.status }
    });

    res.json({ success: true, message: `Product ${product.status}`, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create new variant for existing product
export const addVariant = async (req, res) => {
  try {
    const { productId, sku, barcode, sizeId, colorId, costPrice, salePrice, stockQuantity, reorderLevel } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const initialStock = Number(stockQuantity) || 0;
    const variant = await ProductVariant.create({
      productId,
      sku: sku || `${product.name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      barcode: barcode || Date.now().toString().slice(-8) + Math.floor(1000 + Math.random() * 9000),
      sizeId,
      colorId,
      costPrice: Number(costPrice) || 0,
      salePrice: Number(salePrice) || 0,
      stockQuantity: initialStock,
      reorderLevel: Number(reorderLevel) || 5
    });

    if (initialStock > 0) {
      await StockMovement.create({
        variantId: variant._id,
        sku: variant.sku,
        productName: product.name,
        type: 'Stock Adjustment +',
        qtyChange: initialStock,
        previousStock: 0,
        newStock: initialStock,
        referenceType: 'Manual Adjustment',
        notes: 'Variant Created Stock Entry',
        userId: req.user._id,
        userName: req.user.name
      });
    }

    res.status(201).json({ success: true, variant });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Update variant
export const updateVariant = async (req, res) => {
  try {
    const { sku, barcode, sizeId, colorId, costPrice, salePrice, reorderLevel, status } = req.body;
    const variant = await ProductVariant.findByIdAndUpdate(
      req.params.id,
      { sku, barcode, sizeId, colorId, costPrice, salePrice, reorderLevel, status },
      { new: true }
    ).populate('sizeId colorId');

    if (!variant) {
      return res.status(404).json({ success: false, message: 'Variant not found' });
    }

    res.json({ success: true, variant });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Scan or search variant (FOR POS CHECKOUT)
export const searchVariantByCodeOrSku = async (req, res) => {
  try {
    const { query } = req.params;
    const cleanQuery = query.trim();

    // 1. Direct match on barcode or SKU
    let variant = await ProductVariant.findOne({
      status: 'active',
      $or: [{ barcode: cleanQuery }, { sku: cleanQuery.toUpperCase() }]
    }).populate('productId').populate('sizeId').populate('colorId');

    if (variant) {
      return res.json({ success: true, matches: [variant] });
    }

    // 2. Partial search across product name, variant barcode, SKU
    const matchedProducts = await Product.find({
      status: 'active',
      name: { $regex: cleanQuery, $options: 'i' }
    });

    const productIds = matchedProducts.map(p => p._id);
    const variants = await ProductVariant.find({
      status: 'active',
      $or: [
        { productId: { $in: productIds } },
        { barcode: { $regex: cleanQuery, $options: 'i' } },
        { sku: { $regex: cleanQuery, $options: 'i' } }
      ]
    }).populate('productId').populate('sizeId').populate('colorId').limit(25);

    res.json({ success: true, matches: variants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/products/upload-image  — uploads a single image to Cloudinary, returns its URL
export const uploadProductImageHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file received' });
    }

    const cloudinary = getCloudinary();

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'hooriya-arts/products',
          resource_type: 'image'
        },
        (error, uploaded) => (error ? reject(error) : resolve(uploaded))
      );
      stream.end(req.file.buffer);
    });

    res.json({ success: true, imageUrl: result.secure_url, publicId: result.public_id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

