import { Sale } from '../models/Sale.js';
import { Customer } from '../models/Customer.js';
import { ProductVariant } from '../models/ProductVariant.js';
import { CashRegister } from '../models/CashRegister.js';
import { adjustVariantStock } from '../services/inventoryService.js';
import { logAudit } from '../utils/auditLogger.js';
import { startOfDayKey, endOfDayKey } from '../utils/timezone.js';

// Complete POS Checkout Sale
export const createSale = async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      items,
      discountTotal = 0,
      taxRate = 0,
      taxTotal = 0,
      paidAmount = 0,
      paymentMethod = 'Cash',
      payments = [],
      notes = ''
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items are required' });
    }

    // 1. Validate variants and stock availability
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const variant = await ProductVariant.findById(item.variantId)
        .populate('productId')
        .populate('sizeId')
        .populate('colorId');

      if (!variant) {
        return res.status(404).json({ success: false, message: `Product variant not found: ${item.variantId}` });
      }

      const qty = Number(item.qty);
      if (qty <= 0) {
        return res.status(400).json({ success: false, message: `Invalid quantity for SKU ${variant.sku}` });
      }

      if (variant.stockQuantity < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${variant.productId?.name} (${variant.sizeId?.name} / ${variant.colorId?.name}). In stock: ${variant.stockQuantity}, In cart: ${qty}`
        });
      }

      const unitPrice = Number(item.unitPrice) || variant.salePrice;
      const itemDiscount = Number(item.discount) || 0;
      const lineTotal = (unitPrice * qty) - itemDiscount;
      subtotal += lineTotal;

      const itemImg = item.image || (variant.productId?.images && variant.productId.images.length > 0 ? variant.productId.images[0] : '');
      processedItems.push({
        variantId: variant._id,
        productName: variant.productId?.name || 'Clothing Item',
        image: itemImg,
        sizeName: variant.sizeId?.name || '',
        colorName: variant.colorId?.name || '',
        sku: variant.sku,
        barcode: variant.barcode,
        qty,
        unitPrice,
        costPrice: variant.costPrice || 0,
        discount: itemDiscount,
        total: lineTotal
      });
    }

    // Calculate totals
    const grandTotal = Math.max(0, subtotal - Number(discountTotal) + Number(taxTotal));
    const paid = Number(paidAmount);
    const dueAmount = Math.max(0, grandTotal - paid);
    const changeAmount = Math.max(0, paid - grandTotal);

    // Active register shift
    const activeRegister = await CashRegister.findOne({
      userId: req.user._id,
      status: 'Open'
    });

    // Generate unique invoice number
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNo = `INV-${todayStr}-${randomSuffix}`;

    // Create Sale record
    const sale = await Sale.create({
      invoiceNo,
      customerId: customerId || null,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '',
      cashierId: req.user._id,
      registerId: activeRegister ? activeRegister._id : null,
      items: processedItems,
      subtotal,
      discountTotal: Number(discountTotal),
      taxRate: Number(taxRate),
      taxTotal: Number(taxTotal),
      grandTotal,
      paidAmount: paid > grandTotal ? grandTotal : paid,
      dueAmount,
      changeAmount,
      paymentMethod,
      payments: payments.length > 0 ? payments : [{ method: paymentMethod === 'Split' ? 'Cash' : paymentMethod, amount: paid }],
      status: 'Completed',
      notes
    });

    // 2. Decrement stock atomically and record StockMovement
    for (const item of processedItems) {
      await adjustVariantStock({
        variantId: item.variantId,
        qtyChange: -item.qty,
        type: 'Sale',
        referenceType: 'Sale',
        referenceId: sale.invoiceNo,
        notes: `POS Sale: ${sale.invoiceNo}`,
        userId: req.user._id,
        userName: req.user.name
      });
    }

    // 3. Update customer balance if registered and has due amount
    if (customerId && dueAmount > 0) {
      const customer = await Customer.findById(customerId);
      if (customer) {
        customer.currentBalance += dueAmount;
        await customer.save();
      }
    }

    await logAudit({
      req,
      action: 'POS_SALE_COMPLETED',
      entity: 'Sale',
      entityId: sale._id.toString(),
      details: { invoiceNo: sale.invoiceNo, grandTotal, paidAmount: sale.paidAmount, dueAmount }
    });

    res.status(201).json({
      success: true,
      sale: await Sale.findById(sale._id).populate('cashierId', 'name email').populate('customerId')
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// List sales with pagination and filters
export const getSales = async (req, res) => {
  try {
    const { startDate, endDate, customerId, cashierId, status, invoiceNo, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (invoiceNo) {
      filter.invoiceNo = { $regex: invoiceNo, $options: 'i' };
    }
    if (customerId) filter.customerId = customerId;
    if (cashierId) filter.cashierId = cashierId;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startOfDayKey(startDate);
      if (endDate) filter.createdAt.$lte = endOfDayKey(endDate);
    }

    const total = await Sale.countDocuments(filter);
    const sales = await Sale.find(filter)
      .populate('cashierId', 'name')
      .populate('customerId', 'name phone')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      sales
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get single sale by ID or InvoiceNo
export const getSaleById = async (req, res) => {
  try {
    const query = req.params.id;
    let sale = null;

    if (query.startsWith('INV-')) {
      sale = await Sale.findOne({ invoiceNo: query })
        .populate('cashierId', 'name email')
        .populate('customerId');
    } else {
      sale = await Sale.findById(query)
        .populate('cashierId', 'name email')
        .populate('customerId');
    }

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    res.json({ success: true, sale });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Void Sale (Restores inventory, logs audit)
export const voidSale = async (req, res) => {
  try {
    const { reason = 'Transaction Cancelled' } = req.body;
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    if (sale.status === 'Void') {
      return res.status(400).json({ success: false, message: 'Sale is already void' });
    }

    // Restore stock for all items
    for (const item of sale.items) {
      await adjustVariantStock({
        variantId: item.variantId,
        qtyChange: item.qty,
        type: 'Stock Adjustment +',
        referenceType: 'Sale',
        referenceId: sale.invoiceNo,
        notes: `Restored stock from Voided Sale ${sale.invoiceNo}. Reason: ${reason}`,
        userId: req.user._id,
        userName: req.user.name
      });
    }

    // Revert customer balance if credit was used
    if (sale.customerId && sale.dueAmount > 0) {
      const customer = await Customer.findById(sale.customerId);
      if (customer) {
        customer.currentBalance = Math.max(0, customer.currentBalance - sale.dueAmount);
        await customer.save();
      }
    }

    sale.status = 'Void';
    sale.notes = `${sale.notes ? sale.notes + ' | ' : ''}Voided: ${reason}`;
    await sale.save();

    await logAudit({
      req,
      action: 'VOID_SALE',
      entity: 'Sale',
      entityId: sale._id.toString(),
      details: { invoiceNo: sale.invoiceNo, reason }
    });

    res.json({ success: true, message: 'Sale voided and stock restored', sale });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
