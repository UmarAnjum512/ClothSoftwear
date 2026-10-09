import { ProductVariant } from '../models/ProductVariant.js';
import { StockMovement } from '../models/StockMovement.js';

/**
 * Adjusts variant stock and logs a stock movement record.
 */
export const adjustVariantStock = async ({
  variantId,
  qtyChange, // Positive to increase, negative to decrease
  type, // e.g. 'Purchase Received', 'Sale', 'Sale Return Saleable', 'Stock Adjustment +'
  referenceType,
  referenceId = '',
  notes = '',
  userId = null,
  userName = 'System'
}) => {
  const variant = await ProductVariant.findById(variantId).populate('productId');
  if (!variant) {
    throw new Error(`Product variant not found: ${variantId}`);
  }

  const previousStock = variant.stockQuantity || 0;
  const newStock = previousStock + qtyChange;

  if (newStock < 0 && (type === 'Sale' || type === 'Purchase Return' || type === 'Stock Adjustment -')) {
    // Note: in retail physical POS, warning or blocking can happen; let's throw if negative
    throw new Error(`Insufficient stock for SKU ${variant.sku}. Available: ${previousStock}, Requested: ${Math.abs(qtyChange)}`);
  }

  variant.stockQuantity = newStock;
  await variant.save();

  const productName = variant.productId?.name || 'Unknown Product';

  const movement = await StockMovement.create({
    variantId: variant._id,
    sku: variant.sku,
    productName,
    type,
    qtyChange,
    previousStock,
    newStock,
    referenceType,
    referenceId,
    notes,
    userId,
    userName
  });

  return { variant, movement };
};
