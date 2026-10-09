import { Purchase } from '../models/Purchase.js';
import { PurchaseReturn } from '../models/PurchaseReturn.js';
import { Supplier } from '../models/Supplier.js';
import { adjustVariantStock } from '../services/inventoryService.js';
import { logAudit } from '../utils/auditLogger.js';

export const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate('supplierId', 'name phone')
      .populate('items.variantId')
      .populate('createdBy', 'name')
      .sort({ purchaseDate: -1 });

    res.json({ success: true, count: purchases.length, purchases });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplierId')
      .populate({
        path: 'items.variantId',
        populate: [{ path: 'productId', select: 'name' }, { path: 'sizeId' }, { path: 'colorId' }]
      })
      .populate('createdBy', 'name');

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    res.json({ success: true, purchase });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createPurchase = async (req, res) => {
  try {
    const {
      supplierId,
      invoiceNo,
      purchaseDate,
      items,
      discount = 0,
      tax = 0,
      paidAmount = 0,
      paymentMethod = 'Cash',
      notes = ''
    } = req.body;

    if (!supplierId || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Supplier and items are required' });
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    let subtotal = 0;
    const processedItems = items.map(item => {
      const lineTotal = Number(item.qty) * Number(item.unitCost);
      subtotal += lineTotal;
      return {
        variantId: item.variantId,
        qty: Number(item.qty),
        unitCost: Number(item.unitCost),
        total: lineTotal
      };
    });

    const totalAmount = subtotal - Number(discount) + Number(tax);
    const paid = Number(paidAmount);
    const dueAmount = Math.max(0, totalAmount - paid);

    const generatedInv = invoiceNo || `PUR-${Date.now().toString().slice(-6)}`;

    const purchase = await Purchase.create({
      supplierId,
      invoiceNo: generatedInv,
      purchaseDate: purchaseDate || new Date(),
      items: processedItems,
      subtotal,
      discount: Number(discount),
      tax: Number(tax),
      totalAmount,
      paidAmount: paid,
      dueAmount,
      paymentMethod,
      status: 'Received',
      notes,
      createdBy: req.user._id
    });

    // Automatically increase inventory for all variants
    for (const item of processedItems) {
      await adjustVariantStock({
        variantId: item.variantId,
        qtyChange: item.qty,
        type: 'Purchase Received',
        referenceType: 'Purchase',
        referenceId: purchase.invoiceNo,
        notes: `Purchase invoice: ${purchase.invoiceNo}`,
        userId: req.user._id,
        userName: req.user.name
      });
    }

    // Update supplier current balance if there is due amount
    if (dueAmount > 0) {
      supplier.currentBalance += dueAmount;
      await supplier.save();
    }

    await logAudit({
      req,
      action: 'CREATE_PURCHASE',
      entity: 'Purchase',
      entityId: purchase._id.toString(),
      details: { invoiceNo: purchase.invoiceNo, totalAmount, dueAmount }
    });

    res.status(201).json({ success: true, purchase });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const createPurchaseReturn = async (req, res) => {
  try {
    const { purchaseId, supplierId, items, reason } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items to return are required' });
    }

    let totalAmount = 0;
    for (const item of items) {
      totalAmount += Number(item.qty) * Number(item.unitCost);
    }

    const purchaseReturn = await PurchaseReturn.create({
      purchaseId: purchaseId || null,
      supplierId,
      items,
      totalAmount,
      reason: reason || 'Defective / Excess Stock',
      createdBy: req.user._id
    });

    // Decrease inventory for each returned variant
    for (const item of items) {
      await adjustVariantStock({
        variantId: item.variantId,
        qtyChange: -Math.abs(Number(item.qty)),
        type: 'Purchase Return',
        referenceType: 'Purchase Return',
        referenceId: purchaseReturn._id.toString(),
        notes: `Purchase return to supplier. Reason: ${reason}`,
        userId: req.user._id,
        userName: req.user.name
      });
    }

    // Adjust supplier balance
    const supplier = await Supplier.findById(supplierId);
    if (supplier) {
      supplier.currentBalance -= totalAmount;
      await supplier.save();
    }

    await logAudit({
      req,
      action: 'PURCHASE_RETURN',
      entity: 'PurchaseReturn',
      entityId: purchaseReturn._id.toString(),
      details: { supplierId, totalAmount, reason }
    });

    res.status(201).json({ success: true, purchaseReturn });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
