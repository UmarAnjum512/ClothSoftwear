import { Sale } from '../models/Sale.js';
import { SaleReturn } from '../models/SaleReturn.js';
import { ProductVariant } from '../models/ProductVariant.js';
import { StockMovement } from '../models/StockMovement.js';
import { adjustVariantStock } from '../services/inventoryService.js';
import { logAudit } from '../utils/auditLogger.js';

export const processSaleReturnOrExchange = async (req, res) => {
  try {
    const {
      saleId,
      returnType = 'Refund', // 'Refund' or 'Exchange'
      returnedItems = [],
      exchangeItems = [],
      refundMethod = 'Cash',
      notes = ''
    } = req.body;

    const sale = await Sale.findById(saleId);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Original sale invoice not found' });
    }

    if (!returnedItems || returnedItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Please specify items to return' });
    }

    // Calculate total return amount
    let totalReturnAmount = 0;
    const processedReturned = [];
    for (const item of returnedItems) {
      const lineRefund = Number(item.qty) * Number(item.unitPrice);
      totalReturnAmount += lineRefund;
      processedReturned.push({
        variantId: item.variantId,
        productName: item.productName || 'Returned Item',
        sizeName: item.sizeName || '',
        colorName: item.colorName || '',
        qty: Number(item.qty),
        unitPrice: Number(item.unitPrice),
        refundAmount: lineRefund,
        disposition: item.disposition || 'saleable',
        reason: item.reason || 'Size/Fit Issue'
      });
    }

    // If Exchange, process replacement items
    let totalExchangeAmount = 0;
    const processedExchange = [];
    if (returnType === 'Exchange') {
      for (const item of exchangeItems) {
        const variant = await ProductVariant.findById(item.variantId)
          .populate('productId')
          .populate('sizeId')
          .populate('colorId');

        if (!variant) {
          return res.status(404).json({ success: false, message: `Replacement variant not found: ${item.variantId}` });
        }

        const qty = Number(item.qty);
        if (variant.stockQuantity < qty) {
          return res.status(400).json({
            success: false,
            message: `Replacement item ${variant.productId?.name} (${variant.sizeId?.name}) is out of stock. Available: ${variant.stockQuantity}`
          });
        }

        const unitPrice = Number(item.unitPrice) || variant.salePrice;
        const lineTotal = unitPrice * qty;
        totalExchangeAmount += lineTotal;

        processedExchange.push({
          variantId: variant._id,
          productName: variant.productId?.name || 'Clothing Item',
          sizeName: variant.sizeId?.name || '',
          colorName: variant.colorId?.name || '',
          qty,
          unitPrice,
          total: lineTotal
        });
      }
    }

    const netDifference = totalExchangeAmount - totalReturnAmount;
    const returnNo = `RET-${Date.now().toString().slice(-6)}`;

    // Create SaleReturn record
    const saleReturn = await SaleReturn.create({
      returnNo,
      saleId: sale._id,
      invoiceNo: sale.invoiceNo,
      customerId: sale.customerId,
      cashierId: req.user._id,
      returnType,
      returnedItems: processedReturned,
      exchangeItems: processedExchange,
      totalReturnAmount,
      totalExchangeAmount,
      netDifference,
      refundMethod,
      notes
    });

    // 1. Adjust inventory for returned items
    for (const item of processedReturned) {
      if (item.disposition === 'saleable') {
        // Increases sellable stock
        await adjustVariantStock({
          variantId: item.variantId,
          qtyChange: item.qty,
          type: 'Sale Return Saleable',
          referenceType: 'Sale Return',
          referenceId: saleReturn.returnNo,
          notes: `Return on invoice ${sale.invoiceNo} (Saleable). Reason: ${item.reason}`,
          userId: req.user._id,
          userName: req.user.name
        });
      } else {
        // Damaged: does not increase sellable stock, record damaged audit
        const variant = await ProductVariant.findById(item.variantId).populate('productId');
        await StockMovement.create({
          variantId: item.variantId,
          sku: variant?.sku || '',
          productName: variant?.productId?.name || item.productName,
          type: 'Sale Return Damaged',
          qtyChange: 0,
          previousStock: variant?.stockQuantity || 0,
          newStock: variant?.stockQuantity || 0,
          referenceType: 'Sale Return',
          referenceId: saleReturn.returnNo,
          notes: `Damaged return received (Stock not increased). Reason: ${item.reason}`,
          userId: req.user._id,
          userName: req.user.name
        });
      }
    }

    // 2. Adjust inventory for exchange items (deduct replacement stock)
    if (returnType === 'Exchange') {
      for (const item of processedExchange) {
        await adjustVariantStock({
          variantId: item.variantId,
          qtyChange: -item.qty,
          type: 'Sale',
          referenceType: 'Sale Return',
          referenceId: saleReturn.returnNo,
          notes: `Exchange replacement for return ${saleReturn.returnNo}`,
          userId: req.user._id,
          userName: req.user.name
        });
      }
    }

    // Update sale status
    sale.status = 'Partial Returned';
    await sale.save();

    await logAudit({
      req,
      action: returnType === 'Exchange' ? 'SALE_EXCHANGE' : 'SALE_RETURN',
      entity: 'SaleReturn',
      entityId: saleReturn._id.toString(),
      details: {
        returnNo: saleReturn.returnNo,
        invoiceNo: sale.invoiceNo,
        totalReturnAmount,
        totalExchangeAmount,
        netDifference
      }
    });

    res.status(201).json({
      success: true,
      message: `${returnType} processed successfully`,
      saleReturn
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getSaleReturns = async (req, res) => {
  try {
    const returns = await SaleReturn.find()
      .populate('cashierId', 'name')
      .populate('customerId', 'name phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: returns.length, returns });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
