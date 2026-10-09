import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

// HOORIYA ARTS chart palette (kept distinct enough to read without colour alone:
// each series also has its own line style / marker in the legend).
export const CHART_COLORS = {
  sales: '#8f2a58',      // mulberry
  profit: '#0f8a6a',     // deep green
  expenses: '#b8893b',   // antique gold
  netProfit: '#2a252a',  // ink
  returns: '#c2410c',    // burnt orange
  bills: '#2f6f9f'       // steel blue
};

const compact = (value) => {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(abs >= 10_000 ? 0 : 1).replace(/\.0$/, '')}k`;
  return `${n}`;
};

/** 'YYYY-MM-DD' -> '8 Oct'   |   'YYYY-MM' -> 'Oct 2026' */
export const formatPeriodLabel = (period, long = false) => {
  if (!period) return '';
  const parts = String(period).split('-').map(Number);
  if (parts.length === 2) {
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, 1));
    return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  }
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(long ? { weekday: 'short', year: 'numeric' } : {}),
    timeZone: 'UTC'
  });
};

function ChartTooltip({ active, payload, label, series, isMoney, labelFormatter }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-lg shadow-lift text-xs min-w-[160px]">
      <p className="text-slate-300 font-semibold mb-1.5">{labelFormatter(label)}</p>
      <div className="space-y-1">
        {payload.map((entry) => {
          const meta = series.find((s) => s.key === entry.dataKey);
          if (!meta) return null;
          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-200">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                {meta.label}
              </span>
              <span className="font-bold">
                {isMoney ? 'Rs. ' : ''}
                {Number(entry.value || 0).toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Reusable multi-series line chart.
 *
 * data     array of rows, one per x position
 * xKey     key holding the x value (a period string such as 2026-10-08)
 * series   [{ key, label, color, dashed? }]
 * isMoney  prefix tooltip values with "Rs." (false for counts such as bills)
 */
export default function TrendLineChart({
  data,
  xKey = 'period',
  series,
  isMoney = true,
  height = 288,
  emptyMessage = 'No activity in this period.'
}) {
  const [hidden, setHidden] = useState({});

  const visibleSeries = series.filter((s) => !hidden[s.key]);
  const hasData = useMemo(
    () => data.some((row) => series.some((s) => Number(row[s.key]) !== 0 && row[s.key] != null)),
    [data, series]
  );
  const showDots = data.length <= 16;

  const toggle = (key) => {
    // Never allow every line to be hidden
    if (!hidden[key] && visibleSeries.length === 1) return;
    setHidden((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div>
      {/* Legend doubles as show/hide toggles */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {series.map((s) => {
          const off = hidden[s.key];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggle(s.key)}
              aria-pressed={!off}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition-colors ${
                off
                  ? 'border-slate-200 text-slate-400 bg-white'
                  : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
              }`}
            >
              <svg width="18" height="8" aria-hidden="true">
                <line
                  x1="0"
                  y1="4"
                  x2="18"
                  y2="4"
                  stroke={off ? '#cbd5e1' : s.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={s.dashed ? '4 3' : undefined}
                />
              </svg>
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="relative w-full" style={{ height }}>
        {!hasData && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <p className="text-xs text-slate-400 bg-white/80 px-3 py-1.5 rounded-full">{emptyMessage}</p>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e1e4" vertical={false} />
            <XAxis
              dataKey={xKey}
              tickFormatter={(v) => formatPeriodLabel(v)}
              tick={{ fill: '#70676e', fontSize: 11 }}
              axisLine={{ stroke: '#d1cace' }}
              tickLine={false}
              minTickGap={18}
            />
            <YAxis
              tick={{ fill: '#70676e', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={compact}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ stroke: '#9d949b', strokeDasharray: '3 3' }}
              content={(props) => (
                <ChartTooltip
                  {...props}
                  series={series}
                  isMoney={isMoney}
                  labelFormatter={(l) => formatPeriodLabel(l, true)}
                />
              )}
            />
            {visibleSeries.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2.5}
                strokeDasharray={s.dashed ? '5 4' : undefined}
                dot={showDots ? { r: 3, strokeWidth: 2, fill: '#fff', stroke: s.color } : false}
                activeDot={{ r: 5, strokeWidth: 2, fill: s.color, stroke: '#fff' }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
