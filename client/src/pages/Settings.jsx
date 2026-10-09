import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Shield, Download, CheckCircle, Clock, Server, FileText } from 'lucide-react';

export default function Settings() {
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('store'); // 'store', 'audit', 'backup'

  const [settings, setSettings] = useState({
    storeName: '',
    storePhone: '',
    storeEmail: '',
    storeAddress: '',
    currency: 'PKR',
    currencySymbol: 'Rs.',
    taxRate: 0,
    receiptFooterNote: '',
    lowStockDefaultThreshold: 5
  });

  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data.success) {
        setSettings(res.data.settings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/settings/audit-logs');
      if (res.data.success) {
        setAuditLogs(res.data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/settings', settings);
      alert('Store settings saved successfully!');
    } catch (err) {
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const res = await api.get('/settings/backup/export');
      if (res.data.success) {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data.data, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `hooriya_arts_backup_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      }
    } catch (err) {
      alert('Failed to generate backup export');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">System Settings & Data Audit</h1>
        <p className="text-xs text-slate-500 mt-0.5">Configure store identity, receipts, database backups and review audit activity</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-slate-200/90 shadow-xs max-w-md text-xs font-bold">
        <button
          onClick={() => setActiveTab('store')}
          className={`flex-1 py-2 rounded-xl transition-colors ${activeTab === 'store' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Store Identity & Receipt
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 py-2 rounded-xl transition-colors ${activeTab === 'audit' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
        >
          System Audit Logs
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`flex-1 py-2 rounded-xl transition-colors ${activeTab === 'backup' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Backup & Export
        </button>
      </div>

      {/* TAB 1: Store Settings Form */}
      {activeTab === 'store' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-2xl">
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <h3 className="font-bold text-slate-800 text-sm">Retail Store Identity</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Store Name</label>
                <input
                  type="text"
                  required
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={settings.storePhone}
                  onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Official Email</label>
                <input
                  type="email"
                  value={settings.storeEmail}
                  onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 uppercase mb-1">Currency Code & Symbol</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                  <input
                    type="text"
                    value={settings.currencySymbol}
                    onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                    className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 uppercase mb-1">Physical Store Address</label>
              <input
                type="text"
                value={settings.storeAddress}
                onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm mb-3">POS & Receipt Policy</h3>
              <label className="block font-semibold text-slate-600 uppercase mb-1">Invoice Receipt Footer Note</label>
              <textarea
                rows="2"
                value={settings.receiptFooterNote}
                onChange={(e) => setSettings({ ...settings, receiptFooterNote: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            {hasRole('Super Admin') && (
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 2: System Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Security & Activity Audit Trail</h3>
            <span className="text-xs text-slate-400">Total {auditLogs.length} events logged</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold uppercase">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-400">No audit logs recorded yet.</td>
                  </tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log._id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-800">
                        {log.userName} <span className="text-[10px] text-slate-400">({log.userRole})</span>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-indigo-600">{log.action}</td>
                      <td className="py-2.5 px-4 text-slate-600">{log.entity}</td>
                      <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px] truncate max-w-xs">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Backup & Export */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-xl space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Database Backup & Archive</h3>
              <p className="text-xs text-slate-500">Download a full JSON dump of your store catalog, customers, sales and inventory</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-2">
            <p>Export contains:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Apparel products & variant SKUs/barcodes</li>
              <li>Customers and supplier accounts ledger</li>
              <li>Complete sales invoices & receipts history</li>
              <li>Stock movements & adjustments history</li>
              <li>Store settings & expenses</li>
            </ul>
          </div>

          {hasRole('Super Admin') ? (
            <button
              onClick={handleExportBackup}
              className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Full JSON Database Dump</span>
            </button>
          ) : (
            <p className="text-xs text-rose-600 font-semibold">Only Super Admin / Owner can generate database backups.</p>
          )}
        </div>
      )}
    </div>
  );
}
