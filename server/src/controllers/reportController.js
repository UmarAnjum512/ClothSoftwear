import { Sale } from '../models/Sale.js';
import { SaleReturn } from '../models/SaleReturn.js';
import { Purchase } from '../models/Purchase.js';
import { Expense } from '../models/Expense.js';
import { ProductVariant } from '../models/ProductVariant.js';
import { Customer } from '../models/Customer.js';
import { Supplier } from '../models/Supplier.js';
import {
  STORE_TZ,
  toDayKey,
  startOfDay,
  endOfDay,
  startOfDayKey,
  endOfDayKey,
  daysAgoStart,
  monthsAgoStart
} from '../utils/timezone.js';

// ---------------------------------------------------------------------------
// Trend helpers (used by the dashboard and the Reports line charts)
// ---------------------------------------------------------------------------

// Ordered list of bucket keys covering [start, end] (inclusive)
const buildPeriodKeys = (start, end, groupBy) => {
  const keys = [];
  const startKey = toDayKey(start);
  const endKey = toDayKey(end);
  const cursor = new Date(`${startKey}T00:00:00Z`);

  if (groupBy === 'month') {
    cursor.setUTCDate(1);
    const lastKey = endKey.slice(0, 7);
    while (cursor.toISOString().slice(0, 7) <= lastKey) {
      keys.push(cursor.toISOString().slice(0, 7));
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
  } else {
    while (cursor.toISOString().slice(0, 10) <= endKey) {
      keys.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }
  return keys;
};

/**
 * Sales, returns, COGS and expenses bucketed by day or month.
 * Every period in the range is returned (missing ones are zero-filled) so a
 * line chart never has gaps.
 */
const getTrendSeries = async (start, end, groupBy = 'day') => {
  const format = groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';
  const bucket = (field) => ({ $dateToString: { format, date: field, timezone: STORE_TZ } });

  const [salesRows, returnRows, expenseRows] = await Promise.all([
    Sale.aggregate([
      {
        $match: {
          status: { $in: ['Completed', 'Partial Returned'] },
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: bucket('$createdAt'),
          sales: { $sum: '$grandTotal' },
          bills: { $sum: 1 },
          cogs: {
            $sum: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $multiply: [{ $ifNull: ['$$this.costPrice', 0] }, { $ifNull: ['$$this.qty', 0] }] }
                  ]
                }
              }
            }
          }
        }
      }
    ]),
    SaleReturn.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: bucket('$createdAt'), returns: { $sum: '$totalReturnAmount' } } }
    ]),
    Expense.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: { _id: bucket('$date'), expenses: { $sum: '$amount' } } }
    ])
  ]);

  const salesMap = new Map(salesRows.map(r => [r._id, r]));
  const returnMap = new Map(returnRows.map(r => [r._id, r.returns]));
  const expenseMap = new Map(expenseRows.map(r => [r._id, r.expenses]));

  return buildPeriodKeys(start, end, groupBy).map(key => {
    const row = salesMap.get(key);
    const sales = row?.sales || 0;
    const cogs = row?.cogs || 0;
    const returns = returnMap.get(key) || 0;
    const expenses = expenseMap.get(key) || 0;
    const netSales = sales - returns;
    const grossProfit = netSales - cogs;
    return {
      period: key,
      sales,
      returns,
      netSales,
      cogs,
      grossProfit,
      expenses,
      netProfit: grossProfit - expenses,
      bills: row?.bills || 0
    };
  });
};

// Dashboard summary
export const getDashboardSummary = async (req, res) => {
  try {
    const todayStart = startOfDay();
    const todayEnd = endOfDay();

    // 1. Today's Sales
    const todaySales = await Sale.aggregate([
      {
        $match: {
          status: { $in: ['Completed', 'Partial Returned'] },
          createdAt: { $gte: todayStart, $lte: todayEnd }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$grandTotal' },
          totalPaid: { $sum: '$paidAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // 2. Today's Purchases
    const todayPurchases = await Purchase.aggregate([
      {
        $match: {
          status: 'Received',
          purchaseDate: { $gte: todayStart, $lte: todayEnd }
        }
      },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // 3. Today's Expenses
    const todayExpenses = await Expense.aggregate([
      {
        $match: {
          date: { $gte: todayStart, $lte: todayEnd }
        }
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' }
        }
      }
    ]);

    // 4. Inventory stats
    const variants = await ProductVariant.find({ status: 'active' });
    let totalStockQty = 0;
    let inventoryCostValue = 0;
    let inventoryRetailValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    variants.forEach(v => {
      totalStockQty += v.stockQuantity;
      inventoryCostValue += v.stockQuantity * v.costPrice;
      inventoryRetailValue += v.stockQuantity * v.salePrice;
      if (v.stockQuantity <= 0) outOfStockCount++;
      else if (v.stockQuantity <= v.reorderLevel) lowStockCount++;
    });

    // 5. Receivables & Payables
    const customerDues = await Customer.aggregate([
      { $match: { currentBalance: { $gt: 0 } } },
      { $group: { _id: null, totalDue: { $sum: '$currentBalance' } } }
    ]);

    const supplierDues = await Supplier.aggregate([
      { $match: { currentBalance: { $gt: 0 } } },
      { $group: { _id: null, totalDue: { $sum: '$currentBalance' } } }
    ]);

    // 6. Recent Sales & Purchases
    const recentSales = await Sale.find()
      .populate('cashierId', 'name')
      .sort({ createdAt: -1 })
      .limit(6);

    const recentPurchases = await Purchase.find()
      .populate('supplierId', 'name')
      .sort({ purchaseDate: -1 })
      .limit(6);

    // 7. Last 7 Days Sales Trend
    const sevenDaysAgo = daysAgoStart(6);

    const salesTrend = await Sale.aggregate([
      {
        $match: {
          status: { $in: ['Completed', 'Partial Returned'] },
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$grandTotal' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 8. Top 5 selling products (by quantity sold, last 30 days)
    const thirtyDaysAgo = daysAgoStart(30);

    const topProducts = await Sale.aggregate([
      { $match: { status: { $in: ['Completed', 'Partial Returned'] }, createdAt: { $gte: thirtyDaysAgo } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productName',
          totalQty: { $sum: '$items.qty' },
          totalRevenue: { $sum: { $multiply: ['$items.qty', '$items.unitPrice'] } }
        }
      },
      { $sort: { totalQty: -1 } },
      { $limit: 5 }
    ]);

    // 9. Payment method breakdown (last 30 days)
    const paymentMethods = await Sale.aggregate([
      { $match: { status: { $in: ['Completed', 'Partial Returned'] }, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$grandTotal' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // 10. Last 30 days performance (sales, gross profit, expenses) for line charts
    const trendStart = daysAgoStart(29);
    let dailyTrend = await getTrendSeries(trendStart, todayEnd, 'day');
    // Cost and profit figures are only for owners/managers
    if (!['Super Admin', 'Manager'].includes(req.user?.role)) {
      dailyTrend = dailyTrend.map(({ period, sales, bills }) => ({ period, sales, bills }));
    }

    res.json({
      success: true,
      data: {
        today: {
          sales: todaySales[0]?.totalSales || 0,
          salesCount: todaySales[0]?.count || 0,
          purchases: todayPurchases[0]?.totalPurchases || 0,
          expenses: todayExpenses[0]?.totalExpenses || 0
        },
        inventory: {
          totalVariants: variants.length,
          totalStockQty,
          costValue: inventoryCostValue,
          retailValue: inventoryRetailValue,
          lowStockCount,
          outOfStockCount
        },
        receivablesPayables: {
          customerDues: customerDues[0]?.totalDue || 0,
          supplierDues: supplierDues[0]?.totalDue || 0
        },
        recentSales,
        recentPurchases,
        salesTrend,
        dailyTrend,
        topProducts,
        paymentMethods
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Profit and Loss report
export const getProfitLossReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { status: { $in: ['Completed', 'Partial Returned'] } };
    const dateMatch = {};

    if (startDate) dateMatch.$gte = startOfDayKey(startDate);
    if (endDate) dateMatch.$lte = endOfDayKey(endDate);

    if (startDate || endDate) filter.createdAt = dateMatch;

    const sales = await Sale.find(filter);

    let grossSales = 0;
    let cogs = 0;

    sales.forEach(sale => {
      grossSales += sale.grandTotal;
      sale.items.forEach(item => {
        cogs += (item.costPrice || 0) * item.qty;
      });
    });

    // Returns
    const returnFilter = {};
    if (startDate || endDate) returnFilter.createdAt = dateMatch;
    const returns = await SaleReturn.find(returnFilter);
    const totalReturns = returns.reduce((acc, curr) => acc + curr.totalReturnAmount, 0);

    const netSales = Math.max(0, grossSales - totalReturns);
    const grossProfit = netSales - cogs;

    // Expenses
    const expenseFilter = {};
    if (startDate || endDate) expenseFilter.date = dateMatch;
    const expenses = await Expense.find(expenseFilter);
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    const netProfit = grossProfit - totalExpenses;

    res.json({
      success: true,
      data: {
        grossSales,
        totalReturns,
        netSales,
        cogs,
        grossProfit,
        operatingExpenses: totalExpenses,
        netProfit,
        salesCount: sales.length,
        returnsCount: returns.length,
        expensesCount: expenses.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Profit & loss trend over time (powers the Reports line charts)
// GET /reports/trend?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&groupBy=day|month
export const getTrendReport = async (req, res) => {
  try {
    let groupBy = req.query.groupBy === 'month' ? 'month' : 'day';

    const end = req.query.endDate ? endOfDayKey(req.query.endDate) : endOfDay();

    let start;
    if (req.query.startDate) {
      start = startOfDayKey(req.query.startDate);
    } else {
      // No range chosen: last 30 days (daily) or last 12 months (monthly)
      start = groupBy === 'month' ? monthsAgoStart(11) : daysAgoStart(29);
    }

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return res.status(400).json({ success: false, message: 'Invalid date range.' });
    }

    // Keep daily charts readable: very long ranges switch to monthly buckets
    const spanDays = Math.ceil((end - start) / 86400000);
    if (groupBy === 'day' && spanDays > 366) groupBy = 'month';

    const series = await getTrendSeries(start, end, groupBy);

    res.json({
      success: true,
      data: {
        groupBy,
        startDate: toDayKey(start),
        endDate: toDayKey(end),
        series
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
