import { Setting } from '../models/Setting.js';
import { AuditLog } from '../models/AuditLog.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { ProductVariant } from '../models/ProductVariant.js';
import { Category } from '../models/Category.js';
import { Brand } from '../models/Brand.js';
import { Size } from '../models/Size.js';
import { Color } from '../models/Color.js';
import { Customer } from '../models/Customer.js';
import { Supplier } from '../models/Supplier.js';
import { Sale } from '../models/Sale.js';
import { Purchase } from '../models/Purchase.js';
import { Expense } from '../models/Expense.js';
import { logAudit } from '../utils/auditLogger.js';

// Get all settings
export const getSettings = async (req, res) => {
  try {
    const settings = await Setting.find();
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    // Defaults if not set
    const defaultSettings = {
      storeName: 'HOORIYA ARTS',
      storePhone: '+92 300 1234567',
      storeEmail: 'contact@hooriyaarts.com',
      storeAddress: 'Shop # 14-16, Tariq Road Fashion Market, Karachi',
      currency: 'PKR',
      currencySymbol: 'Rs.',
      taxRate: 0,
      receiptFooterNote: 'Thank you for shopping with us! Exchange within 7 days with original receipt.',
      lowStockDefaultThreshold: 5
    };

    res.json({ success: true, settings: { ...defaultSettings, ...settingsMap } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update settings
export const updateSettings = async (req, res) => {
  try {
    const entries = Object.entries(req.body);
    for (const [key, value] of entries) {
      await Setting.findOneAndUpdate(
        { key },
        { key, value },
        { upsert: true, new: true }
      );
    }

    await logAudit({
      req,
      action: 'UPDATE_SETTINGS',
      entity: 'Setting',
      details: req.body
    });

    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get audit logs
export const getAuditLogs = async (req, res) => {
  try {
    const { action, limit = 100 } = req.query;
    const filter = {};
    if (action) filter.action = action;

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Export full backup data
export const exportBackup = async (req, res) => {
  try {
    const backupData = {
      timestamp: new Date().toISOString(),
      store: 'HOORIYA ARTS',
      users: await User.find().select('-password'),
      categories: await Category.find(),
      brands: await Brand.find(),
      sizes: await Size.find(),
      colors: await Color.find(),
      products: await Product.find(),
      variants: await ProductVariant.find(),
      customers: await Customer.find(),
      suppliers: await Supplier.find(),
      sales: await Sale.find().limit(500),
      purchases: await Purchase.find().limit(500),
      expenses: await Expense.find().limit(500),
      settings: await Setting.find()
    };

    await logAudit({
      req,
      action: 'EXPORT_DATABASE_BACKUP',
      entity: 'SystemBackup',
      details: { timestamp: backupData.timestamp }
    });

    res.json({ success: true, data: backupData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
