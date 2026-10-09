import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  ShoppingCart,
  Boxes,
  AlertTriangle,
  Receipt,
  Users,
  Truck,
  PiggyBank,
  Sparkles,
  BarChart3,
  PieChart as PieIcon,
  CreditCard,
  Shirt
} from 'lucide-react';
import TrendLineChart, { CHART_COLORS } from '../components/charts/TrendLineChart';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const PAYMENT_COLORS = {
  Cash: '#0f8a6a',          // deep green
  Card: '#8f2a58',          // mulberry
  Easypaisa: '#5b4bb7',     // violet
  JazzCash: '#d4a64a',      // gold
  BankTransfer: '#2f6f9f',  // steel blue
  'Bank Transfer': '#2f6f9f',
  Split: '#70676e'
};

const DEFAULT_COLORS = ['#8f2a58', '#0f8a6a', '#d4a64a', '#5b4bb7', '#c2410c', '#2f6f9f'];

const RANGE_OPTIONS = [
  { days: 7, label: '7 days' },
  { days: 14, label: '14 days' },
  { days: 30, label: '30 days' }
];

const money = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendMetric, setTrendMetric] = useState('money'); // 'money' | 'bills'
  const [rangeDays, setRangeDays] = useState(7);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/reports/dashboard');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const todayProfit = (data?.today?.sales || 0) - (data?.today?.expenses || 0);

  // Line chart data: last 30 days, sliced to the selected range
  const canSeeProfit = ['Super Admin', 'Manager'].includes(user?.role);
  const trendRows = (data?.dailyTrend || []).slice(-rangeDays);

  const moneySeries = [
    { key: 'sales', label: 'Sales', color: CHART_COLORS.sales },
    ...(canSeeProfit
      ? [
          { key: 'grossProfit', label: 'Gross profit', color: CHART_COLORS.profit },
          { key: 'expenses', label: 'Expenses', color: CHART_COLORS.expenses, dashed: true }
        ]
      : [])
  ];
  const billSeries = [{ key: 'bills', label: 'Bills', color: CHART_COLORS.bills }];

  const trendTotals = trendRows.reduce(
    (acc, row) => ({
      sales: acc.sales + (row.sales || 0),
      bills: acc.bills + (row.bills || 0),
      grossProfit: acc.grossProfit + (row.grossProfit || 0),
      expenses: acc.expenses + (row.expenses || 0)
    }),
    { sales: 0, bills: 0, grossProfit: 0, expenses: 0 }
  );

  // Top products data
  const topProductsData = (data?.topProducts || []).map(p => ({
    name: p._id?.length > 18 ? p._id.substring(0, 16) + '...' : p._id || 'Unknown',
    fullName: p._id || 'Unknown',
    sold: p.totalQty || 0,
    revenue: p.totalRevenue || 0
  }));

  // Payment methods data
  const paymentData = (data?.paymentMethods || []).map(pm => ({
    name: pm._id || 'Other',
    value: pm.total || 0,
    count: pm.count || 0
  }));

  const totalPaymentSum = paymentData.reduce((acc, curr) => acc + curr.value, 0);

  // Inventory stock calculation
  const totalStock = data?.inventory?.totalStockQty || 0;
  const lowStock = data?.inventory?.lowStockCount || 0;
  const outOfStock = data?.inventory?.outOfStockCount || 0;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden bg-indigo-900 rounded-xl p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 1px, transparent 14px), repeating-linear-gradient(-45deg, #fff 0, #fff 1px, transparent 1px, transparent 14px)'
          }}
        />
        <div className="relative">
          <p className="text-gold-300 text-sm font-semibold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">Welcome back, {user?.name}</h1>
          <p className="text-indigo-100/80 text-sm mt-1">
            Here is how HOORIYA ARTS is doing today.
          </p>
        </div>
        <div className="relative flex items-center space-x-3">
          <Link
            to="/pos"
            className="px-4 py-2.5 bg-gold-300 text-indigo-950 font-bold text-sm rounded-lg hover:bg-gold-200 transition-colors flex items-center space-x-1.5"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Open POS billing</span>
          </Link>
        </div>
      </div>

      {/* Top Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today Sales */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Today's Sales</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-800">
              Rs. {Number(data?.today?.sales || 0).toLocaleString()}
            </span>
            <div className="flex items-center text-xs text-slate-500 mt-1">
              <span>{data?.today?.salesCount || 0} bills today</span>
            </div>
          </div>
        </div>

        {/* Today Purchases */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Today's Purchases</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-800">
              Rs. {Number(data?.today?.purchases || 0).toLocaleString()}
            </span>
            <div className="flex items-center text-xs text-slate-500 mt-1">
              <span>New stock acquired</span>
            </div>
          </div>
        </div>

        {/* Today Expenses */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Today's Expenses</span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-800">
              Rs. {Number(data?.today?.expenses || 0).toLocaleString()}
            </span>
            <div className="flex items-center text-xs text-slate-500 mt-1">
              <span>Operational costs</span>
            </div>
          </div>
        </div>

        {/* Est Today Net Cash Flow */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Today's net profit</span>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${todayProfit >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-bold ${todayProfit >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
              Rs. {Number(todayProfit).toLocaleString()}
            </span>
            <div className="flex items-center text-xs text-slate-500 mt-1">
              <span>Sales minus expenses today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stock and Ledger Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock Items */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Total Inventory</span>
            <Boxes className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-slate-800">
              {totalStock} Pieces
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Cost: Rs. {Number(data?.inventory?.costValue || 0).toLocaleString()} | Retail: Rs. {Number(data?.inventory?.retailValue || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <Link
          to="/inventory?filterStatus=lowStock"
          className="bg-amber-50/60 rounded-xl p-5 border border-amber-200/80 shadow-sm hover:bg-amber-50 transition-colors block"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-amber-800">Low Stock Alert</span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-amber-900">
              {lowStock} Variants
            </span>
            <p className="text-xs text-amber-700 mt-1">Below reorder threshold</p>
          </div>
        </Link>

        {/* Customer Dues */}
        <Link
          to="/customers"
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-card block"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Customer Receivables</span>
            <Users className="w-5 h-5 text-sky-600" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-sky-700">
              Rs. {Number(data?.receivablesPayables?.customerDues || 0).toLocaleString()}
            </span>
            <p className="text-xs text-slate-500 mt-1">Credit balance owed to store</p>
          </div>
        </Link>

        {/* Supplier Payables */}
        <Link
          to="/suppliers"
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-card block"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Supplier Payables</span>
            <Truck className="w-5 h-5 text-violet-600" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-violet-700">
              Rs. {Number(data?.receivablesPayables?.supplierDues || 0).toLocaleString()}
            </span>
            <p className="text-xs text-slate-500 mt-1">Amount due to suppliers</p>
          </div>
        </Link>
      </div>

      {/* ===================== CHARTS SECTION ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Business performance (line chart) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-slate-800 text-sm">Business performance</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {canSeeProfit
                  ? 'Daily sales, gross profit and expenses'
                  : 'Daily sales and number of bills'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Metric toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold" role="group" aria-label="Chart metric">
                {[
                  { id: 'money', label: 'Amounts' },
                  { id: 'bills', label: 'Bills' }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setTrendMetric(m.id)}
                    aria-pressed={trendMetric === m.id}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      trendMetric === m.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Range toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold" role="group" aria-label="Date range">
                {RANGE_OPTIONS.map((r) => (
                  <button
                    key={r.days}
                    type="button"
                    onClick={() => setRangeDays(r.days)}
                    aria-pressed={rangeDays === r.days}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      rangeDays === r.days ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <TrendLineChart
            key={trendMetric}
            data={trendRows}
            series={trendMetric === 'money' ? moneySeries : billSeries}
            isMoney={trendMetric === 'money'}
            emptyMessage={`No sales recorded in the last ${rangeDays} days.`}
          />

          {/* Totals for the selected range */}
          <dl className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <dt className="text-slate-500">Sales, {rangeDays} days</dt>
              <dd className="mt-0.5 text-sm font-bold text-slate-800">{money(trendTotals.sales)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Bills</dt>
              <dd className="mt-0.5 text-sm font-bold text-slate-800">{trendTotals.bills.toLocaleString()}</dd>
            </div>
            {canSeeProfit && (
              <>
                <div>
                  <dt className="text-slate-500">Gross profit</dt>
                  <dd className="mt-0.5 text-sm font-bold text-emerald-700">{money(trendTotals.grossProfit)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Expenses</dt>
                  <dd className="mt-0.5 text-sm font-bold text-gold-700">{money(trendTotals.expenses)}</dd>
                </div>
              </>
            )}
          </dl>
        </div>

        {/* Chart 2: Payment Methods Breakdown (Donut Chart) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <PieIcon className="w-5 h-5 text-emerald-600" />
                <h2 className="font-bold text-slate-800 text-sm">Payment Methods Breakdown</h2>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-4">Share of cash vs digital wallets (Last 30 Days)</p>

            {paymentData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
                No payment data yet
              </div>
            ) : (
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {paymentData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PAYMENT_COLORS[entry.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const p = payload[0].payload;
                          const pct = totalPaymentSum > 0 ? ((p.value / totalPaymentSum) * 100).toFixed(1) : 0;
                          return (
                            <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs space-y-0.5 shadow-xl">
                              <p className="font-bold">{p.name}</p>
                              <p className="text-emerald-400">Rs. {Number(p.value).toLocaleString()} ({pct}%)</p>
                              <p className="text-slate-400 text-[10px]">{p.count} transactions</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Payment Method Legend List */}
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            {paymentData.map((pm, i) => {
              const color = PAYMENT_COLORS[pm.name] || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
              const pct = totalPaymentSum > 0 ? ((pm.value / totalPaymentSum) * 100).toFixed(0) : 0;
              return (
                <div key={pm.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-medium text-slate-700">{pm.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">{pct}%</span>
                    <span className="font-bold text-slate-800">Rs. {Number(pm.value).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart 3: Top Selling Garments + Stock Health + Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products (Bar Chart) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center space-x-2 mb-1">
            <Shirt className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800 text-sm">Top Selling Garments</h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">Best performers by units sold (Last 30 Days)</p>

          {topProductsData.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-slate-400 text-xs">
              <Shirt className="w-8 h-8 mb-2 text-slate-300 stroke-1" />
              <p>No product sales recorded yet</p>
            </div>
          ) : (
            <>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProductsData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e6e1e4" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#70676e', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#d1cace' }} />
                    <YAxis tick={{ fill: '#70676e', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const p = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs space-y-0.5 shadow-xl">
                              <p className="font-bold">{p.fullName}</p>
                              <p className="text-indigo-300 font-semibold">{p.sold} units sold</p>
                              <p className="text-slate-400 text-[10px]">Revenue: Rs. {Number(p.revenue).toLocaleString()}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="sold" fill="#8f2a58" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Mini Top List */}
              <div className="mt-3 space-y-1.5 pt-3 border-t border-slate-100">
                {topProductsData.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium truncate max-w-[150px]">{item.fullName}</span>
                    <span className="font-bold text-slate-800">{item.sold} pcs</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Recent Sales Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-800 text-sm">Recent POS Transactions</h2>
                <p className="text-xs text-slate-400">Latest customer retail bills</p>
              </div>
              <Link to="/sales" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">
                View all bills &rarr;
              </Link>
            </div>

            <div className="divide-y divide-slate-100 overflow-x-auto">
              {(!data?.recentSales || data.recentSales.length === 0) ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No sales yet. Open POS billing to ring up the first customer.
                </div>
              ) : (
                data.recentSales.slice(0, 5).map((sale) => (
                  <div key={sale._id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 text-sm transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-semibold text-xs shrink-0">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-xs">{sale.invoiceNo}</p>
                        <p className="text-[11px] text-slate-500">
                          {sale.customerName} • {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-slate-800 text-xs">Rs. {Number(sale.grandTotal).toLocaleString()}</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        sale.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : sale.status === 'Void'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {sale.status} • {sale.paymentMethod}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="px-6 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>HOORIYA ARTS</span>
            <Link to="/reports" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Reports and profit &amp; loss &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
