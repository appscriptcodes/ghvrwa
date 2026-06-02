/* ===================================================
   TransactionsPage.js — Transactions Page & Modals
   Global Hillview Society Portal
   Full bank-statement columns + Analytics dashboard
   =================================================== */

/* ── Updated Auto-categoriser with Remarks Priority ── */
function autoCategory(narration, type, remarks) {
  // Priority 1: Use Remarks if present
  if (remarks && remarks.trim() !== "") {
    return remarks.trim(); 
  }

  const n = (narration || '').toUpperCase();
  
  // Priority 2: Fallback to Narration-based logic
  if (type === 'Credit') {
    if (n.includes('EASEBUZZ'))                        return 'Maintenance Collection';
    if (n.includes('MOVE IN') || n.includes('MOVE OUT')) return 'Move In/Out Charges';
    if (n.includes('OWNERSHIP') || n.includes('OWNERSHIP CHANGE')) return 'Ownership Transfer';
    if (n.includes('ADVANCE MAIN') || n.includes('ADVANCE MAINTEN')) return 'Advance Maintenance';
    if (n.includes('CHQ RET') || n.includes('I/W CHQ RET'))  return 'Cheque Return';
    if (n.includes('VKM'))                             return 'VKM Transfer';
    if (n.includes('UPI'))                             return 'UPI Receipt';
    if (n.includes('NEFT'))                            return 'NEFT Receipt';
    if (n.includes('IMPS'))                            return 'IMPS Receipt';
    if (n.includes('RTGS'))                            return 'RTGS Receipt';
    if (n.includes('FT') && n.includes('CR'))          return 'Fund Transfer In';
    return 'Other Income';
  }
  
  if (n.includes('ENVIRO'))                            return 'Housekeeping (Enviro)';
  if (n.includes('TEAMWORKS') || n.includes('TEAM WORKS')) return 'Security (TeamWorks)';
  if (n.includes('DHBVN') || n.includes('BIJLI VITRAN')) return 'Electricity (DHBVN)';
  if (n.includes('CHQ RETURN CHGS'))                   return 'Bank Charges';
  if (n.includes('CHQ PAID') || n.includes('CTS'))     return 'Cheque Payment';
  if (n.includes('PAWAN') || n.includes('SANDEEP'))    return 'Petty Cash';
  if (n.includes('RTGS DR'))                           return 'RTGS Payment';
  if (n.includes('FT - DR') || (n.includes('FT') && n.includes('DR'))) return 'Fund Transfer Out';
  if (n.includes('NEFT'))                              return 'NEFT Payment';
  if (n.includes('UPI'))                               return 'UPI Payment';
  if (n.includes('IMPS'))                              return 'IMPS Payment';
  if (n.includes('ATM'))                               return 'ATM';
  if (n.includes('ELECTRICITY') || n.includes('ELEC')) return 'Electricity';
  if (n.includes('REPAIR') || n.includes('MAINTAIN'))  return 'Repairs & Maintenance';
  if (n.includes('INTEREST'))                          return 'Interest';
  return 'Other Expense';
}

/* ── Date normaliser: "29/11/25" or "29/11/2025" → "2025-11-29" ── */
function normDate(val) {
  if (!val) return '';
  const s = String(val).trim();
  const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  const m4 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m2) { const [,d,mo,y]=m2; return `20${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`; }
  if (m4) { const [,d,mo,y]=m4; return `${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`; }
  return s;
}

/* ── Updated Bank statement XLS/XLSX parser (SheetJS) ── */
function parseBankStatement(workbook) {
  const ws  = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });

  let headerIdx = -1;
  for (let i = 0; i < raw.length; i++) {
    const row = raw[i] || [];
    if (row.some(c => String(c||'').trim()==='Date') &&
        row.some(c => String(c||'').toLowerCase().includes('narration'))) {
      headerIdx = i; break;
    }
  }
  if (headerIdx === -1) throw new Error('Header row not found — is this an HDFC statement?');

  const hdr    = raw[headerIdx].map(h => String(h||'').trim());
  const col    = k => hdr.findIndex(h => h.toLowerCase().includes(k.toLowerCase()));
  const idxDate= col('Date');
  const idxNar = col('Narration');
  const idxRef = col('Chq');
  const idxVdt = col('Value');
  const idxWd  = col('Withdrawal');
  const idxDep = col('Deposit');
  const idxBal = col('Closing');
  const idxRem = col('Remarks'); // New mapping for the Remarks column

  const out = [];
  for (let i = headerIdx + 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row || !row[idxDate]) continue;
    const dateStr = String(row[idxDate]||'').trim();
    if (!dateStr || dateStr.startsWith('*') || dateStr.length < 5) continue;
    const wd  = parseFloat(String(row[idxWd] ||'').replace(/,/g,'')) || 0;
    const dep = parseFloat(String(row[idxDep]||'').replace(/,/g,'')) || 0;
    const bal = parseFloat(String(row[idxBal]||'').replace(/,/g,'')) || 0;
    if (wd === 0 && dep === 0) continue;
    const type    = dep > 0 ? 'Credit' : 'Debit';
    const narr    = String(row[idxNar]||'').trim();
    const remarks = String(row[idxRem]||'').trim(); // Fetch Remarks
    const refNo   = String(row[idxRef]||'').trim();
    const valueDt = normDate(row[idxVdt]);
    
    out.push({
      Date:              normDate(dateStr),
      Narration:         narr,
      'Chq/Ref No':      refNo,
      'Value Date':      valueDt,
      'Withdrawal Amt':  wd   || '',
      'Deposit Amt':     dep  || '',
      'Closing Balance': bal,
      Type:              type,
      Amount:            dep > 0 ? dep : wd,
      // Priority Logic: Use Remark for Category/Party Name
      Category:          autoCategory(narr, type, remarks),
      Description:       remarks && remarks !== "" ? remarks : narr, 
      Attachment:        ''
    });
  }
  return out;
}

/* ── Tiny bar sparkline rendered as inline SVG ── */
function MiniBar({ values, color }) {
  if (!values || values.length === 0) return null;
  const max = Math.max(...values, 1);
  const w = 4, gap = 2, h = 32;
  const total = values.length * (w + gap) - gap;
  return (
    <svg width={total} height={h} style={{ display:'block' }}>
      {values.map((v, i) => {
        const barH = Math.max(2, Math.round((v / max) * h));
        return <rect key={i} x={i*(w+gap)} y={h-barH} width={w} height={barH} fill={color} rx="1" opacity="0.8" />;
      })}
    </svg>
  );
}

/* ── Analytics Panel ── */
function TransactionAnalytics({ data }) {
  const { useState, useMemo } = React;
  const [period, setPeriod] = useState('monthly');

  const analytics = useMemo(() => {
    if (!data || data.length === 0) return null;

    const credits = data.filter(t => t.Type === 'Credit' || (t['Deposit Amt'] && Number(t['Deposit Amt']) > 0));
    const debits  = data.filter(t => t.Type === 'Debit'  || (t['Withdrawal Amt'] && Number(t['Withdrawal Amt']) > 0));

    const totalIn  = credits.reduce((s,t) => s + Number(t['Deposit Amt']  || t.Amount || 0), 0);
    const totalOut = debits.reduce((s,t)  => s + Number(t['Withdrawal Amt']|| t.Amount || 0), 0);

    /* Monthly bucketing */
    const monthMap = {};
    data.forEach(t => {
      const d = t.Date || '';
      if (!d) return;
      const ym = d.substring(0, 7); 
      if (!monthMap[ym]) monthMap[ym] = { label: ym, credit: 0, debit: 0, count: 0 };
      const dep = Number(t['Deposit Amt']  || (t.Type === 'Credit' ? t.Amount : 0) || 0);
      const wd  = Number(t['Withdrawal Amt']|| (t.Type === 'Debit'  ? t.Amount : 0) || 0);
      monthMap[ym].credit += dep;
      monthMap[ym].debit  += wd;
      monthMap[ym].count++;
    });
    const months = Object.values(monthMap).sort((a,b) => a.label.localeCompare(b.label));

    /* Category breakdown */
    const catMap = {};
    data.forEach(t => {
      const cat = t.Category || 'Other';
      if (!catMap[cat]) catMap[cat] = { credit: 0, debit: 0, count: 0 };
      catMap[cat].credit += Number(t['Deposit Amt']  || (t.Type === 'Credit' ? t.Amount : 0) || 0);
      catMap[cat].debit  += Number(t['Withdrawal Amt']|| (t.Type === 'Debit'  ? t.Amount : 0) || 0);
      catMap[cat].count++;
    });
    const categories = Object.entries(catMap)
      .map(([name, v]) => ({ name, ...v, total: v.credit + v.debit }))
      .sort((a,b) => b.total - a.total);

    /* Mode detection */
    const modeMap = {};
    data.forEach(t => {
      const n = (t.Narration || t.Description || '').toUpperCase();
      let mode = 'Other';
      if (n.includes('UPI'))  mode = 'UPI';
      else if (n.includes('NEFT')) mode = 'NEFT';
      else if (n.includes('RTGS')) mode = 'RTGS';
      else if (n.includes('IMPS')) mode = 'IMPS';
      else if (n.includes('CHQ') || n.includes('CHEQUE')) mode = 'Cheque';
      else if (n.includes('ATM')) mode = 'ATM';
      modeMap[mode] = (modeMap[mode] || 0) + 1;
    });

    /* Balance trend */
    const balMap = {};
    data.forEach(t => {
      if (t['Closing Balance'] && t.Date) balMap[t.Date] = Number(t['Closing Balance']);
    });
    const balTrend = Object.entries(balMap).sort((a,b)=>a[0].localeCompare(b[0])).map(([d,v])=>({date:d,bal:v}));

    const latestBal = balTrend.length ? balTrend[balTrend.length-1].bal : 0;
    const oldestBal = balTrend.length > 1 ? balTrend[0].bal : latestBal;

    return { totalIn, totalOut, net: totalIn - totalOut, months, categories, modeMap, balTrend, latestBal, oldestBal,
             totalTxns: data.length, avgCredit: credits.length ? totalIn / credits.length : 0,
             avgDebit: debits.length ? totalOut / debits.length : 0 };
  }, [data]);

  if (!analytics) return (
    <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">No transaction data to analyse.</div>
  );

  const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fmtMonth = ym => { const [y,m] = ym.split('-'); return `${MONTH_LABELS[+m-1]} ${y.slice(2)}`; };

  const maxMonthCredit = Math.max(...analytics.months.map(m => m.credit), 1);
  const maxMonthDebit  = Math.max(...analytics.months.map(m => m.debit),  1);
  const maxBal         = Math.max(...analytics.balTrend.map(b => b.bal), 1);
  const minBal         = Math.min(...analytics.balTrend.map(b => b.bal));

  /* SVG chart for balance trend */
  const svgW = 600, svgH = 120, pad = 10;
  const bPoints = analytics.balTrend;
  const bRange  = maxBal - minBal || 1;
  const pts = bPoints.map((b, i) => {
    const x = pad + (i / Math.max(bPoints.length - 1, 1)) * (svgW - pad*2);
    const y = svgH - pad - ((b.bal - minBal) / bRange) * (svgH - pad*2);
    return `${x},${y}`;
  }).join(' ');

  const modeColors = { UPI:'#6366f1', NEFT:'#10b981', RTGS:'#f59e0b', IMPS:'#ef4444', Cheque:'#8b5cf6', ATM:'#ec4899', Other:'#94a3b8' };
  const modeTotal = Object.values(analytics.modeMap).reduce((s,v)=>s+v,0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Total Credits', val: INR.format(analytics.totalIn),  sub:`Avg ${INR.format(analytics.avgCredit)}`, color:'text-emerald-600', bg:'bg-emerald-50', border:'border-emerald-200' },
          { label:'Total Debits',  val: INR.format(analytics.totalOut), sub:`Avg ${INR.format(analytics.avgDebit)}`,  color:'text-red-600',     bg:'bg-red-50',     border:'border-red-200' },
          { label:'Net Flow',      val: INR.format(analytics.net),      sub: analytics.net >= 0 ? 'Surplus' : 'Deficit', color: analytics.net>=0?'text-blue-600':'text-orange-600', bg:'bg-blue-50', border:'border-blue-200' },
          { label:'Closing Balance', val: INR.format(analytics.latestBal), sub:`${analytics.totalTxns} transactions`, color:'text-purple-600', bg:'bg-purple-50', border:'border-purple-200' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} border ${k.border} rounded-xl p-4`}>
            <p className="text-xs font-medium text-gray-500 mb-1">{k.label}</p>
            <p className={`text-xl font-bold ${k.color} leading-tight`}>{k.val}</p>
           <p className="text-xs text-gray-400 mt-1">{data.length} transactions</p>
          </div>
        ))}
      </div>

      {bPoints.length > 1 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Balance Trend</h3>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>Low: <strong className="text-gray-700">{INR.format(minBal)}</strong></span>
              <span>High: <strong className="text-gray-700">{INR.format(maxBal)}</strong></span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width:'100%', minWidth:'300px', height:'100px' }}>
              <defs>
                <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02"/>
                </linearGradient>
              </defs>
              <polygon points={`${pad},${svgH-pad} ${pts} ${svgW-pad},${svgH-pad}`} fill="url(#balGrad)" />
              <polyline points={pts} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Flow</h3>
          <div className="space-y-3 overflow-y-auto" style={{ maxHeight:'260px' }}>
            {analytics.months.map(m => (
              <div key={m.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500 font-medium w-14 flex-shrink-0">{fmtMonth(m.label)}</span>
                  <span className="text-gray-400 ml-2">{m.count} txns</span>
                  <span className="ml-auto text-emerald-600 font-medium">{INR.format(m.credit)}</span>
                </div>
                <div className="flex gap-1 h-2">
                  <div className="bg-emerald-400 rounded-full" style={{ width: `${(m.credit/maxMonthCredit)*100}%`, minWidth: m.credit>0?'2px':0 }} />
                </div>
                <div className="flex gap-1 h-2 mt-0.5">
                  <div className="bg-red-400 rounded-full" style={{ width: `${(m.debit/maxMonthDebit)*100}%`, minWidth: m.debit>0?'2px':0 }} />
                </div>
                <div className="flex justify-end text-xs text-red-500 mt-0.5">{INR.format(m.debit)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Transaction Modes</h3>
          <div className="space-y-2 overflow-y-auto" style={{ maxHeight:'260px' }}>
            {Object.entries(analytics.modeMap).sort((a,b)=>b[1]-a[1]).map(([mode, cnt]) => (
              <div key={mode} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: modeColors[mode]||'#94a3b8' }} />
                <span className="text-xs text-gray-600 w-16">{mode}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ width:`${(cnt/modeTotal)*100}%`, background: modeColors[mode]||'#94a3b8' }} />
                </div>
                <span className="text-xs font-medium text-gray-700 w-8 text-right">{cnt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TransactionsPage({ data, isAdmin, onRefresh, chartOfAccounts }) {
  const { useState, useMemo, useRef } = React;
  const [tab, setTab] = useState('table');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(null);
  const [filterYear,   setFilterYear]   = useState('');
  const [filterMonth,  setFilterMonth]  = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [importStep, setImportStep] = useState('idle');
  const [importRows, setImportRows] = useState([]);
  const [importError, setImportError] = useState('');
  const [importProgress, setImportProgress] = useState(0);
  const fileRef = useRef(null);

  /* ── Available years & months for filter dropdowns ── */
  const availableYears = useMemo(() => {
    const years = new Set();
    data.forEach(t => { if (t.Date) years.add(t.Date.substring(0, 4)); });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [data]);

  const availableMonths = useMemo(() => {
    const MONTH_NAMES = ['January','February','March','April','May','June',
      'July','August','September','October','November','December'];
    const months = new Set();
    data.forEach(t => {
      if (t.Date && (!filterYear || t.Date.startsWith(filterYear)))
        months.add(t.Date.substring(5, 7));
    });
    return Array.from(months).sort().map(m => ({ value: m, label: MONTH_NAMES[+m - 1] }));
  }, [data, filterYear]);

  /* Filtered rows — MUST be before stats */
  const filtered = useMemo(() => {
    let r = data;
    if (typeFilter === 'credit') r = r.filter(t => t.Type === 'Credit' || Number(t['Deposit Amt']||0) > 0);
    if (typeFilter === 'debit')  r = r.filter(t => t.Type === 'Debit'  || Number(t['Withdrawal Amt']||0) > 0);
    if (filterYear)  r = r.filter(t => t.Date && t.Date.startsWith(filterYear));
    if (filterMonth) r = r.filter(t => t.Date && t.Date.substring(5, 7) === filterMonth);
    if (!search.trim()) return r;
    const q = search.toLowerCase();
    return r.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(q)));
  }, [data, search, typeFilter, filterYear, filterMonth]);

  /* Summary stats — uses filtered so cards update with filters */
  const stats = useMemo(() => {
    const getAmt = (t, type) => {
      if (type === 'credit') {
        return Number(t['Deposit Amt'] || (t.Type === 'Credit' ? t.Amount : 0) || 0);
      }
      return Number(t['Withdrawal Amt'] || (t.Type === 'Debit' ? t.Amount : 0) || 0);
    };
    const income  = filtered.reduce((s,t) => s + getAmt(t,'credit'), 0);
    const expense = filtered.reduce((s,t) => s + getAmt(t,'debit'),  0);
    return { income, expense, net: income - expense };
  }, [filtered]);

  function onFilePick(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImportError('');
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const wb   = XLSX.read(evt.target.result, { type:'binary' });
        const rows = parseBankStatement(wb);
        if (!rows.length) { setImportError('No transactions found.'); return; }
        setImportRows(rows);
        setImportStep('preview');
      } catch (err) { setImportError('Parse error: ' + String(err)); }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  }

  async function doImport(clearFirst) {
    setImportStep('importing');
    try {
      if (clearFirst) await postPlain({ op:'clearSheet', sheet:'Transactions' });
      for (let i = 0; i < importRows.length; i++) {
        await postPlain({ op:'createRow', sheet:'Transactions', row: importRows[i] });
        setImportProgress(Math.round(((i+1)/importRows.length)*100));
      }
      setImportStep('done');
      await onRefresh();
      setTimeout(() => setImportStep('idle'), 2000);
    } catch (err) { setImportError(String(err)); setImportStep('preview'); }
  }

  const hasBankCols = data.length > 0 && ('Narration' in data[0] || 'Deposit Amt' in data[0]);

  return (
    <div className="space-y-5">
      {importStep !== 'idle' && (
        <ImportPreviewModal
          step={importStep} rows={importRows} progress={importProgress} error={importError}
          onClear={() => doImport(true)} onAppend={() => doImport(false)}
          onCancel={() => setImportStep('idle')}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div onClick={() => setTypeFilter('credit')} className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer ${typeFilter==='credit'?'ring-2 ring-emerald-500':''}`}>
          <p className="text-xs text-gray-500 font-medium">Total Credits</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{INR.format(stats.income)}</p>
        </div>
        <div onClick={() => setTypeFilter('debit')} className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer ${typeFilter==='debit'?'ring-2 ring-red-500':''}`}>
          <p className="text-xs text-gray-500 font-medium">Total Debits</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{INR.format(stats.expense)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Net Flow</p>
          <p className={`text-2xl font-bold mt-1 ${stats.net>=0?'text-blue-600':'text-orange-600'}`}>{INR.format(stats.net)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            {[['table','Transactions'],['analytics','Analytics']].map(([id,label]) => (
              <button key={id} onClick={() => setTab(id)} className={`px-4 py-1.5 rounded-md text-sm font-medium ${tab===id?'bg-white shadow-sm':'text-gray-500'}`}>{label}</button>
            ))}
          </div>
<div className="flex items-center gap-2 flex-wrap">
              <select value={filterYear}
                onChange={e => { setFilterYear(e.target.value); setFilterMonth(''); }}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-700">
                <option value="">All Years</option>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-700"
                disabled={availableMonths.length === 0}>
                <option value="">All Months</option>
                {availableMonths.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {(filterYear || filterMonth || typeFilter || search) && (
                <button
                  onClick={() => { setFilterYear(''); setFilterMonth(''); setTypeFilter(null); setSearch(''); }}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50">
                  ✕ Clear
                </button>
              )}
              {tab === 'table' && (
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search…" className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
              )}
              <ExportButton data={filtered} filename="Transactions" />
          </div>
        </div>

        {tab === 'analytics' ? <div className="p-4"><TransactionAnalytics data={data} /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Date','Narration','Chq/Ref','Withdrawal','Deposit','Balance','Category','Actions'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 whitespace-nowrap">{formatDateDisplay(row.Date)}</td>
                    <td className="px-3 py-2.5 max-w-xs truncate" title={row.Narration||row.Description}>{row.Narration||row.Description}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-400 font-mono">{row['Chq/Ref No']||'—'}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-red-600">{row['Withdrawal Amt'] ? INR.format(row['Withdrawal Amt']) : '—'}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-emerald-600">{row['Deposit Amt'] ? INR.format(row['Deposit Amt']) : '—'}</td>
                    <td className="px-3 py-2.5 text-right font-semibold">{INR.format(row['Closing Balance']||0)}</td>
                    <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100">{row.Category||'—'}</span></td>
                    <td className="px-3 py-2.5"><button onClick={() => setViewRow(row)} className="text-blue-500 text-xs">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {viewRow && <TransactionViewModal row={viewRow} onClose={() => setViewRow(null)} />}
    </div>
  );
}
