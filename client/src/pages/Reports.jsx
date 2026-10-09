import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, Printer, TrendingUp } from 'lucide-react';
import TrendLineChart, { CHART_COLORS } from '../components/charts/TrendLineChart';

const money = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

const PERIOD_SERIES = [
  { key: 'netSales', label: 'Net sales', color: CHART_COLORS.sales },
  { key: 'grossProfit', label: 'Gross profit', color: CHART_COLORS.profit },
  { key: 'expenses', label: 'Expenses', color: CHART_COLORS.expenses, dashed: true },
  { key: 'netProfit', label: 'Net profit', color: CHART_COLORS.netProfit }
];

const VOLUME_SERIES = [
  { key: 'bills', label: 'Bills', color: CHART_COLORS.bills }
];

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [trend, setTrend] = useState(null);
  const [trendLoading, setTrendLoading] = useState(true);
  const [groupBy, setGroupBy] = useState('day'); // 'day' | 'month'

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const query = () => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return params;
  };

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError('');
        const qs = query().toString();
        const res = await api.get(`/reports/profit-loss${qs ? `?${qs}` : ''}`);
        if (res.data.success) setData(res.data.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Could not load the profit and loss statement.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  useEffect(() => {
    const fetchTrend = async () => {
      try {
        setTrendLoading(true);
        const params = query();
        params.set('groupBy', groupBy);
        const res = await api.get(`/reports/trend?${params.toString()}`);
        if (res.data.success) setTrend(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setTrendLoading(false);
      }
    };
    fetchTrend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, groupBy]);

  const grossMargin = data?.netSales > 0 ? Math.round((data.grossProfit / data.netSales) * 100) : 0;
  const netMargin = data?.netSales > 0 ? Math.round((data.netProfit / data.netSales) * 100) : 0;

  const series = trend?.series || [];
  const best = series.reduce((top, row) => (row.netSales > (top?.netSales ?? -Infinity) ? row : top), null);

  const rangeLabel =
    startDate || endDate
      ? `${startDate || 'Start'} to ${endDate || 'Today'}`
      : 'All time';

  const trendCaption = trend
    ? `${trend.startDate} to ${trend.endDate}, by ${trend.groupBy === 'month' ? 'month' : 'day'}`
    : '';

  const inputCls =
    'px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Reports and profit &amp; loss</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Net sales, cost of goods, expenses and profit, with trends over time.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-lg transition-colors flex items-center space-x-1.5"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>Print statement</span>
        </button>
      </div>

      {/* Date filters */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-card flex flex-wrap items-center gap-3 text-sm">
        <span className="font-semibold text-slate-600 flex items-center space-x-1.5">
          <Calendar className="w-4 h-4" />
          <span>Date range</span>
        </span>
        <label className="flex items-center space-x-2 text-slate-500">
          <span>From</span>
          <input type="date" value={startDate} max={endDate || undefined} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
        </label>
        <label className="flex items-center space-x-2 text-slate-500">
          <span>To</span>
          <input type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
        </label>
        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="text-indigo-700 hover:underline font-semibold"
          >
            Clear dates
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Net sales', value: data?.netSales, tone: 'text-slate-900' },
          { label: `Gross profit (${grossMargin}%)`, value: data?.grossProfit, tone: 'text-emerald-700' },
          { label: 'Expenses', value: data?.operatingExpenses, tone: 'text-gold-700' },
          {
            label: `Net profit (${netMargin}%)`,
            value: data?.netProfit,
            tone: (data?.netProfit || 0) >= 0 ? 'text-indigo-700' : 'text-rose-700'
          }
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 shadow-card p-4">
            <p className="text-sm font-semibold text-slate-500">{card.label}</p>
            <p className={`mt-1.5 text-xl font-bold ${card.tone}`}>{loading ? '...' : money(card.value)}</p>
          </div>
        ))}
      </div>

      {/* LINE CHART 1: profit & loss trend */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-800 text-sm">Profit and loss trend</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {trendCaption || 'Loading range...'}
              {!startDate && !endDate && trend ? ' (pick dates above to change the range)' : ''}
            </p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold" role="group" aria-label="Group by">
            {[
              { id: 'day', label: 'Daily' },
              { id: 'month', label: 'Monthly' }
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGroupBy(g.id)}
                aria-pressed={groupBy === g.id}
                className={`px-3 py-1 rounded-md transition-colors ${
                  groupBy === g.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {trendLoading && !trend ? (
          <div className="h-72 flex items-center justify-center text-slate-400 text-sm">Loading chart...</div>
        ) : (
          <TrendLineChart data={series} series={PERIOD_SERIES} emptyMessage="No sales or expenses in this range." />
        )}

        {best && best.netSales > 0 && (
          <p className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600">
            Best {trend.groupBy === 'month' ? 'month' : 'day'}:{' '}
            <span className="font-semibold text-slate-800">{best.period}</span> with{' '}
            <span className="font-semibold text-indigo-700">{money(best.netSales)}</span> in net sales.
          </p>
        )}
      </section>

      {/* LINE CHART 2: bills over time */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
        <h2 className="font-bold text-slate-800 text-sm">Bills issued</h2>
        <p className="text-xs text-slate-500 mt-0.5 mb-4">Number of completed sales in the same range</p>
        <TrendLineChart data={series} series={VOLUME_SERIES} isMoney={false} height={220} emptyMessage="No bills in this range." />
      </section>

      {/* PROFIT & LOSS STATEMENT (printable) */}
      <div id="printable-report" className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-card max-w-3xl space-y-6">
        <div className="border-b border-slate-200 pb-4 flex flex-wrap gap-2 justify-between items-center">
          <div>
            <h2 className="font-display text-xl font-semibold text-indigo-800 tracking-wide">HOORIYA ARTS</h2>
            <p className="text-sm text-slate-500">Statement of profit and loss</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-full text-slate-600">{rangeLabel}</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Calculating statement...</div>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Gross sales ({data?.salesCount || 0} invoices)</span>
                <span>{money(data?.grossSales)}</span>
              </div>
              <div className="flex justify-between text-slate-500 pl-4">
                <span>Less: customer returns and refunds ({data?.returnsCount || 0})</span>
                <span className="text-rose-600">- {money(data?.totalReturns)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-2">
                <span>Net sales</span>
                <span>{money(data?.netSales)}</span>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-200">
              <div className="flex justify-between text-slate-500 pl-4">
                <span>Less: cost of goods sold (purchase cost of items sold)</span>
                <span className="text-rose-600">- {money(data?.cogs)}</span>
              </div>
              <div className="flex justify-between font-bold text-indigo-800 bg-indigo-50 p-3 rounded-lg">
                <span>Gross profit ({grossMargin}% margin)</span>
                <span>{money(data?.grossProfit)}</span>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-200">
              <div className="flex justify-between text-slate-500 pl-4">
                <span>Less: operating expenses ({data?.expensesCount || 0} vouchers)</span>
                <span className="text-rose-600">- {money(data?.operatingExpenses)}</span>
              </div>
            </div>

            <div
              className={`p-4 rounded-lg flex justify-between items-center font-bold border ${
                (data?.netProfit || 0) >= 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div>
                <span className="text-base">Net profit</span>
                <p className="text-xs font-normal text-slate-600">Net margin {netMargin}%</p>
              </div>
              <span className="text-2xl">{money(data?.netProfit)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
