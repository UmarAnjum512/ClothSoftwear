import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Wallet, CheckCircle, AlertCircle, ArrowUpRight, ArrowDownRight, Clock, History, X } from 'lucide-react';

export default function CashRegister() {
  const { user, activeRegister, fetchActiveRegister } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Open Shift Form
  const [openingCash, setOpeningCash] = useState(5000);
  const [openNotes, setOpenNotes] = useState('');

  // Close Shift Form
  const [actualCash, setActualCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [activeRegister]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/register/history');
      if (res.data.success) {
        setShifts(res.data.shifts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShift = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/register/open', {
        openingCash: Number(openingCash),
        notes: openNotes
      });
      if (res.data.success) {
        alert('Shift opened successfully!');
        await fetchActiveRegister();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error opening shift');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseShift = async (e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to reconcile and close this register shift?')) return;
    setSubmitting(true);
    try {
      const res = await api.post('/register/close', {
        actualCash: Number(actualCash),
        notes: closeNotes
      });
      if (res.data.success) {
        const diff = res.data.summary.difference;
        const msg = diff === 0
          ? 'Drawer perfectly reconciled!'
          : diff < 0
          ? `Warning: Drawer Shortage of Rs. ${Math.abs(diff)}`
          : `Drawer Overage of Rs. ${diff}`;
        alert(`Shift closed. ${msg}`);
        setActualCash('');
        setCloseNotes('');
        await fetchActiveRegister();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error closing shift');
    } finally {
      setSubmitting(false);
    }
  };

  const live = activeRegister?.liveStats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Cash Register & Shift Reconciliation</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Track physical drawer cash movement, compare expected balance with actual counted cash, and log variances
        </p>
      </div>

      {/* ACTIVE SHIFT STATUS CARD */}
      {activeRegister ? (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Active Shift Open</span>
                <h2 className="text-base font-bold text-slate-800">{activeRegister.shiftNumber}</h2>
                <p className="text-xs text-slate-500">
                  Opened: {new Date(activeRegister.openedAt).toLocaleString()} • Cashier: <strong>{user?.name}</strong>
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Shift In Progress
            </span>
          </div>

          {/* Real-time cash movement grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Opening Drawer</span>
              <p className="text-lg font-bold text-slate-800 mt-1">Rs. {Number(live?.openingCash || 0).toLocaleString()}</p>
            </div>

            <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-emerald-700 font-bold uppercase">+ Cash Sales</span>
              <p className="text-lg font-bold text-emerald-700 mt-1">Rs. {Number(live?.cashSales || 0).toLocaleString()}</p>
            </div>

            <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-100">
              <span className="text-[10px] text-amber-700 font-bold uppercase">- Cash Refunds</span>
              <p className="text-lg font-bold text-amber-700 mt-1">Rs. {Number(live?.cashRefunds || 0).toLocaleString()}</p>
            </div>

            <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-100">
              <span className="text-[10px] text-rose-700 font-bold uppercase">- Cash Expenses</span>
              <p className="text-lg font-bold text-rose-700 mt-1">Rs. {Number(live?.cashExpenses || 0).toLocaleString()}</p>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-indigo-50 p-3.5 rounded-xl border border-indigo-200">
              <span className="text-[10px] text-indigo-700 font-bold uppercase">= Expected Cash</span>
              <p className="text-xl font-extrabold text-indigo-700 mt-1">Rs. {Number(live?.expectedCash || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Close Shift Reconciliation Form */}
          <form onSubmit={handleCloseShift} className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Close Shift & Count Cash</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Actual Physical Cash Counted (PKR)
                </label>
                <input
                  type="number"
                  required
                  placeholder="Enter drawer cash total..."
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Shift Handover Notes</label>
                <input
                  type="text"
                  placeholder="Optional notes or reason for shortage..."
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {actualCash !== '' && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span>Calculated Discrepancy:</span>
                <span className={`font-extrabold text-sm ${
                  Number(actualCash) - (live?.expectedCash || 0) < 0
                    ? 'text-rose-600'
                    : Number(actualCash) - (live?.expectedCash || 0) > 0
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}>
                  {Number(actualCash) - (live?.expectedCash || 0) === 0
                    ? 'Exact Match (Rs. 0)'
                    : Number(actualCash) - (live?.expectedCash || 0) < 0
                    ? `Shortage: - Rs. ${Math.abs(Number(actualCash) - (live?.expectedCash || 0))}`
                    : `Overage: + Rs. ${Number(actualCash) - (live?.expectedCash || 0)}`}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="py-3 px-6 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
            >
              {submitting ? 'Reconciling...' : 'Confirm Cash Count & End Shift'}
            </button>
          </form>
        </div>
      ) : (
        /* NO SHIFT OPEN - OPEN SHIFT CARD */
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm max-w-lg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">No Shift Open</h2>
              <p className="text-xs text-slate-500">Open a drawer register shift to begin POS billing transactions</p>
            </div>
          </div>

          <form onSubmit={handleOpenShift} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 uppercase mb-1">Starting Drawer Cash (PKR)</label>
              <input
                type="number"
                min="0"
                required
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 uppercase mb-1">Shift Notes</label>
              <input
                type="text"
                placeholder="Morning counter shift..."
                value={openNotes}
                onChange={(e) => setOpenNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
            >
              {submitting ? 'Opening...' : 'Start New Shift & Unlock POS'}
            </button>
          </form>
        </div>
      )}

      {/* SHIFTS RECONCILIATION HISTORY TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center space-x-2">
          <History className="w-4 h-4 text-indigo-600" />
          <h3 className="font-bold text-slate-800 text-sm">Shift Reconciliation Records</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase">
                <th className="py-3 px-4">Shift #</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4">Opened / Closed</th>
                <th className="py-3 px-4 text-right">Opening Cash</th>
                <th className="py-3 px-4 text-right">Expected</th>
                <th className="py-3 px-4 text-right">Counted Actual</th>
                <th className="py-3 px-4 text-center">Difference</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-400">Loading shift logs...</td>
                </tr>
              ) : shifts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-400">No shift records found.</td>
                </tr>
              ) : (
                shifts.map(sh => (
                  <tr key={sh._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{sh.shiftNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{sh.userId?.name}</td>
                    <td className="py-3 px-4 text-slate-500">
                      <div>Open: {new Date(sh.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      {sh.closedAt && (
                        <div className="text-[10px] text-slate-400">
                          Close: {new Date(sh.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">Rs. {sh.openingCash}</td>
                    <td className="py-3 px-4 text-right">Rs. {sh.expectedCash}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800">
                      {sh.status === 'Closed' ? `Rs. ${sh.actualCash}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {sh.status === 'Closed' ? (
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          sh.difference === 0
                            ? 'bg-emerald-50 text-emerald-700'
                            : sh.difference < 0
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {sh.difference === 0 ? 'Match (0)' : sh.difference < 0 ? `Short (${sh.difference})` : `Over (+${sh.difference})`}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        sh.status === 'Open' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {sh.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
