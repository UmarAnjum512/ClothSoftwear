import { ProductVariant } from '../models/ProductVariant.js';
import { StockMovement } from '../models/StockMovement.js';
import { StockAdjustment } from '../models/StockAdjustment.js';
import { logAudit } from '../utils/auditLogger.js';

export const getInventoryList = async (req, res) => {
  try {
    const { filterStatus, search } = req.query; // all, lowStock, outOfStock
    const variants = await ProductVariant.find({ status: 'active' })
      .populate('productId', 'name code categoryId brandId images')
      .populate('sizeId', 'name type')
      .populate('colorId', 'name hexCode')
      .sort({ stockQuantity: 1 });

    let results = variants.map(v => {
      const vObj = v.toObject();
      vObj.isLowStock = v.stockQuantity <= v.reorderLevel && v.stockQuantity > 0;
      vObj.isOutOfStock = v.stockQuantity <= 0;
      return vObj;
    });

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(v =>
        v.productId?.name?.toLowerCase().includes(q) ||
        v.sku.toLowerCase().includes(q) ||
        v.barcode.includes(q)
      );
    }

    if (filterStatus === 'lowStock') {
      results = results.filter(v => v.isLowStock);
    } else if (filterStatus === 'outOfStock') {
      results = results.filter(v => v.isOutOfStock);
    }

    res.json({
      success: true,
      count: results.length,
      inventory: results
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const adjustStockManually = async (req, res) => {
  try {
    const { variantId, adjustmentType, quantity, reason, notes = '' } = req.body;
    const variant = await ProductVariant.findById(variantId).populate('productId');
    if (!variant) {
      return res.status(404).json({ success: false, message: 'Product variant not found' });
    }

    const previousQty = variant.stockQuantity;
    const qtyNum = Number(quantity);
    let newQty = previousQty;
    let qtyChange = 0;

    if (adjustmentType === 'Addition') {
      newQty = previousQty + qtyNum;
      qtyChange = qtyNum;
    } else if (adjustmentType === 'Deduction') {
      if (previousQty < qtyNum) {
        return res.status(400).json({ success: false, message: `Cannot deduct ${qtyNum} units. Current stock is only ${previousQty}` });
      }
      newQty = previousQty - qtyNum;
      qtyChange = -qtyNum;
    } else if (adjustmentType === 'Set Exact') {
      newQty = qtyNum;
      qtyChange = newQty - previousQty;
    }

    variant.stockQuantity = newQty;
    await variant.save();

    // Create StockAdjustment record
    const adjustment = await StockAdjustment.create({
      variantId: variant._id,
      adjustmentType,
      previousQty,
      adjustedQty: qtyNum,
      newQty,
      reason,
      notes,
      userId: req.user._id
    });

    // Create StockMovement record
    await StockMovement.create({
      variantId: variant._id,
      sku: variant.sku,
      productName: variant.productId?.name || 'Product',
      type: qtyChange >= 0 ? 'Stock Adjustment +' : 'Stock Adjustment -',
      qtyChange,
      previousStock: previousQty,
      newStock: newQty,
      referenceType: 'Manual Adjustment',
      referenceId: adjustment._id.toString(),
      notes: `${reason}: ${notes}`,
      userId: req.user._id,
      userName: req.user.name
    });

    await logAudit({
      req,
      action: 'STOCK_ADJUSTMENT',
      entity: 'ProductVariant',
      entityId: variant._id.toString(),
      details: { sku: variant.sku, adjustmentType, previousQty, newQty, reason }
    });

    res.json({
      success: true,
      message: 'Stock adjusted successfully',
      variant,
      adjustment
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getStockMovements = async (req, res) => {
  try {
    const { variantId, type, limit = 100 } = req.query;
    const filter = {};
    if (variantId) filter.variantId = variantId;
    if (type) filter.type = type;

    const movements = await StockMovement.find(filter)
      .populate('variantId')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, count: movements.length, movements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
