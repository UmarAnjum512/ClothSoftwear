import { CashRegister } from '../models/CashRegister.js';
import { Sale } from '../models/Sale.js';
import { SaleReturn } from '../models/SaleReturn.js';
import { Expense } from '../models/Expense.js';
import { logAudit } from '../utils/auditLogger.js';

// Get current open register shift for logged in user
export const getCurrentRegister = async (req, res) => {
  try {
    const register = await CashRegister.findOne({
      userId: req.user._id,
      status: 'Open'
    });

    if (!register) {
      return res.json({ success: true, active: false, register: null });
    }

    // Calculate real-time totals during this shift
    const openedAt = register.openedAt;
    const now = new Date();

    const cashSales = await Sale.aggregate([
      {
        $match: {
          cashierId: req.user._id,
          status: 'Completed',
          paymentMethod: 'Cash',
          createdAt: { $gte: openedAt, $lte: now }
        }
      },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]);

    const cashRefunds = await SaleReturn.aggregate([
      {
        $match: {
          cashierId: req.user._id,
          refundMethod: 'Cash',
          createdAt: { $gte: openedAt, $lte: now }
        }
      },
      { $group: { _id: null, total: { $sum: '$totalReturnAmount' } } }
    ]);

    const cashExpenses = await Expense.aggregate([
      {
        $match: {
          recordedBy: req.user._id,
          paymentMethod: 'Cash',
          date: { $gte: openedAt, $lte: now }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const salesTotal = cashSales[0]?.total || 0;
    const refundsTotal = cashRefunds[0]?.total || 0;
    const expensesTotal = cashExpenses[0]?.total || 0;

    const expectedCash = register.openingCash + salesTotal - refundsTotal - expensesTotal;

    res.json({
      success: true,
      active: true,
      register: {
        ...register.toObject(),
        liveStats: {
          openingCash: register.openingCash,
          cashSales: salesTotal,
          cashRefunds: refundsTotal,
          cashExpenses: expensesTotal,
          expectedCash
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Open shift
export const openRegister = async (req, res) => {
  try {
    const existing = await CashRegister.findOne({
      userId: req.user._id,
      status: 'Open'
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active register shift. Please close it first.'
      });
    }

    const { openingCash = 0, notes = '' } = req.body;
    const shiftNumber = `SH-${Date.now().toString().slice(-6)}`;

    const register = await CashRegister.create({
      userId: req.user._id,
      shiftNumber,
      openingCash: Number(openingCash),
      status: 'Open',
      openedAt: new Date(),
      notes
    });

    await logAudit({
      req,
      action: 'OPEN_CASH_REGISTER',
      entity: 'CashRegister',
      entityId: register._id.toString(),
      details: { shiftNumber, openingCash }
    });

    res.status(201).json({ success: true, register });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Close shift
export const closeRegister = async (req, res) => {
  try {
    const { actualCash, notes } = req.body;
    const register = await CashRegister.findOne({
      userId: req.user._id,
      status: 'Open'
    });

    if (!register) {
      return res.status(404).json({ success: false, message: 'No active register shift found to close' });
    }

    const openedAt = register.openedAt;
    const closedAt = new Date();

    const cashSales = await Sale.aggregate([
      {
        $match: {
          cashierId: req.user._id,
          status: 'Completed',
          paymentMethod: 'Cash',
          createdAt: { $gte: openedAt, $lte: closedAt }
        }
      },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]);

    const cashRefunds = await SaleReturn.aggregate([
      {
        $match: {
          cashierId: req.user._id,
          refundMethod: 'Cash',
          createdAt: { $gte: openedAt, $lte: closedAt }
        }
      },
      { $group: { _id: null, total: { $sum: '$totalReturnAmount' } } }
    ]);

    const cashExpenses = await Expense.aggregate([
      {
        $match: {
          recordedBy: req.user._id,
          paymentMethod: 'Cash',
          date: { $gte: openedAt, $lte: closedAt }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const salesTotal = cashSales[0]?.total || 0;
    const refundsTotal = cashRefunds[0]?.total || 0;
    const expensesTotal = cashExpenses[0]?.total || 0;

    const expectedCash = register.openingCash + salesTotal - refundsTotal - expensesTotal;
    const enteredCash = Number(actualCash) || 0;
    const difference = enteredCash - expectedCash; // < 0 shortage, > 0 overage

    register.actualCash = enteredCash;
    register.expectedCash = expectedCash;
    register.difference = difference;
    register.status = 'Closed';
    register.closedAt = closedAt;
    if (notes) register.notes = `${register.notes ? register.notes + ' | ' : ''}${notes}`;

    await register.save();

    await logAudit({
      req,
      action: 'CLOSE_CASH_REGISTER',
      entity: 'CashRegister',
      entityId: register._id.toString(),
      details: {
        shiftNumber: register.shiftNumber,
        expectedCash,
        actualCash: enteredCash,
        difference
      }
    });

    res.json({
      success: true,
      message: 'Register closed successfully',
      register,
      summary: {
        openingCash: register.openingCash,
        cashSales: salesTotal,
        cashRefunds: refundsTotal,
        cashExpenses: expensesTotal,
        expectedCash,
        actualCash: enteredCash,
        difference
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get register shifts history
export const getRegisterHistory = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'Cashier') {
      filter.userId = req.user._id;
    }
    const shifts = await CashRegister.find(filter)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, count: shifts.length, shifts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
