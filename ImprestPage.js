/* ===================================================
   ImprestPage.js — Imprest / Petty Cash Module
   Global Hillview Society Portal (Admin Only)

   Sheet columns (Google Sheet "Imprest"):
     Sr No | Date | Category | Particulars | Amount |
     Month | Received Advance | Submitted By | Notes

   After every add/edit → email sent via GAS to:
     globalhillview@gmail.com
     secretaryglobalhillview@gmail.com
     globalelectrical77@gmail.com
   =================================================== */

// ── Category definitions (from Excel) ─────────────────
const IMPREST_CATEGORIES = [
  'Office Maintenance',
  'Pantry',
  'Staff Welfare',
  'Others',
];

const IMPREST_MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// ── Normalize a raw GAS row ────────────────────────────
function normImprest(raw) {
  if (!raw) return null;
  const get = (...keys) => {
    for (const k of keys) {
      const v = raw[k];
      if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
  };
  const particulars = get('Particulars', 'particulars', 'Description', 'description');
  const amount      = Number(String(get('Amount', 'amount', 'Amt') || '0').replace(/[₹,\s]/g, '')) || 0;
  if (!particulars && !amount) return null;
  return {
    srNo:             get('Sr No', 'Sr. No.', 'Serial No', 'Sr.No.', 'SrNo'),
    date:             get('Date', 'date'),
    category:         get('Category', 'category', 'Head', 'Type'),
    particulars,
    amount,
    month:            get('Month', 'month'),
    receivedAdvance:  Number(String(get('Received Advance', 'ReceivedAdvance', 'Advance') || '0').replace(/[₹,\s]/g, '')) || 0,
    submittedBy:      get('Submitted By', 'SubmittedBy', 'Submitted by', 'Claimant'),
    notes:            get('Notes', 'notes', 'Remarks', 'Remark'),
  };
}

// ── Add / Edit Imprest Modal ──────────────────────────
function ImprestFormModal({ row, nextSr, currentMonth, onClose, onSave }) {
  const { useState } = React;
  const isEdit = !!row;

  const [form, setForm] = useState(row || {
    srNo:            String(nextSr),
    date:            new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' }).replace(/\//g,'-'),
    category:        IMPREST_CATEGORIES[0],
    particulars:     '',
    amount:          '',
    month:           currentMonth,
    receivedAdvance: '',
    submittedBy:     'Mr. Ashwani',
    notes:           '',
  });
  const [saving,     setSaving]     = useState(false);
  const [files,      setFiles]      = useState([]);   // selected File objects
  const [uploading,  setUploading]  = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Convert File → base64 data-url
  function readFile(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = () => res({ name: file.name, data: r.result });
      r.onerror = () => rej(new Error('Read failed'));
      r.readAsDataURL(file);
    });
  }

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSave = async () => {
    if (!form.date || !form.particulars || !form.amount) {
      showToast('Please fill Date, Particulars and Amount.', 'error'); return;
    }
    setSaving(true);
    try {
      let filePayload = [];
      if (files.length > 0) {
        setUploading(true);
        filePayload = await Promise.all(files.map(readFile));
        setUploading(false);
      }
      await onSave(
        { ...form, amount: parseFloat(String(form.amount).replace(/[₹,\s]/g,'')) || 0 },
        filePayload
      );
    } finally { setSaving(false); setUploading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="p-5 border-b border-gray-200 flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{isEdit ? 'Edit' : 'Add'} Imprest Entry</h3>
            <p className="text-xs text-gray-500">An email notification will be sent after saving</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {!isEdit && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">
              Auto Serial: <span className="font-bold">#{nextSr}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
              <input type="text" value={form.date} onChange={e => set('date', e.target.value)}
                placeholder="DD-MM-YYYY"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>

            {/* Month */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
              <select value={form.month} onChange={e => set('month', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                {IMPREST_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                {IMPREST_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₹) *</label>
              <input type="number" min="0" value={form.amount} onChange={e => set('amount', e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>

            {/* Particulars */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Particulars / Description *</label>
              <input type="text" value={form.particulars} onChange={e => set('particulars', e.target.value)}
                placeholder="e.g. Tea, Botel 3 pic, Tea Cup(6)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>

            {/* Received Advance */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Received Advance (₹)</label>
              <input type="number" min="0" value={form.receivedAdvance} onChange={e => set('receivedAdvance', e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>

            {/* Submitted By */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Submitted By</label>
              <input type="text" value={form.submittedBy} onChange={e => set('submittedBy', e.target.value)}
                placeholder="e.g. Mr. Ashwani"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes / Remarks</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                placeholder="Any additional notes…" rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>

            {/* Attachment */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Attachments (bills / receipts)</label>
              <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors">
                <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="text-sm text-gray-600">
                  {files.length > 0
                    ? files.map(f => f.name).join(', ')
                    : 'Click to attach files…'}
                </span>
                <input type="file" multiple className="hidden" onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
              </label>
              {files.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {files.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">
                      📎 {f.name}
                      <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                        className="ml-1 text-amber-500 hover:text-red-500 font-bold">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
            {(saving || uploading) && <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />}
            {uploading ? 'Uploading…' : saving ? 'Saving…' : isEdit ? 'Update Entry' : 'Add Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── View Detail Modal ─────────────────────────────────
function ImprestViewModal({ row, onClose }) {
  const fields = [
    ['Sr. No.',          row.srNo      || '-'],
    ['Date',             row.date      || '-'],
    ['Month',            row.month     || '-'],
    ['Category',         row.category  || '-'],
    ['Particulars',      row.particulars || '-'],
    ['Amount',           INR.format(Number(row.amount) || 0)],
    ['Received Advance', row.receivedAdvance ? INR.format(Number(row.receivedAdvance)) : '-'],
    ['Submitted By',     row.submittedBy || '-'],
    ['Notes',            row.notes     || '-'],
    ['Attachment',       row['Attachment'] || row.attachment || '-'],
  ];

  const catColor = {
    'Office Maintenance': 'bg-blue-100 text-blue-700',
    'Pantry':             'bg-green-100 text-green-700',
    'Staff Welfare':      'bg-purple-100 text-purple-700',
    'Others':             'bg-gray-100 text-gray-600',
  }[row.category] || 'bg-gray-100 text-gray-600';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        <div className="p-5 border-b border-gray-200 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">#{row.srNo} · {row.particulars?.slice(0, 32)}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColor}`}>{row.category}</span>
          </div>
        </div>
        <div className="p-5">
          <dl className="space-y-3">
            {fields.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-sm text-gray-500 flex-shrink-0">{label}</dt>
                <dd className={`text-sm font-medium text-right break-words max-w-xs ${label === 'Amount' ? 'text-amber-600 text-base' : 'text-gray-700'}`}>
                  {label === 'Attachment' && value !== '-'
                    ? value.split(',').map((url, i) => (
                        <a key={i} href={url.trim()} target="_blank" rel="noreferrer"
                          className="block text-blue-500 underline text-xs truncate max-w-xs">
                          📎 View attachment {value.split(',').length > 1 ? i + 1 : ''}
                        </a>
                      ))
                    : value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="p-4 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm">Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Category color helper ─────────────────────────────
function catBadge(category) {
  const cls = {
    'Office Maintenance': 'bg-blue-100 text-blue-700',
    'Pantry':             'bg-green-100 text-green-700',
    'Staff Welfare':      'bg-purple-100 text-purple-700',
    'Others':             'bg-gray-100 text-gray-600',
  }[category] || 'bg-gray-100 text-gray-600';
  return <span className={`status-badge ${cls}`}>{category || 'Uncategorised'}</span>;
}

// ── Analytics Bar ─────────────────────────────────────
function ImpBar({ label, value, max, color, formatted }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-44 truncate flex-shrink-0" title={label}>{label}</span>
      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.max((value / max) * 100, 2)}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-28 text-right flex-shrink-0">{formatted}</span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────
function ImprestPage({ gasData, onDataChange }) {
  const { useState, useMemo, useCallback } = React;

  const data = useMemo(() =>
    (gasData || []).map(normImprest).filter(Boolean),
    [gasData]
  );

  const currentMonth = IMPREST_MONTHS[new Date().getMonth()];

  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState('all');
  const [monthFilter,  setMonthFilter]  = useState('all');
  const [activeTab,    setActiveTab]    = useState('analytics');
  const [showAdd,      setShowAdd]      = useState(false);
  const [editRow,      setEditRow]      = useState(null);
  const [viewRow,      setViewRow]      = useState(null);
  const [saving,       setSaving]       = useState(false);

  // ── Summary stats ─────────────────────────────────
  const stats = useMemo(() => {
    const total    = data.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const advance  = data.length ? (Number(data[data.length - 1].receivedAdvance) || 0) : 0;
    const balance  = advance - total;
    const bycat    = {};
    IMPREST_CATEGORIES.forEach(c => { bycat[c] = 0; });
    data.forEach(r => { bycat[r.category] = (bycat[r.category] || 0) + (Number(r.amount) || 0); });
    return { count: data.length, total, advance, balance, bycat };
  }, [data]);

  // Unique months for filter
  const months = useMemo(() => {
    const m = Array.from(new Set(data.map(r => r.month).filter(Boolean))).sort();
    return ['all', ...m];
  }, [data]);

  // Filtered rows
  const filtered = useMemo(() => {
    let rows = data;
    if (catFilter   !== 'all') rows = rows.filter(r => r.category === catFilter);
    if (monthFilter !== 'all') rows = rows.filter(r => r.month    === monthFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        (r.particulars || '').toLowerCase().includes(q) ||
        (r.category    || '').toLowerCase().includes(q) ||
        (r.month       || '').toLowerCase().includes(q) ||
        (r.date        || '').includes(q)
      );
    }
    return rows;
  }, [data, catFilter, monthFilter, search]);

  const nextSr = useMemo(() => (data.length ? Math.max(...data.map(r => parseInt(r.srNo) || 0)) : 0) + 1, [data]);

  const catColors = {
    'Office Maintenance': '#3b82f6',
    'Pantry':             '#10b981',
    'Staff Welfare':      '#8b5cf6',
    'Others':             '#f59e0b',
  };

  // ── Refresh from GAS ──────────────────────────────
  async function fetchImprest() {
    setSaving(true);
    try {
      const res = await api.list.Imprest();
      onDataChange(res?.rows || []);
      showToast('Imprest refreshed from Google Sheet', 'success');
    } catch (e) {
      showToast('Could not refresh: ' + e.message, 'error');
    } finally { setSaving(false); }
  }

  // ── Map internal → exact sheet column names ────────
  function toSheetRow(r) {
    return {
      'Sr No':            r.srNo            || '',
      'Date':             r.date            || '',
      'Category':         r.category        || '',
      'Particulars':      r.particulars     || '',
      'Amount':           r.amount          || 0,
      'Month':            r.month           || '',
      'Received Advance': r.receivedAdvance || 0,
      'Submitted By':     r.submittedBy     || '',
      'Notes':            r.notes           || '',
    };
  }

  // ── Handlers ──────────────────────────────────────
  const handleAdd = useCallback(async (formData, filePayload) => {
    setSaving(true);
    try {
      await api.createRow('Imprest', toSheetRow(formData), filePayload || []);
      const res = await api.list.Imprest();
      onDataChange(res?.rows || []);
      showToast('Imprest entry added & email sent!', 'success');
      setShowAdd(false);
    } catch (e) {
      showToast('Failed to add: ' + e.message, 'error');
    } finally { setSaving(false); }
  }, [onDataChange]);

  const handleEdit = useCallback(async (formData, filePayload) => {
    setSaving(true);
    try {
      await api.upsertRow('Imprest', 'Sr No', toSheetRow(formData), filePayload || []);
      const res = await api.list.Imprest();
      onDataChange(res?.rows || []);
      showToast('Imprest entry updated & email sent!', 'success');
      setEditRow(null);
    } catch (e) {
      showToast('Failed to update: ' + e.message, 'error');
    } finally { setSaving(false); }
  }, [onDataChange]);

  if (!gasData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }} />
        <p className="text-sm text-gray-500">Loading imprest data from Google Sheet…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 fade-in">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Imprest / Petty Cash</h1>
          <p className="text-sm text-gray-500">{stats.count} entries · {INR.format(stats.total)} spent</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[['analytics', 'Analytics'], ['list', 'Expense Register']].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
              {label}
            </button>
          ))}
          <ExportButton data={filtered} filename="Imprest" />
          <button onClick={fetchImprest} disabled={saving} title="Refresh from Google Sheet"
            className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 p-2 rounded-lg transition-colors disabled:opacity-50">
            <svg className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button onClick={() => setShowAdd(true)} disabled={saving}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Entry
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Entries',       value: stats.count,             color: '#f59e0b', fmt: v => v },
          { label: 'Total Spent',         value: stats.total,             color: '#ef4444', fmt: INR.format },
          { label: 'Advance Received',    value: stats.advance,           color: '#3b82f6', fmt: INR.format },
          { label: 'Balance (Advance−Spend)', value: stats.balance,       color: stats.balance >= 0 ? '#10b981' : '#ef4444', fmt: v => INR.format(Math.abs(v)) + (v < 0 ? ' due' : ' left') },
        ].map(({ label, value, color, fmt }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-xl font-bold mt-1 truncate" style={{ color }}>{fmt(value)}</p>
          </div>
        ))}
      </div>

      {/* ── ANALYTICS TAB ── */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Category spend */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Spend by Category</h3>
              <div className="space-y-3">
                {IMPREST_CATEGORIES.map(cat => (
                  <ImpBar key={cat}
                    label={`${cat} (${data.filter(r => r.category === cat).length})`}
                    value={stats.bycat[cat] || 0}
                    max={Math.max(...Object.values(stats.bycat), 1)}
                    color={catColors[cat]}
                    formatted={INR.format(stats.bycat[cat] || 0)}
                  />
                ))}
              </div>
              {/* Donut */}
              <div className="mt-6 pt-5 border-t border-gray-100 flex items-center gap-6">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                    {(() => {
                      let offset = 0;
                      return IMPREST_CATEGORIES.map(cat => {
                        const pct = stats.total ? ((stats.bycat[cat] || 0) / stats.total) * 100 : 0;
                        const el = (
                          <circle key={cat} cx="18" cy="18" r="15.9" fill="none"
                            stroke={catColors[cat]} strokeWidth="3.8"
                            strokeDasharray={`${pct} ${100 - pct}`}
                            strokeDashoffset={-offset}
                            strokeLinecap="butt" />
                        );
                        offset += pct;
                        return el;
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-gray-700">{stats.count}</span>
                    <span className="text-xs text-gray-400">entries</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {IMPREST_CATEGORIES.map(cat => (
                    <div key={cat} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: catColors[cat] }} />
                      <span className="text-xs text-gray-600">{cat}</span>
                      <span className="text-xs font-semibold ml-auto" style={{ color: catColors[cat] }}>
                        {stats.total ? Math.round(((stats.bycat[cat] || 0) / stats.total) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Monthly summary */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Summary</h3>
              {(() => {
                const byMonth = {};
                data.forEach(r => {
                  const m = r.month || 'Unknown';
                  if (!byMonth[m]) byMonth[m] = { total: 0, count: 0 };
                  byMonth[m].total += Number(r.amount) || 0;
                  byMonth[m].count++;
                });
                const entries = Object.entries(byMonth).sort((a, b) => {
                  const mi = IMPREST_MONTHS.indexOf;
                  return (IMPREST_MONTHS.indexOf(a[0]) - IMPREST_MONTHS.indexOf(b[0])) || a[0].localeCompare(b[0]);
                });
                const maxVal = Math.max(...entries.map(([, v]) => v.total), 1);
                return entries.length ? (
                  <div className="space-y-2.5">
                    {entries.map(([month, { total, count }]) => (
                      <ImpBar key={month} label={`${month} (${count})`}
                        value={total} max={maxVal}
                        color="#f59e0b"
                        formatted={INR.format(total)} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-10">No data yet</p>
                );
              })()}

              {/* Advance vs Spend summary box */}
              <div className="mt-6 pt-5 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Received Advance</span>
                  <span className="font-semibold text-blue-600">{INR.format(stats.advance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Expenses</span>
                  <span className="font-semibold text-red-500">{INR.format(stats.total)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                  <span className="font-medium text-gray-700">Balance</span>
                  <span className={`font-bold text-base ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.balance >= 0 ? '' : '− '}{INR.format(Math.abs(stats.balance))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent entries */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Recent Entries</h3>
              <button onClick={() => setActiveTab('list')} className="text-xs text-amber-500 hover:text-amber-600 font-medium">View All →</button>
            </div>
            <div className="space-y-1">
              {data.slice(-8).reverse().map((row, i) => (
                <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{row.particulars}</p>
                    <p className="text-xs text-gray-400">{row.date} · {row.month}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-semibold text-gray-700">{INR.format(Number(row.amount) || 0)}</span>
                    {catBadge(row.category)}
                  </div>
                </div>
              ))}
              {data.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-8">No imprest entries yet. Click "Add Entry" to begin.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── EXPENSE REGISTER TAB ── */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-48">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search particulars, category, date…"
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="all">All Categories</option>
                {IMPREST_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {months.map(m => <option key={m} value={m}>{m === 'all' ? 'All Months' : m}</option>)}
              </select>
              {(catFilter !== 'all' || monthFilter !== 'all' || search) && (
                <button onClick={() => { setCatFilter('all'); setMonthFilter('all'); setSearch(''); }}
                  className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg border border-red-200">
                  Clear
                </button>
              )}
              <span className="text-sm text-gray-500 ml-auto">{filtered.length} records</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['#', 'Date', 'Month', 'Category', 'Particulars', 'Amount', 'Submitted By', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-400">{row.srNo}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{row.date}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{row.month}</td>
                    <td className="px-4 py-3">{catBadge(row.category)}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-800 max-w-xs truncate" title={row.particulars}>{row.particulars}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap">{INR.format(Number(row.amount) || 0)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{row.submittedBy || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setViewRow(row)} className="text-blue-500 hover:text-blue-600 text-xs font-medium">View</button>
                        <button onClick={() => setEditRow(row)} className="text-amber-500 hover:text-amber-600 text-xs font-medium">Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-500">{filtered.length} entries shown</span>
                <span className="text-sm font-semibold text-gray-800">
                  Total: {INR.format(filtered.reduce((s, r) => s + (Number(r.amount) || 0), 0))}
                </span>
              </div>
            )}

            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium">No imprest entries found</p>
                <p className="text-xs mt-1">Adjust filters or add a new entry.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showAdd   && <ImprestFormModal nextSr={nextSr} currentMonth={currentMonth} onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {editRow   && <ImprestFormModal row={editRow} nextSr={nextSr} currentMonth={currentMonth} onClose={() => setEditRow(null)} onSave={handleEdit} />}
      {viewRow   && <ImprestViewModal row={viewRow} onClose={() => setViewRow(null)} />}
    </div>
  );
}
