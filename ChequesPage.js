/* ===================================================
   ChequesPage.js — Cheques Module (Admin Only)
   Data source: Google Sheets "Cheques" tab via GAS
   State is owned by App.js — no re-fetch on nav.
   =================================================== */

// ── Normalise a raw GAS/Excel row into internal shape ─
// Handles all column header variants (mixed case, spaces, etc.)
function normCheque(raw) {
  if (!raw) return null;
  // Helper: try multiple key variants
  const get = (...keys) => {
    for (const k of keys) {
      const v = raw[k];
      if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
  };

  const remarks = get('REMARKS', 'Remarks', 'remarks', 'Status', 'status');
  const party   = get('PARTY',   'Party',   'party', 'Vendor', 'Payee');

  if (!party) return null; // skip blank rows

  return {
    sr:        get('SR.NO.', 'SR NO', 'Sr.No.', 'sr', 'Serial', 'No'),
    date:      get('DATE', 'Date', 'date'),
    party,
    purpose:   get('PURPOSE', 'Purpose', 'purpose', 'Description', 'Narration'),
    amount:    Number(String(get('AMOUNT', 'Amount', 'amount') || '0').replace(/[₹,\s]/g, '')) || 0,
    billDate:  get('BILL DATE', 'Bill Date', 'billDate', 'Bill Dt'),
    invoiceNo: get('INVOICE NO.', 'Invoice No.', 'Invoice No', 'invoiceNo', 'Invoice', 'Bill No'),
    chequeNo:  String(get('CHEQUE NO.', 'Cheque No.', 'Cheque No', 'chequeNo', 'Chq No', 'Check No')).replace(/\.0$/, ''),
    remarks:   remarks,
    clearedOn: get('CLEARED ON', 'Cleared on', 'Cleared On', 'clearedOn', 'Clear Date'),
  };
}

// Determine display status for a cheque
// GAS sheet uses: Paid, Cancel, blank (new/pending)
function chequeStatus(row) {
  const r = (row.remarks || '').trim();
  if (r === 'Paid')   return 'Paid';
  if (r === 'Cancel') return 'Cancel';
  return 'Unpaid'; // blank or anything else = unpaid/pending
}

// ── Bulk Upload Modal ─────────────────────────────────
function ChequesBulkUploadModal({ onClose, onImport }) {
  const { useState } = React;
  const [file,       setFile]       = useState(null);
  const [preview,    setPreview]    = useState([]);
  const [mode,       setMode]       = useState('replace');
  const [error,      setError]      = useState('');
  const [processing, setProcessing] = useState(false);

  const FIELD_MAP = {
    sr:        ['sr.no.','sr no','sr','no','serial'],
    date:      ['date'],
    party:     ['party','party name','vendor','payee'],
    purpose:   ['purpose','description','narration','particulars'],
    amount:    ['amount','amt','value'],
    billDate:  ['bill date','bill dt','invoice date'],
    invoiceNo: ['invoice no.','invoice no','invoice','bill no','bill no.'],
    chequeNo:  ['cheque no.','cheque no','cheque','chq no','check no'],
    remarks:   ['remarks','status','remark'],
    clearedOn: ['cleared on','clear date','clearing date','cleared on'],
  };

  function detectMapping(cols) {
    const mapping = {};
    const lc = cols.map(c => c.toLowerCase().trim());
    for (const [field, aliases] of Object.entries(FIELD_MAP)) {
      const idx = lc.findIndex(c => aliases.includes(c));
      if (idx !== -1) mapping[field] = cols[idx];
    }
    return mapping;
  }

  function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) throw new Error('File appears empty.');
    const parseRow = line => {
      const res = []; let cur = ''; let inQ = false;
      for (const ch of line) {
        if (ch === '"') inQ = !inQ;
        else if (ch === ',' && !inQ) { res.push(cur.trim()); cur = ''; }
        else cur += ch;
      }
      res.push(cur.trim());
      return res;
    };
    return { headers: parseRow(lines[0]), rows: lines.slice(1).map(parseRow).filter(r => r.some(c => c)) };
  }

  function rowsToObjects(headers, rows, mapping) {
    return rows.map((row, i) => {
      const obj = { sr: String(i + 1) };
      for (const [field, colName] of Object.entries(mapping)) {
        const idx = headers.indexOf(colName);
        obj[field] = idx !== -1 ? (row[idx] || '').trim() : '';
      }
      const num = parseFloat(String(obj.amount || '0').replace(/[₹,\s]/g, ''));
      obj.amount = isNaN(num) ? 0 : num;
      if (obj.chequeNo) {
        const n = parseFloat(obj.chequeNo);
        if (!isNaN(n)) obj.chequeNo = String(Math.round(n));
      }
      return obj;
    }).filter(o => o.party || o.date);
  }

  async function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setError(''); setProcessing(true);
    try {
      const ext = f.name.split('.').pop().toLowerCase();
      let hdrs, rawRows;
      if (ext === 'csv') {
        const { headers, rows } = parseCSV(await f.text());
        hdrs = headers; rawRows = rows;
      } else if (ext === 'xlsx' || ext === 'xls') {
        if (typeof XLSX === 'undefined') throw new Error('Excel library not loaded.');
        const buf  = await f.arrayBuffer();
        const wb   = XLSX.read(buf, { type: 'array', cellDates: false });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
        if (data.length < 2) throw new Error('Sheet appears empty.');
        hdrs    = data[0].map(String);
        rawRows = data.slice(1).map(r => r.map(v => String(v ?? '').trim()));
      } else {
        throw new Error('Unsupported file. Please upload .csv, .xlsx or .xls');
      }
      const mapping = detectMapping(hdrs);
      const objects = rowsToObjects(hdrs, rawRows, mapping);
      if (!objects.length) throw new Error('No valid rows found after parsing.');
      setPreview(objects.slice(0, 5));
      setFile({ name: f.name, _parsed: objects });
      setProcessing(false);
    } catch (err) { setError(err.message); setProcessing(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth:'680px'}}>
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Bulk Import Cheques</h3>
          <p className="text-sm text-gray-500 mt-0.5">Upload your billing Excel/CSV — data saves to Google Sheet.</p>
        </div>
        <div className="p-5 space-y-5">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 space-y-1">
            <p className="font-semibold">Expected columns (any order, any case):</p>
            <p className="font-mono">SR.NO. · DATE · PARTY · PURPOSE · AMOUNT · BILL DATE · INVOICE NO. · CHEQUE NO. · REMARKS · CLEARED ON</p>
            <p className="text-blue-600 mt-1">Column names auto-detected. Accepts "Paid", "Cancel", or blank for REMARKS.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFile}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
          </div>
          {processing && (
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="spinner" style={{width:'18px',height:'18px',borderWidth:'2px'}} /> Parsing file…
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {error}
            </div>
          )}
          {preview.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Preview — <strong>{file._parsed?.length}</strong> rows detected</p>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Date','Party','Purpose','Amount','Cheque No.','Status'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preview.map((row, i) => (
                      <tr key={i}>
                        <td className="px-3 py-1.5 whitespace-nowrap">{row.date}</td>
                        <td className="px-3 py-1.5 max-w-xs truncate">{row.party}</td>
                        <td className="px-3 py-1.5 max-w-xs truncate">{row.purpose}</td>
                        <td className="px-3 py-1.5 font-medium text-gray-800 whitespace-nowrap">{INR.format(row.amount)}</td>
                        <td className="px-3 py-1.5">{row.chequeNo}</td>
                        <td className="px-3 py-1.5">
                          <span className={`status-badge text-xs ${
                            chequeStatus(row) === 'Paid'   ? 'bg-green-100 text-green-700' :
                            chequeStatus(row) === 'Cancel' ? 'bg-gray-100 text-gray-600' :
                            'bg-orange-100 text-orange-700'
                          }`}>{row.remarks || 'Unpaid'}</span>
                        </td>
                      </tr>
                    ))}
                    {file._parsed?.length > 5 && (
                      <tr><td colSpan={6} className="px-3 py-2 text-gray-400 text-center">…and {file._parsed.length - 5} more rows</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {preview.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Import Mode</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { val: 'replace', title: 'Replace All',    desc: 'Clear the sheet and write only the imported rows.' },
                  { val: 'merge',   title: 'Merge / Append', desc: 'Keep existing rows; add new cheque numbers.' },
                ].map(({ val, title, desc }) => (
                  <label key={val} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${mode === val ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="mode" value={val} checked={mode === val} onChange={() => setMode(val)} className="mt-0.5 accent-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={() => { if (file?._parsed) { onImport(file._parsed, mode); onClose(); } }}
            disabled={!preview.length}
            className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            Import {preview.length > 0 ? file._parsed?.length + ' Records' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add / Edit Cheque Modal ───────────────────────────
function ChequeFormModal({ row, nextSr, onClose, onSave }) {
  const { useState } = React;
  const isEdit = !!row;
  const [form, setForm] = useState(row || {
    sr: String(nextSr), date: '', party: '', purpose: '',
    amount: '', billDate: '', invoiceNo: '', chequeNo: '',
    remarks: 'Unpaid', clearedOn: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth:'620px'}}>
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{isEdit ? 'Edit' : 'Add'} Cheque</h3>
        </div>
        <div className="p-5 space-y-4">
          {!isEdit && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-800">
              Auto Serial: <span className="font-bold">#{nextSr}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cheque Date *</label>
              <input type="text" value={form.date} onChange={e => set('date', e.target.value)}
                placeholder="DD-MM-YYYY" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cheque No. *</label>
              <input type="text" value={form.chequeNo} onChange={e => set('chequeNo', e.target.value)}
                placeholder="e.g. 680" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Party / Payee *</label>
              <input type="text" value={form.party} onChange={e => set('party', e.target.value)}
                placeholder="Vendor / company name" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Purpose *</label>
              <input type="text" value={form.purpose} onChange={e => set('purpose', e.target.value)}
                placeholder="Description of payment" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₹) *</label>
              <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
                placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select value={form.remarks} onChange={e => { set('remarks', e.target.value); if (e.target.value !== 'Paid') set('clearedOn', ''); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
                <option value="Cancel">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Bill Date</label>
              <input type="text" value={form.billDate} onChange={e => set('billDate', e.target.value)}
                placeholder="DD-MM-YYYY" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Invoice No.</label>
              <input type="text" value={form.invoiceNo} onChange={e => set('invoiceNo', e.target.value)}
                placeholder="Invoice / bill number" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Cleared On</label>
              <input type="text" value={form.clearedOn} onChange={e => set('clearedOn', e.target.value)}
                placeholder="DD-MM-YYYY"
                disabled={form.remarks !== 'Paid'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-400" />
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button
            onClick={async () => {
              if (!form.date || !form.party || !form.chequeNo || !form.amount) {
                showToast('Please fill Date, Party, Cheque No. and Amount.', 'error'); return;
              }
              setSaving(true);
              try { await onSave({ ...form, amount: parseFloat(form.amount) || 0 }); }
              finally { setSaving(false); }
            }}
            disabled={saving}
            className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
            {saving && <div className="spinner" style={{width:'14px',height:'14px',borderWidth:'2px'}} />}
            {saving ? 'Saving…' : isEdit ? 'Update' : 'Add Cheque'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── View Detail Modal ─────────────────────────────────
function ChequeViewModal({ row, onClose }) {
  const fields = [
    ['SR. No.',    row.sr],
    ['Date',       row.date],
    ['Party',      row.party],
    ['Purpose',    row.purpose],
    ['Amount',     INR.format(Number(row.amount) || 0)],
    ['Bill Date',  row.billDate || '-'],
    ['Invoice No.',row.invoiceNo || '-'],
    ['Cheque No.', row.chequeNo],
    ['Status',     row.remarks || '-'],
    ['Cleared On', row.clearedOn || '-'],
  ];
  const status = chequeStatus(row);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth:'460px'}}>
        <div className="p-5 border-b border-gray-200 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status === 'Paid' ? 'bg-green-100' : status === 'Cancel' ? 'bg-gray-100' : 'bg-orange-100'}`}>
            <svg className={`w-5 h-5 ${status === 'Paid' ? 'text-green-600' : status === 'Cancel' ? 'text-gray-500' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Cheque #{row.chequeNo}</h3>
            <p className="text-xs text-gray-500">{row.party}</p>
          </div>
        </div>
        <div className="p-5">
          <dl className="space-y-3">
            {fields.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-sm text-gray-500">{label}</dt>
                <dd className={`text-sm font-medium text-right ${
                  value === 'Paid'   ? 'text-green-600' :
                  value === 'Cancel' ? 'text-gray-500' :
                  value === 'Unpaid' ? 'text-orange-600' :
                  label === 'Amount' ? 'text-gray-900 text-base' : 'text-gray-700'
                }`}>{value}</dd>
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

// ── Analytics bar helper ──────────────────────────────
function ChqBar({ label, value, max, color, formatted }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-40 truncate flex-shrink-0" title={label}>{label}</span>
      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{width:`${Math.max((value/max)*100,2)}%`, background:color}} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-28 text-right flex-shrink-0">{formatted}</span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────
// gasData: rows from GAS (owned by App.js, survives navigation)
// onDataChange: callback to update App.js state after import/add/edit
function ChequesPage({ gasData, onDataChange }) {
  const { useState, useMemo, useCallback, useEffect } = React;

  // Local display data = normalised gasData
  const data = useMemo(() => {
    return (gasData || []).map(normCheque).filter(Boolean);
  }, [gasData]);

  const [search,          setSearch]          = useState('');
  const [statusFilter,    setStatusFilter]    = useState('all');
  const [partyFilter,     setPartyFilter]     = useState('all');
  const [activeTab,       setActiveTab]       = useState('analytics');
  const [showAddModal,    setShowAddModal]    = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewRow,         setViewRow]         = useState(null);
  const [editRow,         setEditRow]         = useState(null);
  const [saving,          setSaving]          = useState(false);

  // ── Stats — counts by actual status ──────────────
  const stats = useMemo(() => {
    const paid     = data.filter(r => chequeStatus(r) === 'Paid');
    const unpaid   = data.filter(r => chequeStatus(r) === 'Unpaid');
    const cancelled= data.filter(r => chequeStatus(r) === 'Cancel');
    const totalAmt = data.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    return {
      total: data.length,
      paid: paid.length, unpaid: unpaid.length, cancelled: cancelled.length,
      totalAmt,
      paidAmt:   paid.reduce((s,r) => s+(Number(r.amount)||0), 0),
      unpaidAmt: unpaid.reduce((s,r) => s+(Number(r.amount)||0), 0),
    };
  }, [data]);

  const partyStats = useMemo(() => {
    const map = {};
    data.forEach(r => {
      if (chequeStatus(r) === 'Cancel') return; // exclude cancelled from party totals
      const p = (r.party || 'Unknown').trim();
      if (!map[p]) map[p] = { count: 0, total: 0 };
      map[p].count++; map[p].total += Number(r.amount) || 0;
    });
    return Object.entries(map).map(([party,{count,total}])=>({party,count,total})).sort((a,b)=>b.total-a.total);
  }, [data]);

  const purposeStats = useMemo(() => {
    const map = {};
    data.forEach(r => {
      if (chequeStatus(r) === 'Cancel') return;
      const p = (r.purpose || 'Unknown').trim().slice(0, 45);
      if (!map[p]) map[p] = { count: 0, total: 0 };
      map[p].count++; map[p].total += Number(r.amount) || 0;
    });
    return Object.entries(map).map(([purpose,{count,total}])=>({purpose,count,total})).sort((a,b)=>b.total-a.total).slice(0,10);
  }, [data]);

  const partyOptions = useMemo(() => ['all', ...Array.from(new Set(data.map(r => r.party || ''))).filter(Boolean).sort()], [data]);

  const filtered = useMemo(() => {
    let rows = data;
    if (statusFilter === 'Paid')    rows = rows.filter(r => chequeStatus(r) === 'Paid');
    if (statusFilter === 'Unpaid')  rows = rows.filter(r => chequeStatus(r) === 'Unpaid');
    if (statusFilter === 'Cancel')  rows = rows.filter(r => chequeStatus(r) === 'Cancel');
    if (partyFilter !== 'all') rows = rows.filter(r => r.party === partyFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        (r.party||'').toLowerCase().includes(q) || (r.purpose||'').toLowerCase().includes(q) ||
        (r.chequeNo||'').includes(q) || (r.invoiceNo||'').toLowerCase().includes(q) || (r.date||'').includes(q)
      );
    }
    return rows;
  }, [data, statusFilter, partyFilter, search]);

  const nextSr = useMemo(() => (data.length ? Math.max(...data.map(r=>parseInt(r.sr)||0)) : 0) + 1, [data]);

  // ── Refresh from GAS ──────────────────────────────
  async function fetchCheques() {
    setSaving(true);
    try {
      const res = await api.list.Cheques();
      const rows = res?.rows || [];
      onDataChange(rows); // update App.js state — survives navigation
      showToast('Cheques refreshed from Google Sheet', 'success');
    } catch (e) {
      showToast('Could not refresh: ' + e.message, 'error');
    } finally { setSaving(false); }
  }

  // ── Convert internal camelCase row → exact sheet column names ──
  // GAS upsertRow_/createRow_ maps by header name, so keys MUST match the sheet.
  function toSheetRow(r) {
    return {
      'SR.NO.':      r.sr        || '',
      'DATE':        r.date      || '',
      'PARTY':       r.party     || '',
      'PURPOSE':     r.purpose   || '',
      'AMOUNT':      r.amount    || 0,
      'BILL DATE':   r.billDate  || '',
      'INVOICE NO.': r.invoiceNo || '',
      'CHEQUE NO.':  r.chequeNo  || '',
      'REMARKS':     r.remarks   || '',
      'CLEARED ON':  r.clearedOn || '',
    };
  }

  // ── Handlers ──────────────────────────────────────
  const handleAdd = useCallback(async (formData) => {
    setSaving(true);
    try {
      await api.createRow('Cheques', toSheetRow(formData));
      const res = await api.list.Cheques();
      onDataChange(res?.rows || []);
      showToast('Cheque added to Google Sheet', 'success');
      setShowAddModal(false);
    } catch (e) {
      showToast('Failed to add: ' + e.message, 'error');
    } finally { setSaving(false); }
  }, [onDataChange]);

  const handleEdit = useCallback(async (formData) => {
    setSaving(true);
    try {
      // Key must be the exact sheet column header — 'CHEQUE NO.'
      await api.upsertRow('Cheques', 'CHEQUE NO.', toSheetRow(formData));
      const res = await api.list.Cheques();
      onDataChange(res?.rows || []);
      showToast('Cheque updated in Google Sheet', 'success');
      setEditRow(null);
    } catch (e) {
      showToast('Failed to update: ' + e.message, 'error');
    } finally { setSaving(false); }
  }, [onDataChange]);

  const handleBulkImport = useCallback(async (rows, mode) => {
    setSaving(true);
    try {
      if (mode === 'replace') {
        // Clear then write all rows
        try { await postPlain({ op: 'clearSheet', sheet: 'Cheques' }); } catch {}
      }
      const existing = new Set((gasData || []).map(r => {
        const n = normCheque(r);
        return n ? n.chequeNo : null;
      }).filter(Boolean));
      const toWrite = mode === 'replace' ? rows : rows.filter(r => !existing.has(r.chequeNo));

      // Map back to sheet column names for GAS
      const sheetRows = toWrite.map(r => ({
        'SR.NO.':      r.sr,
        'DATE':        r.date,
        'PARTY':       r.party,
        'PURPOSE':     r.purpose,
        'AMOUNT':      r.amount,
        'BILL DATE':   r.billDate,
        'INVOICE NO.': r.invoiceNo,
        'CHEQUE NO.':  r.chequeNo,
        'REMARKS':     r.remarks,
        'CLEARED ON':  r.clearedOn,
      }));

      // Batch write in groups of 20
      const BATCH = 20;
      for (let i = 0; i < sheetRows.length; i += BATCH) {
        await Promise.all(sheetRows.slice(i, i + BATCH).map(r => api.createRow('Cheques', r).catch(() => {})));
      }

      // Re-fetch from GAS to confirm
      const res = await api.list.Cheques();
      onDataChange(res?.rows || []);
      showToast(`Imported ${toWrite.length} rows to Google Sheet`, 'success');
    } catch (e) {
      showToast('Import failed: ' + e.message, 'error');
    } finally { setSaving(false); }
  }, [gasData, onDataChange]);

  const palette = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#ec4899','#84cc16','#f97316','#14b8a6'];

  const statusBadge = (row) => {
    const s = chequeStatus(row);
    const cls = s === 'Paid'   ? 'bg-green-100 text-green-700' :
                s === 'Cancel' ? 'bg-gray-100 text-gray-500' :
                'bg-orange-100 text-orange-700';
    return <span className={`status-badge ${cls}`}>{row.remarks || 'Unpaid'}</span>;
  };

  // Show spinner if no data yet and first load
  if (!gasData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="spinner" style={{width:'36px',height:'36px',borderWidth:'3px'}} />
        <p className="text-sm text-gray-500">Loading cheques from Google Sheet…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Cheques</h1>
          <p className="text-sm text-gray-500">{stats.total} cheques · {INR.format(stats.totalAmt)} total</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[['analytics','Analytics'],['list','Cheque Register']].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab===tab ? 'bg-blue-500 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
              {label}
            </button>
          ))}
          <ExportButton data={filtered} filename="Cheques" />
          <button onClick={fetchCheques} disabled={saving} title="Refresh from Google Sheet"
            className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 p-2 rounded-lg transition-colors disabled:opacity-50">
            <svg className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
          <button onClick={() => setShowUploadModal(true)} disabled={saving}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            Import CSV / Excel
          </button>
          <button onClick={() => setShowAddModal(true)} disabled={saving}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Cheque
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {label:'Total Cheques', display:stats.total,                 color:'#3b82f6', filter:null},
          {label:'Paid',          display:stats.paid,                  color:'#10b981', filter:'Paid'},
          {label:'Unpaid',        display:stats.unpaid,                color:'#ef4444', filter:'Unpaid'},
          {label:'Cancelled',     display:stats.cancelled,             color:'#9ca3af', filter:'Cancel'},
          {label:'Total Amount',  display:INR.format(stats.totalAmt),  color:'#8b5cf6', filter:null},
          {label:'Unpaid Amount', display:INR.format(stats.unpaidAmt), color:'#ef4444', filter:null},
        ].map(({label, display, color, filter}) => {
          const active = filter && statusFilter === filter;
          return (
            <div key={label}
              onClick={filter ? () => { setActiveTab('list'); setStatusFilter(statusFilter===filter?'all':filter); } : undefined}
              className={`bg-white rounded-xl p-4 shadow-sm transition-all ${filter?'cursor-pointer hover:shadow-md':''}`}
              style={active ? {outline:`2px solid ${color}`} : {}}>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-xl font-bold mt-1 truncate" style={{color}}>{display}</p>
              {active && <div className="mt-1.5 h-0.5 rounded" style={{background:color}} />}
            </div>
          );
        })}
      </div>

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Payment Status */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-5">Payment Status Overview</h3>
              <div className="space-y-4">
                {[
                  {label:`Paid (${stats.paid})`,      amt:stats.paidAmt,   color:'#10b981'},
                  {label:`Unpaid (${stats.unpaid})`,  amt:stats.unpaidAmt, color:'#f97316'},
                  {label:`Cancelled (${stats.cancelled})`, amt:0,           color:'#9ca3af'},
                ].map(({label,amt,color}) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium" style={{color}}>{label}</span>
                      {amt > 0 && <span className="text-gray-500">{INR.format(amt)}</span>}
                    </div>
                    <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full flex items-center justify-end pr-2"
                        style={{
                          width: `${stats.total ? (label.startsWith('Paid') ? (stats.paid/stats.total)*100 : label.startsWith('Unpaid') ? (stats.unpaid/stats.total)*100 : (stats.cancelled/stats.total)*100) : 0}%`,
                          background: color
                        }}>
                        <span className="text-white text-xs font-medium">
                          {stats.total ? Math.round((label.startsWith('Paid') ? stats.paid : label.startsWith('Unpaid') ? stats.unpaid : stats.cancelled) / stats.total * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-4 font-medium">Cheque Clearance Rate</p>
                <div className="flex items-center gap-5">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3.8" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3.8"
                        strokeDasharray={`${stats.total?(stats.paid/stats.total)*100:0} 100`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-gray-800">{stats.total?Math.round((stats.paid/stats.total)*100):0}%</span>
                      <span className="text-xs text-gray-400">cleared</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[['Paid / Cleared','#10b981',stats.paid],['Unpaid / Pending','#f97316',stats.unpaid],['Cancelled','#9ca3af',stats.cancelled]].map(([l,c,v])=>(
                      <div key={l} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{background:c}} />
                        <span className="text-xs text-gray-600">{l}</span>
                        <span className="text-sm font-bold ml-3" style={{color:c}}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Top parties */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Parties by Amount</h3>
              <div className="space-y-2.5">
                {partyStats.slice(0,8).map(({party,total,count},i)=>(
                  <ChqBar key={party} label={party} value={total} max={partyStats[0]?.total||1}
                    color={palette[i%palette.length]} formatted={`${INR.format(total)} · ${count}`} />
                ))}
                {partyStats.length===0 && <p className="text-xs text-gray-400 text-center py-6">No data in Google Sheet yet</p>}
              </div>
            </div>
          </div>

          {/* Purpose + Recent */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Purpose-wise Spend (Top 10)</h3>
              <div className="space-y-2.5">
                {purposeStats.map(({purpose,total},i)=>(
                  <ChqBar key={purpose} label={purpose} value={total} max={purposeStats[0]?.total||1}
                    color={palette[i%palette.length]} formatted={INR.format(total)} />
                ))}
                {purposeStats.length===0 && <p className="text-xs text-gray-400 text-center py-6">No data yet</p>}
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Recent Cheques</h3>
                <button onClick={() => setActiveTab('list')} className="text-xs text-blue-500 hover:text-blue-600 font-medium">View All →</button>
              </div>
              <div className="space-y-1">
                {data.slice(0,8).map((row,i)=>(
                  <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{row.party}</p>
                      <p className="text-xs text-gray-400 truncate">{row.purpose} · #{row.chequeNo}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-semibold text-gray-700">{INR.format(Number(row.amount)||0)}</span>
                      {statusBadge(row)}
                    </div>
                  </div>
                ))}
                {data.length===0 && (
                  <div className="text-center py-8">
                    <p className="text-xs text-gray-400">No data in the Google Sheet yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Add a row in the sheet or use Import.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHEQUE REGISTER TAB */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-48">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search party, purpose, cheque no…"
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="all">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid / Pending</option>
                <option value="Cancel">Cancelled</option>
              </select>
              <select value={partyFilter} onChange={e=>setPartyFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm max-w-48">
                {partyOptions.map(p=><option key={p} value={p}>{p==='all'?'All Parties':p}</option>)}
              </select>
              {(statusFilter!=='all'||partyFilter!=='all'||search) && (
                <button onClick={()=>{setStatusFilter('all');setPartyFilter('all');setSearch('');}}
                  className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg border border-red-200">Clear</button>
              )}
              <span className="text-sm text-gray-500 ml-auto">{filtered.length} records</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['#','Date','Party','Purpose','Amount','Cheque No.','Invoice No.','Status','Cleared On','Actions'].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((row,i)=>(
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-400">{row.sr}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{row.date}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800 max-w-[160px] truncate" title={row.party}>{row.party}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 max-w-xs truncate" title={row.purpose}>{row.purpose}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap">{INR.format(Number(row.amount)||0)}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{row.chequeNo}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[120px] truncate" title={row.invoiceNo}>{row.invoiceNo||'-'}</td>
                    <td className="px-4 py-3">{statusBadge(row)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{row.clearedOn||'-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={()=>setViewRow(row)} className="text-blue-500 hover:text-blue-600 text-xs font-medium">View</button>
                        <button onClick={()=>setEditRow(row)} className="text-green-500 hover:text-green-600 text-xs font-medium">Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length>0 && (
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-500">{filtered.length} cheques shown</span>
                <span className="text-sm font-semibold text-gray-800">
                  Total: {INR.format(filtered.reduce((s,r)=>s+(Number(r.amount)||0),0))}
                </span>
              </div>
            )}
            {filtered.length===0 && (
              <div className="text-center py-16 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p className="text-sm font-medium">No cheques found</p>
                <p className="text-xs mt-1">Adjust filters or use the ⟳ button to refresh from Google Sheet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showUploadModal && <ChequesBulkUploadModal onClose={()=>setShowUploadModal(false)} onImport={handleBulkImport} />}
      {showAddModal    && <ChequeFormModal nextSr={nextSr} onClose={()=>setShowAddModal(false)} onSave={handleAdd} />}
      {editRow         && <ChequeFormModal row={editRow}   nextSr={nextSr} onClose={()=>setEditRow(null)}  onSave={handleEdit} />}
      {viewRow         && <ChequeViewModal row={viewRow}   onClose={()=>setViewRow(null)} />}
    </div>
  );
}
