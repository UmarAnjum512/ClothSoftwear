import { Supplier } from '../models/Supplier.js';
import { Purchase } from '../models/Purchase.js';
import { logAudit } from '../utils/auditLogger.js';

export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json({ success: true, count: suppliers.length, suppliers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const purchases = await Purchase.find({ supplierId: supplier._id }).sort({ purchaseDate: -1 });

    res.json({ success: true, supplier, purchases });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createSupplier = async (req, res) => {
  try {
    const { name, contactPerson, phone, email, address, openingBalance } = req.body;
    const initialBal = Number(openingBalance) || 0;

    const supplier = await Supplier.create({
      name,
      contactPerson,
      phone,
      email,
      address,
      openingBalance: initialBal,
      currentBalance: initialBal
    });

    await logAudit({
      req,
      action: 'CREATE_SUPPLIER',
      entity: 'Supplier',
      entityId: supplier._id.toString(),
      details: { name: supplier.name, phone: supplier.phone }
    });

    res.status(201).json({ success: true, supplier });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.json({ success: true, supplier });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const recordSupplierPayment = async (req, res) => {
  try {
    const { amount, notes } = req.body;
    const payAmt = Number(amount);
    if (!payAmt || payAmt <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
    }

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    supplier.currentBalance -= payAmt;
    await supplier.save();

    await logAudit({
      req,
      action: 'SUPPLIER_PAYMENT',
      entity: 'Supplier',
      entityId: supplier._id.toString(),
      details: { amount: payAmt, currentBalance: supplier.currentBalance, notes }
    });

    res.json({ success: true, message: 'Supplier payment recorded', supplier });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
