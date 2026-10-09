import { Expense } from '../models/Expense.js';
import { logAudit } from '../utils/auditLogger.js';

export const getExpenses = async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const expenses = await Expense.find(filter)
      .populate('recordedBy', 'name')
      .sort({ date: -1 });

    const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    res.json({ success: true, count: expenses.length, totalAmount, expenses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createExpense = async (req, res) => {
  try {
    const { title, category, amount, paymentMethod, date, description } = req.body;
    const expense = await Expense.create({
      title,
      category,
      amount: Number(amount),
      paymentMethod: paymentMethod || 'Cash',
      date: date || new Date(),
      description: description || '',
      recordedBy: req.user._id
    });

    await logAudit({
      req,
      action: 'CREATE_EXPENSE',
      entity: 'Expense',
      entityId: expense._id.toString(),
      details: { title, category, amount: expense.amount }
    });

    res.status(201).json({ success: true, expense });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    await Expense.findByIdAndDelete(req.params.id);

    await logAudit({
      req,
      action: 'DELETE_EXPENSE',
      entity: 'Expense',
      entityId: req.params.id,
      details: { title: expense.title, amount: expense.amount }
    });

    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
