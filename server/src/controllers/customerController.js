import { Customer } from '../models/Customer.js';
import { Sale } from '../models/Sale.js';
import { SaleReturn } from '../models/SaleReturn.js';
import { logAudit } from '../utils/auditLogger.js';

export const getCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    const customers = await Customer.find(filter).sort({ name: 1 });
    res.json({ success: true, count: customers.length, customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const sales = await Sale.find({ customerId: customer._id }).sort({ createdAt: -1 });
    const returns = await SaleReturn.find({ customerId: customer._id }).sort({ createdAt: -1 });

    res.json({ success: true, customer, sales, returns });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, openingBalance } = req.body;
    const existing = await Customer.findOne({ phone: phone.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Customer with this phone number already exists' });
    }

    const initialBal = Number(openingBalance) || 0;
    const customer = await Customer.create({
      name,
      phone: phone.trim(),
      email: email || '',
      address: address || '',
      openingBalance: initialBal,
      currentBalance: initialBal
    });

    await logAudit({
      req,
      action: 'CREATE_CUSTOMER',
      entity: 'Customer',
      entityId: customer._id.toString(),
      details: { name: customer.name, phone: customer.phone }
    });

    res.status(201).json({ success: true, customer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, customer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const recordCustomerPayment = async (req, res) => {
  try {
    const { amount, notes } = req.body;
    const payAmt = Number(amount);
    if (!payAmt || payAmt <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    customer.currentBalance -= payAmt;
    await customer.save();

    await logAudit({
      req,
      action: 'CUSTOMER_PAYMENT',
      entity: 'Customer',
      entityId: customer._id.toString(),
      details: { amount: payAmt, newBalance: customer.currentBalance, notes }
    });

    res.json({ success: true, message: 'Customer payment recorded successfully', customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
