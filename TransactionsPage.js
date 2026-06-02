/* ===================================================
   TransactionsPage.js — Transactions Page & Modals
   Global Hillview Society Portal
   Full bank-statement columns + Analytics dashboard
   =================================================== */

/* ── Auto-categoriser based on narration patterns ── */
/* ===================================================
   TransactionsPage.js — Transactions Page & Modals
   Global Hillview Society Portal
   Full bank-statement columns + Analytics dashboard
   =================================================== */

/* ── Updated Auto-categoriser using new Column Data ── */
function autoCategory(narration, type) {
  const n = (narration || '').toUpperCase();
  // Credits
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
  // Debits
  if (n.includes('ENVIRO'))                            return 'Housekeeping (Enviro)';
  if (n.includes('TEAMWORKS') || n.includes('TEAM WORKS')) return 'Security (TeamWorks)';
  if (n.includes('DHBVN') || n.includes('BIJLI VITRAN')) return 'Electricity (DHBVN)';
  if (n.includes('CHQ RETURN CHGS'))                   return 'Bank Charges';
  if (n.includes('CHQ PAID') || n.includes('CTS'))     return 'Cheque Payment';
  if (n.includes('CHQ PAID') || n.includes('CTS') || n.includes('S & V SWITCHGEARS') || n.includes('S V SWITCHGEARS'))
    return 'Cheque Payment';
  return 'Other Expense';
}

/* Helper to convert dates cleanly into standard form if needed */
function normDate(val) {
  if (!val) return '';
  const dStr = String(val).trim();
  if (dStr.includes('-')) return dStr; 
  if (dStr.includes('/')) {
    const parts = dStr.split('/');
    if (parts.length === 3) {
      let y = parts[2];
      if (y.length === 2) y = "20" + y;
      return `${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}-${y}`;
    }
  }
  return dStr;
}

/* ── Standardized Date Display Function ── */
function formatDateDisplay(dateStr) {
  if (!dateStr) return '—';
  try {
    // Handle YYYY-MM-DD format
    if (dateStr.includes('-') && dateStr.length === 10) {
      const [y, m, d] = dateStr.split('-');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${d}-${months[parseInt(m)-1]}-${y}`;
    }
    // Handle DD/MM/YYYY format
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const d = parts[0].padStart(2, '0');
        const m = parseInt(parts[1]);
        const y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
        return `${d}-${months[m-1]}-${y}`;
      }
    }
    return dateStr;
  } catch (e) {
    return dateStr || '—';
  }
}

/* INR Formatter for currency */
const INR = {
  format: (val) => {
    if (!val || isNaN(val)) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
  }
};

/* Helper to map natural word months into the matching numerical keys expected by portal views */
function convertMonthToNumber(monthStr) {
  if (!monthStr) return '';
  const m = String(monthStr).trim().toLowerCase();
  const lookup = {
    'january': '01', 'jan': '01', '01': '01',
    'february': '02', 'feb': '02', '02': '02',
    'march': '03', 'mar': '03', '03': '03',
    'april': '04', 'apr': '04', '04': '04',
    'may': '05', '05': '05',
    'june': '06', 'jun': '06', '06': '06',
    'july': '07', 'jul': '07', '07': '07',
    'august': '08', 'aug': '08', '08': '08',
    'september': '09', 'sep': '09', '09': '09',
    'october': '10', 'oct': '10', '10': '10',
    'november': '11', 'nov': '11', '11': '11',
    'december': '12', 'dec': '12', '12': '12'
  };
  return lookup[m] || monthStr.padStart(2, '0');
}

/* ── Updated Bank Statement Parser supporting full extended schema ── */
function parseBankStatement(workbook) {
  const ws  = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });

  let headerIdx = -1;
  // Dynamic header line identification across both legacy files and your new format
  for (let i = 0; i < raw.length; i++) {
    const row = raw[i] || [];
    if (row.some(c => ['Serial Number', 'Date', 'Narration'].includes(String(c||'').trim()))) {
      headerIdx = i; 
      break;
    }
  }
  if (headerIdx === -1) throw new Error('Valid spreadsheet columns not detected. Ensure headers match perfectly.');

  const hdr = raw[headerIdx].map(h => String(h||'').trim());
  const out = [];

  for (let i = headerIdx + 1; i < raw.length; i++) {
    const rowArr = raw[i];
    if (!rowArr || rowArr.length < 2) continue;

    // Assemble row properties indexed under their original headers
    const row = {};
    hdr.forEach((h, idx) => {
      row[h] = rowArr[idx] !== undefined ? String(rowArr[idx]).trim() : '';
    });

    const rawDate = row['Date'] || '';
    if (!rawDate || rawDate.startsWith('*') || rawDate.length < 5) continue;

    // Standardizing values
    const normalizedDate = normDate(rawDate);
    const dateParts = normalizedDate.split('-');
    
    // Fallback extraction mechanics if manual columns aren't filled on specific rows
    const derivedYear = row['Year'] || dateParts[2] || '';
    const derivedMonth = convertMonthToNumber(row['Month'] || dateParts[1] || '');

    const amt = parseFloat(String(row['Amount'] || row['Withdrawal Amt.'] || row['Deposit Amt.'] || '0').replace(/,/g,'')) || 0;
    const resolvedType = row['Type'] || (parseFloat(row['Deposit Amt.']) > 0 ? 'Credit' : 'Debit');

    out.push({
      'Serial Number':   row['Serial Number'] || String(i - headerIdx),
      'Date':            normalizedDate,
      'Type':            resolvedType,
      'Chq/Ref Number':  row['Chq/Ref Number'] || row['Chq./Ref.No.'] || '',
      'Category':        row['Category'] || autoCategory(row['Description'] || row['Narration'], resolvedType),
      'Amount':          Math.abs(amt),
      'Party':           row['Party'] || '',
      'Description':     row['Description'] || row['Narration'] || '',
      'Cost Center':     row['Cost Center'] || 'General',
      'Payment Mode':    row['Payment Mode'] || 'Bank',
      'Ref/Invoice':     row['Ref/Invoice'] || '',
      'Attachment':      row['Attachment'] || '',
      'Cleared?':        row['Cleared?'] || 'Yes',
      'Year':            String(derivedYear),
      'Month':           String(derivedMonth),
      'Value Date':      normDate(row['Value Dt'] || rawDate),
      'Closing Balance': parseFloat(String(row['Closing Balance'] || '0').replace(/,/g,'')) || 0
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

    const totalIn  = credits.reduce((s,t) => s + Number(String(t.Amount || t['Deposit Amt']  || 0).replace(/,/g,'')), 0);
    const totalOut = debits.reduce((s,t)  => s + Number(String(t.Amount || t['Withdrawal Amt'] || 0).replace(/,/g,'')), 0);

    /* Monthly bucketing */
    const monthMap = {};
    data.forEach(t => {
      const d = t.Date || '';
      if (!d) return;
      // Normalize to YYYY-MM regardless of stored format
      let ym = '';
      if (/^\d{4}-\d{2}/.test(d)) {
        ym = d.substring(0, 7);                      // already YYYY-MM-DD
      } else if (d.includes('/')) {
        const [dd, mm, yy] = d.split('/');
        const fullY = yy.length === 2 ? '20' + yy : yy;
        ym = `${fullY}-${mm.padStart(2,'0')}`;       // DD/MM/YY → YYYY-MM
      } else if (d.includes('-')) {
        const parts = d.split('-');
        if (parts[0].length <= 2) {                  // DD-MM-YYYY
          ym = `${parts[2]}-${parts[1].padStart(2,'0')}`;
        } else {
          ym = d.substring(0, 7);
        }
      }
      if (!ym) return;
      if (!monthMap[ym]) monthMap[ym] = { label: ym, credit: 0, debit: 0, count: 0 };
      const dep = Number(t['Deposit Amt']  || (t.Type === 'Credit' ? t.Amount : 0) || 0);
      const wd  = Number(t['Withdrawal Amt']|| (t.Type === 'Debit'  ? t.Amount : 0) || 0);
      monthMap[ym].credit += dep;
      monthMap[ym].debit  += wd;
      monthMap[ym].count++;
    });
    const months = Object.values(monthMap).sort((a,b) => a.label.localeCompare(b.label));

    /* Category breakdown */
    const GENERIC_CATS = new Set(['income', 'expense', 'other', 'other income', 'other expense', '']);
    const catMap = {};
    data.forEach(t => {
const stored = (t.Category || '').trim();
      const narration = t.Description || t.Narration || t.description || t.narration || '';
      const cat = (t.Vendor && t.Vendor.trim())
        ? t.Vendor.trim()
        : GENERIC_CATS.has(stored.toLowerCase())
          ? autoCategory(narration, t.Type)
          : stored;
      if (!catMap[cat]) catMap[cat] = { credit: 0, debit: 0, count: 0 };
      const amt = Number(String(t.Amount || t['Deposit Amt'] || t['Withdrawal Amt'] || 0).replace(/,/g,''));
      if (t.Type === 'Credit') {
        catMap[cat].credit += amt;
      } else {
        catMap[cat].debit += amt;
      }
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

    /* Balance trend (closing balance per day) */
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
  const fmtMonth = ym => {
    const [y,m] = ym.split('-');
    return (MONTH_LABELS[+m-1] || '?') + ' ' + (y ? y.slice(2) : '');
  };

  const maxMonthCredit = Math.max(...analytics.months.map(m => m.credit), 1);
  const maxMonthDebit  = Math.max(...analytics.months.map(m => m.debit),  1);
  const maxBal         = Math.max(...analytics.balTrend.map(b => b.bal), 1);
  const minBal         = Math.min(...analytics.balTrend.map(b => b.bal));

  /* SVG line chart for balance trend */
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

      {/* ── KPI strip ── */}
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
            <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Balance Trend ── */}
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
              <polygon
                points={`${pad},${svgH-pad} ${pts} ${svgW-pad},${svgH-pad}`}
                fill="url(#balGrad)"
              />
              <polyline points={pts} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      )}

      {/* ── Monthly bars + Mode breakdown ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Monthly In/Out */}
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
                  <div className="bg-emerald-400 rounded-full" style={{ width: `${(m.credit/maxMonthCredit)*100}%`, minWidth: m.credit>0?'2px':0, transition:'width 0.4s' }} />
                </div>
                <div className="flex gap-1 h-2 mt-0.5">
                  <div className="bg-red-400 rounded-full" style={{ width: `${(m.debit/maxMonthDebit)*100}%`, minWidth: m.debit>0?'2px':0, transition:'width 0.4s' }} />
                </div>
                <div className="flex justify-end text-xs text-red-500 mt-0.5">{INR.format(m.debit)}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-emerald-400 rounded-full inline-block"/> Credits</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-red-400 rounded-full inline-block"/> Debits</span>
          </div>
        </div>

        {/* Payment Mode */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Transaction Modes</h3>
          <div className="space-y-2 overflow-y-auto" style={{ maxHeight:'260px' }}>
            {Object.entries(analytics.modeMap).sort((a,b)=>b[1]-a[1]).map(([mode, cnt]) => (
              <div key={mode} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: modeColors[mode]||'#94a3b8' }} />
                <span className="text-xs text-gray-600 w-16 flex-shrink-0">{mode}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{ width:`${(cnt/modeTotal)*100}%`, background: modeColors[mode]||'#94a3b8' }} />
                </div>
                <span className="text-xs font-medium text-gray-700 w-8 text-right">{cnt}</span>
                <span className="text-xs text-gray-400 w-12 text-right">{((cnt/modeTotal)*100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Category Breakdown ── */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Category Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                {['Category','Txns','Credits','Debits','Net'].map(h => (
                  <th key={h} className="pb-2 text-left font-medium text-gray-400 uppercase pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {analytics.categories.slice(0).map(cat => (
                <tr key={cat.name} className="hover:bg-gray-50">
                  <td className="py-2 pr-4 font-medium text-gray-700">{cat.name}</td>
                  <td className="py-2 pr-4 text-gray-500">{cat.count}</td>
                  <td className="py-2 pr-4 text-emerald-600">{cat.credit ? INR.format(cat.credit) : '—'}</td>
                  <td className="py-2 pr-4 text-red-500">{cat.debit ? INR.format(cat.debit) : '—'}</td>
                  <td className={`py-2 font-semibold ${(cat.credit-cat.debit)>=0?'text-emerald-600':'text-red-500'}`}>
                    {INR.format(cat.credit - cat.debit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main TransactionsPage Component
   ═══════════════════════════════════════════════════════════ */
function TransactionsPage({ data, isAdmin, onRefresh, chartOfAccounts }) {
  const { useState, useMemo, useRef } = React;

  const [tab, setTab] = useState('table');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(null);
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Custom date range filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Indian financial year filter (FY 2024-25, 2025-26, etc.)
  const [filterIndianFY, setFilterIndianFY] = useState('');
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [uploading, setUploading] = useState(false);

  /* Import state */
  const [importStep, setImportStep] = useState('idle');
  const [importRows, setImportRows] = useState([]);
  const [importError, setImportError] = useState('');
  const [importProgress, setImportProgress] = useState(0);
  const fileRef = useRef(null);

  /* ── Helper: Get Indian Financial Year from date ── */
  function getIndianFY(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split(/[-/]/);
      let year = parseInt(parts[parts.length - 1]);
      if (year < 100) year += 2000;
      const month = parseInt(parts[1] || 1);
      
      // Indian FY runs from April (month 4) to March (month 3)
      if (month >= 4) {
        return `FY ${year}-${String(year + 1).slice(2)}`;
      } else {
        return `FY ${year - 1}-${String(year).slice(2)}`;
      }
    } catch (e) {
      return '';
    }
  }

  /* ── Helper: Get all available Indian FYs from data ── */
  const availableIndianFYs = useMemo(() => {
    const fySet = new Set();
    data.forEach(t => {
      if (t.Date) {
        const fy = getIndianFY(t.Date);
        if (fy) fySet.add(fy);
      }
    });
    // Sort descending (newest first)
    return Array.from(fySet).sort((a, b) => {
      const aYear = parseInt(a.split(' ')[1]);
      const bYear = parseInt(b.split(' ')[1]);
      return bYear - aYear;
    });
  }, [data]);

  /* ── 1. Robust Year & Month Extractor ── */
  const availableYears = useMemo(() => {
    const years = new Set();
    data.forEach(t => {
      if (t.Year && String(t.Year).trim().length === 4) {
        years.add(String(t.Year).trim());
      } else if (t.Date) {
        const parts = t.Date.split(/[-/]/);
        const last = parts[parts.length - 1];
        if (last?.length === 4) years.add(last);
        else if (last?.length === 2) years.add("20" + last);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [data]);

  const availableMonths = useMemo(() => {
    if (!filterYear) return [];
    const months = new Set();
    const monthNames = {
      "01":"January","02":"February","03":"March","04":"April","05":"May","06":"June",
      "07":"July","08":"August","09":"September","10":"October","11":"November","12":"December"
    };

    data.forEach(t => {
      let y = '', m = '';
      if (t.Year && String(t.Year).trim() === filterYear) {
        y = filterYear;
        m = String(t.Month || '').trim().padStart(2, '0');
      } else if (t.Date) {
        const parts = t.Date.split(/[-/]/);
        y = parts[parts.length - 1].length === 2 ? "20" + parts[parts.length - 1] : parts[parts.length - 1];
        if (y === filterYear) {
          const mid = parts[1] || '';
          if (isNaN(mid)) {
            const idx = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"].indexOf(mid.toLowerCase().substring(0, 3));
            if (idx !== -1) m = String(idx + 1).padStart(2, '0');
          } else {
            m = mid.padStart(2, '0');
          }
        }
      }
      if (y === filterYear && monthNames[m]) months.add(m);
    });

    return Array.from(months).sort().map(m => ({ value: m, label: monthNames[m] }));
  }, [data, filterYear]);

  /* ── 2. The Filter Engine (The missing link) ── */
  const filtered = useMemo(() => {
    return data.filter(t => {
      // Search Filter
      const s = search.toLowerCase();
      const matchesSearch = !search || 
        (t.Narration || t.Description || '').toLowerCase().includes(s) ||
        (t.Party || '').toLowerCase().includes(s) ||
        (t.Category || '').toLowerCase().includes(s);

      // Type Filter
      const matchesType = !typeFilter || t.Type?.toLowerCase() === typeFilter.toLowerCase();

      // Year & Month Logic for Filtering
      let rowYear = '', rowMonth = '';
      if (t.Year && String(t.Year).trim().length === 4) {
        rowYear = String(t.Year).trim();
        rowMonth = String(t.Month || '').trim().padStart(2, '0');
      } else if (t.Date) {
        const parts = t.Date.split(/[-/]/);
        rowYear = parts[parts.length - 1].length === 2 ? "20" + parts[parts.length - 1] : parts[parts.length - 1];
        const mid = parts[1] || '';
        rowMonth = isNaN(mid) 
          ? String(["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"].indexOf(mid.toLowerCase().substring(0, 3)) + 1).padStart(2, '0')
          : mid.padStart(2, '0');
      }

      const matchesYear = !filterYear || rowYear === filterYear;
      const matchesMonth = !filterMonth || rowMonth === filterMonth;

      // Custom Date Range Filter
// Custom Date Range Filter
      let matchesDateRange = true;
      if (fromDate || toDate) {
        // Normalize the stored date to YYYY-MM-DD for reliable string comparison
        // Stored formats may be DD/MM/YY, DD-MM-YYYY, or already YYYY-MM-DD
        const toISO = (raw) => {
          if (!raw) return '';
          const s = String(raw).trim();
          // Already YYYY-MM-DD
          if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
          // DD/MM/YY or DD/MM/YYYY
          if (s.includes('/')) {
            const [d, m, y] = s.split('/');
            const fullY = y.length === 2 ? '20' + y : y;
            return `${fullY}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
          }
          // DD-MM-YYYY
          if (s.includes('-')) {
            const parts = s.split('-');
            if (parts[0].length <= 2) {            // DD-MM-YYYY
              return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
            }
          }
          return s;
        };
        const txnISO = toISO(t.Date);
        if (txnISO) {
          if (fromDate && txnISO < fromDate) matchesDateRange = false;
          if (toDate   && txnISO > toDate)   matchesDateRange = false;
        }
      }

      // Indian Financial Year Filter
      let matchesIndianFY = true;
      if (filterIndianFY) {
        const txnFY = getIndianFY(t.Date);
        matchesIndianFY = txnFY === filterIndianFY;
      }

      return matchesSearch && matchesType && matchesYear && matchesMonth && matchesDateRange && matchesIndianFY;
    });
  }, [data, search, typeFilter, filterYear, filterMonth, fromDate, toDate, filterIndianFY]);

  /* ── 3. Summary Stats ── */
/* ── 3. Summary Stats ── */
  const stats = useMemo(() => {
    const income = filtered.reduce((s, t) => {
      // Check for 'Deposit Amt.' (with dot), 'Deposit Amt', or generic 'Amount'
      const val = t['Deposit Amt.'] || t['Deposit Amt'] || (t.Type === 'Credit' ? t.Amount : 0) || 0;
      return s + Number(String(val).replace(/,/g, ''));
    }, 0);

    const expense = filtered.reduce((s, t) => {
      // Check for 'Withdrawal Amt.' (with dot), 'Withdrawal Amt', or generic 'Amount'
      const val = t['Withdrawal Amt.'] || t['Withdrawal Amt'] || (t.Type === 'Debit' ? t.Amount : 0) || 0;
      return s + Number(String(val).replace(/,/g, ''));
    }, 0);

    // Get latest closing balance from filtered data
    let closingBalance = 0;
    if (filtered.length > 0) {
      // Find the most recent transaction with a closing balance
      for (let i = filtered.length - 1; i >= 0; i--) {
        if (filtered[i]['Closing Balance']) {
          closingBalance = Number(String(filtered[i]['Closing Balance']).replace(/,/g, ''));
          break;
        }
      }
    }

    return { income, expense, net: income - expense, closingBalance };
  }, [filtered]);

  /* ... Keep your existing onFilePick, doImport, and clearAllFilters functions here ... */

  /* File picked for import */
  function onFilePick(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImportError('');
    if (typeof XLSX === 'undefined') { setImportError('SheetJS not loaded. Please refresh.'); return; }
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const wb   = XLSX.read(evt.target.result, { type:'binary', cellText:true, cellDates:false });
        const rows = parseBankStatement(wb);
        if (!rows.length) { setImportError('No transactions found. Is this an HDFC bank statement?'); return; }
        setImportRows(rows);
        setImportStep('preview');
      } catch (err) { setImportError('Parse error: ' + String(err)); }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  }

  async function doImport(clearFirst) {
    setImportStep('importing'); setImportProgress(0);
    try {
      if (clearFirst) {
        const r = await postPlain({ op:'clearSheet', sheet:'Transactions' });
        if (!r.ok) throw new Error('Clear failed: ' + (r.error||''));
      }
      for (let i = 0; i < importRows.length; i++) {
        await postPlain({ op:'createRow', sheet:'Transactions', row: importRows[i] });
        setImportProgress(Math.round(((i+1)/importRows.length)*100));
      }
      setImportStep('done');
      showToast(`${importRows.length} transactions imported.`, 'success');
      await onRefresh();
      setTimeout(() => { setImportStep('idle'); setImportRows([]); }, 2000);
    } catch (err) { setImportError(String(err)); setImportStep('preview'); }
  }

  const hasBankCols = data.length > 0 && ('Narration' in data[0] || 'Deposit Amt' in data[0]);

  /* ── Clear all filters helper ── */
  const hasActiveFilters = filterYear || filterMonth || typeFilter || search || fromDate || toDate || filterIndianFY;
  function clearAllFilters() {
    setFilterYear(''); setFilterMonth(''); setTypeFilter(null); setSearch(''); setFromDate(''); setToDate(''); setFilterIndianFY('');
  }

  return (
    <div className="space-y-5 fade-in">

      {/* Import modal */}
      {importStep !== 'idle' && (
        <ImportPreviewModal
          step={importStep} rows={importRows} progress={importProgress} error={importError}
          onClear={() => doImport(true)} onAppend={() => doImport(false)}
          onCancel={() => { setImportStep('idle'); setImportRows([]); setImportError(''); }}
        />
      )}

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div onClick={() => setTypeFilter(typeFilter==='credit'?null:'credit')}
          className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer transition-all ${typeFilter==='credit'?'ring-2 ring-emerald-500':'hover:shadow-md'}`}>
          <p className="text-xs text-gray-500 font-medium">Total Credits</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{INR.format(stats.income)}</p>
          <p className="text-xs text-gray-400 mt-1">Click to filter</p>
        </div>
        <div onClick={() => setTypeFilter(typeFilter==='debit'?null:'debit')}
          className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer transition-all ${typeFilter==='debit'?'ring-2 ring-red-500':'hover:shadow-md'}`}>
          <p className="text-xs text-gray-500 font-medium">Total Debits</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{INR.format(stats.expense)}</p>
          <p className="text-xs text-gray-400 mt-1">Click to filter</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Net Flow</p>
          <p className={`text-2xl font-bold mt-1 ${stats.net>=0?'text-blue-600':'text-orange-600'}`}>{INR.format(stats.net)}</p>
          <p className="text-xs text-gray-400 mt-1">{filtered.length} of {data.length} transactions</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-purple-200">
          <p className="text-xs text-gray-500 font-medium">Current Balance</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{INR.format(stats.closingBalance)}</p>
          <p className="text-xs text-gray-400 mt-1">Latest closing balance</p>
        </div>
      </div>

      {/* ── Tab bar + toolbar ── */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-3">

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
              {[['table','Transactions'],['analytics','Analytics'],['reconciliation','Reconciliation']].map(([id,label]) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab===id?'bg-white text-gray-900 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Right toolbar */}
            <div className="flex items-center gap-2 flex-wrap">

              {/* ── Year filter ── */}
              <select
                value={filterYear}
                onChange={e => { setFilterYear(e.target.value); setFilterMonth(''); }}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">All Years</option>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>

              {/* ── Month filter (disabled until a year is chosen OR months exist) ── */}
              <select
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
                disabled={availableMonths.length === 0}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">All Months</option>
                {availableMonths.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              {/* ── Indian Financial Year filter ── */}
              <select
                value={filterIndianFY}
                onChange={e => setFilterIndianFY(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">All FY</option>
                {availableIndianFYs.map(fy => <option key={fy} value={fy}>{fy}</option>)}
              </select>

              {/* ── Custom Date Range: From Date ── */}
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                placeholder="From"
                title="Filter from date"
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />

              {/* ── Custom Date Range: To Date ── */}
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                placeholder="To"
                title="Filter to date"
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />

              {/* ── Clear filters ── */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 flex items-center gap-1 transition-colors"
                  title="Clear all filters"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                  Clear
                </button>
              )}

              {tab === 'table' && (
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search…" className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
              )}

              <ExportButton data={filtered} filename="Transactions" />

              {isAdmin && (
                <>
                  <button onClick={() => fileRef.current?.click()}
                    className="bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 flex items-center gap-1.5 text-sm transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                    </svg>
                    Import Statement
                  </button>
                  <input ref={fileRef} type="file" accept=".xls,.xlsx,.csv" style={{display:'none'}} onChange={onFilePick} />
                  <button onClick={() => setShowAddModal(true)}
                    className="bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 flex items-center gap-1.5 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Add
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── Active filter pill bar ── */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-gray-400">Active filters:</span>
              {filterYear && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-medium">
                  📅 {filterYear}
                  <button onClick={() => { setFilterYear(''); setFilterMonth(''); }} className="hover:text-blue-900 ml-0.5">×</button>
                </span>
              )}
              {filterMonth && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-medium">
                  🗓 {availableMonths.find(m => m.value === filterMonth)?.label || filterMonth}
                  <button onClick={() => setFilterMonth('')} className="hover:text-blue-900 ml-0.5">×</button>
                </span>
              )}
              {typeFilter && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${typeFilter==='credit'?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-red-50 border-red-200 text-red-700'}`}>
                  {typeFilter === 'credit' ? '↑ Credits only' : '↓ Debits only'}
                  <button onClick={() => setTypeFilter(null)} className="hover:opacity-70 ml-0.5">×</button>
                </span>
              )}
              {search && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 rounded-full text-xs font-medium">
                  🔍 "{search}"
                  <button onClick={() => setSearch('')} className="hover:text-gray-900 ml-0.5">×</button>
                </span>
              )}
              {filterIndianFY && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-full text-xs font-medium">
                  📊 {filterIndianFY}
                  <button onClick={() => setFilterIndianFY('')} className="hover:text-purple-900 ml-0.5">×</button>
                </span>
              )}
              {fromDate && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-50 border border-cyan-200 text-cyan-700 rounded-full text-xs font-medium">
                  📅 From {fromDate}
                  <button onClick={() => setFromDate('')} className="hover:text-cyan-900 ml-0.5">×</button>
                </span>
              )}
              {toDate && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-50 border border-cyan-200 text-cyan-700 rounded-full text-xs font-medium">
                  📅 To {toDate}
                  <button onClick={() => setToDate('')} className="hover:text-cyan-900 ml-0.5">×</button>
                </span>
              )}
              <span className="text-xs text-gray-400 ml-1">— {filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        {tab === 'reconciliation' ? (
          <div className="p-4">
            <ChequeReconciliation data={data} />
          </div>
        ) : tab === 'analytics' ? (
          <div className="p-4">
            <TransactionAnalytics data={filtered} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {hasBankCols ? (
              /* ── Full bank-statement table ── */
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Date','Narration','Chq/Ref No','Value Date','Withdrawal','Deposit','Closing Balance','Category','Actions'].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((row, i) => {
                    const isCredit = Number(row['Deposit Amt']||0) > 0 || row.Type === 'Credit';
                    return (
<tr key={i} className="hover:bg-gray-50 transition-colors">
  {/* Date */}
  <td className="px-3 py-2.5 whitespace-nowrap text-gray-700">{formatDateDisplay(row.Date)}</td>
  
  {/* Narration */}
  <td className="px-3 py-2.5 max-w-xs">
    <p className="truncate text-gray-800" title={row.Narration||row.Description}>{row.Narration||row.Description||'—'}</p>
  </td>
  
  {/* Chq/Ref No */}
  <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap font-mono">{row['Chq/Ref No']||'—'}</td>
  
  {/* Value Date */}
  <td className="px-3 py-2.5 whitespace-nowrap text-gray-500 text-xs">{formatDateDisplay(row['Value Date'])||'—'}</td>
  
  {/* Withdrawal */}
  <td className="px-3 py-2.5 whitespace-nowrap text-right font-medium text-red-600">
    {row['Withdrawal Amt'] ? INR.format(Number(row['Withdrawal Amt'])) : '—'}
  </td>
  
  {/* Deposit */}
  <td className="px-3 py-2.5 whitespace-nowrap text-right font-medium text-emerald-600">
    {row['Deposit Amt'] ? INR.format(Number(row['Deposit Amt'])) : '—'}
  </td>
  
  {/* Closing Balance ← THIS IS THE KEY COLUMN */}
  <td className="px-3 py-2.5 whitespace-nowrap text-right font-semibold text-purple-700">
    {row['Closing Balance'] ? INR.format(Number(row['Closing Balance'])) : '—'}
  </td>
  
  {/* Category */}
  <td className="px-3 py-2.5">
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
      {row.Category||'—'}
    </span>
  </td>
  
  {/* Actions */}
  <td className="px-3 py-2.5">
    <div className="flex gap-2">
      <button onClick={() => setViewRow(row)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">View</button>
      {isAdmin && <button onClick={() => setEditRow(row)} className="text-green-500 hover:text-green-700 text-xs font-medium">Edit</button>}
    </div>
  </td>
</tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="9" className="px-4 py-12 text-center">
                        <p className="text-gray-400 font-medium">No transactions found.</p>
                        {hasActiveFilters && (
                          <button onClick={clearAllFilters} className="mt-2 text-blue-500 text-sm hover:underline">Clear filters</button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              /* ── Legacy table ── */
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                  
                      {['Date','Description','Vendor','Type','Amount','Category','Closing Balance','Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{formatDateDisplay(row.Date)}</td>
                      <td className="px-4 py-3"><span className="line-clamp-1">{row.Description}</span></td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-600">{row.Vendor || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${(row.Type||'').toLowerCase()==='credit'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{row.Type||'Debit'}</span>
                      </td>
                      <td className="px-4 py-3 font-medium">{INR.format(Number(row.Amount||0))}</td>
                      <td className="px-4 py-3">{row.Category}</td>
                      <td className="px-4 py-3 text-right font-semibold text-purple-700">
                        {row['Closing Balance'] ? INR.format(Number(String(row['Closing Balance']).replace(/,/g,''))) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setViewRow(row)} className="text-blue-500 text-sm">View</button>
                          {isAdmin && <button onClick={() => setEditRow(row)} className="text-green-500 text-sm">Edit</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-4 py-10 text-center">
                        <p className="text-gray-400">No transactions found.</p>
                        {hasActiveFilters && (
                          <button onClick={clearAllFilters} className="mt-2 text-blue-500 text-sm hover:underline">Clear filters</button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {viewRow && <TransactionViewModal row={viewRow} onClose={() => setViewRow(null)} />}

      {(showAddModal || editRow) && (
        <TransactionModal row={editRow} chartOfAccounts={chartOfAccounts} uploading={uploading}
          onClose={() => { setShowAddModal(false); setEditRow(null); }}
          onSave={async fd => {
            try {
              setUploading(true);
              await maybeUploadField(fd, 'Transactions', 'Attachment', 'txn');
              if (editRow) await api.upsertRow('Transactions','Serial Number',{...editRow,...fd});
              else         await api.createRow('Transactions', fd);
              await onRefresh();
              setShowAddModal(false); setEditRow(null);
              showToast('Saved', 'success');
            } catch (e) { showToast('Failed: '+String(e),'error'); }
            finally { setUploading(false); }
          }} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Import Preview Modal
   ═══════════════════════════════════════════════════════════ */
function ImportPreviewModal({ step, rows, progress, error, onClear, onAppend, onCancel }) {
  const credits  = rows.filter(r => r.Type === 'Credit');
  const debits   = rows.filter(r => r.Type === 'Debit');
  const totalIn  = credits.reduce((s,r) => s + Number(r['Deposit Amt']  ||r.Amount||0), 0);
  const totalOut = debits.reduce((s,r)  => s + Number(r['Withdrawal Amt']||r.Amount||0), 0);

  return (
    <div className="modal-overlay" onClick={step==='preview'?onCancel:undefined}>
      <div className="modal-content" style={{maxWidth:'800px',width:'95%'}} onClick={e=>e.stopPropagation()}>

        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Import Bank Statement</h3>
              <p className="text-xs text-gray-500">
                {step==='preview'   && `${rows.length} transactions detected`}
                {step==='importing' && `Uploading… ${progress}%`}
                {step==='done'      && 'Import complete!'}
              </p>
            </div>
          </div>
          {step==='preview' && (
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          )}
        </div>

        <div className="p-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

          {step==='preview' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {label:'Total Rows', val:rows.length, cls:'text-gray-700',    bg:'bg-gray-50 border-gray-200'},
                  {label:'Credits',    val:credits.length, cls:'text-emerald-700', bg:'bg-emerald-50 border-emerald-200'},
                  {label:'Debits',     val:debits.length,  cls:'text-red-700',     bg:'bg-red-50 border-red-200'},
                  {label:'Net',        val:INR.format(totalIn-totalOut), cls:(totalIn-totalOut)>=0?'text-blue-700':'text-orange-700', bg:'bg-blue-50 border-blue-200'},
                ].map(k=>(
                  <div key={k.label} className={`border rounded-xl p-3 text-center ${k.bg}`}>
                    <p className={`text-xl font-bold ${k.cls}`}>{k.val}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 flex gap-3">
                <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z"/>
                </svg>
                <div>
                  <strong>Clear &amp; Import</strong> removes all existing rows then adds {rows.length} new rows.<br/>
                  <strong>Append Data</strong> keeps existing data and adds {rows.length} rows below.
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Date','Narration','Chq/Ref No','Value Date','Withdrawal','Deposit','Balance','Category'].map(h=>(
                        <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.slice(0,8).map((r,i)=>(
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">{formatDateDisplay(r.Date)}</td>
                        <td className="px-3 py-2 max-w-48 truncate" title={r.Narration}>{r.Narration}</td>
                        <td className="px-3 py-2 font-mono text-gray-400 whitespace-nowrap">{r['Chq/Ref No']||'—'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-400">{formatDateDisplay(r['Value Date'])||'—'}</td>
                        <td className="px-3 py-2 text-right text-red-600">{r['Withdrawal Amt']?INR.format(r['Withdrawal Amt']):'—'}</td>
                        <td className="px-3 py-2 text-right text-emerald-600">{r['Deposit Amt']?INR.format(r['Deposit Amt']):'—'}</td>
                        <td className="px-3 py-2 text-right font-medium">{INR.format(r['Closing Balance']||0)}</td>
                        <td className="px-3 py-2"><span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs">{r.Category}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 8 && (
                  <p className="px-3 py-2 text-xs text-gray-400 bg-gray-50 border-t">… and {rows.length-8} more rows</p>
                )}
              </div>
            </>
          )}

          {step==='importing' && (
            <div className="py-6 space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Uploading transactions…</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-purple-600 h-3 rounded-full transition-all" style={{width:`${progress}%`}}/>
              </div>
              <p className="text-xs text-gray-400 text-center">Please wait — do not close this window.</p>
            </div>
          )}

          {step==='done' && (
            <div className="py-10 flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <p className="font-semibold text-gray-800">{rows.length} transactions imported</p>
            </div>
          )}
        </div>

        {step==='preview' && (
          <div className="p-5 border-t border-gray-100 flex justify-end gap-2 flex-wrap">
            <button onClick={onCancel} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
            <button onClick={onAppend} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
              Append Data
            </button>
            <button onClick={onClear} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              Clear &amp; Import
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   ChequeReconciliation Panel
   ═══════════════════════════════════════════════════════════ */
function ChequeReconciliation({ data }) {
  const { useState, useMemo } = React;
  const [filter, setFilter] = useState('all');

  const bankDebits = useMemo(() => {
    return data.filter(t => {
      const wd = Number(t['Withdrawal Amt'] || (t.Type === 'Debit' ? t.Amount : 0) || 0);
      return wd > 0;
    }).map(t => {
      const ref = (t['Chq/Ref No'] || '').replace(/^0+/, '') || '';
      return {
        date: t.Date || '',
        narration: t.Narration || t.Description || '',
        ref,
        amount: Number(t['Withdrawal Amt'] || (t.Type === 'Debit' ? t.Amount : 0) || 0),
        closing: Number(t['Closing Balance'] || 0),
      };
    });
  }, [data]);

  const CHEQUES = [
    {sr:1,chq:'680',party:'Enviro facility',purpose:'Technical & H.K team Bill',amount:684753,date:'09-Jan-2026',status:'Paid',clearedOn:'15-Jan-2026'},
    {sr:2,chq:'690',party:'Petty Cash',purpose:'Tea Expenses & internal material',amount:63047,date:'08-Jan-2026',status:'Paid',clearedOn:'15-Jan-2026'},
    {sr:3,chq:'684',party:'Inn4smart Solutions',purpose:'Sub Meter AMC',amount:79863,date:'08-Jan-2026',status:'Paid',clearedOn:'21-Jan-2026'},
    {sr:4,chq:'685',party:'Kamal Motors',purpose:'Diesel Purchasing',amount:73354,date:'08-Jan-2026',status:'Paid',clearedOn:'20-Jan-2026'},
    {sr:5,chq:'683',party:'R.P Enterpises',purpose:'Garbage Collection',amount:37760,date:'08-Jan-2026',status:'Paid',clearedOn:'17-Jan-2026'},
    {sr:6,chq:'687',party:'AS Constructions',purpose:'Main Road repair work',amount:17680,date:'08-Jan-2026',status:'Paid',clearedOn:'15-Jan-2026'},
    {sr:7,chq:'688',party:'Taj Electricals',purpose:'Submer cible Repair Work',amount:12190,date:'08-Jan-2026',status:'Paid',clearedOn:'19-Jan-2026'},
    {sr:8,chq:'692',party:'Park smart Technologetes',purpose:'Boom Barrier Entry Exit',amount:42480,date:'09-Jan-2026',status:'Paid',clearedOn:'16-Jan-2026'},
    {sr:9,chq:'689',party:'Shiwaji Petro',purpose:'Diesel Purchasing',amount:54562,date:'08-Jan-2026',status:'Paid',clearedOn:'15-Jan-2026'},
    {sr:10,chq:'694',party:'Team Works',purpose:'Security',amount:337150,date:'09-Jan-2026',status:'Paid',clearedOn:'13-Jan-2026'},
    {sr:11,chq:'682',party:'DPS Electricals',purpose:'1500 kva Transformer Rent',amount:103840,date:'08-Jan-2026',status:'Paid',clearedOn:'14-Jan-2026'},
    {sr:12,chq:'698',party:'DHBVN Monthly Electricity',purpose:'DHBVN Monthly Electricity',amount:617432,date:'18-Jan-2026',status:'Paid',clearedOn:'19-Jan-2026'},
    {sr:13,chq:'697',party:'Petty Cash',purpose:'Internal material & Laisoning',amount:20000,date:'15-Jan-2026',status:'Paid',clearedOn:'17-Jan-2026'},
    {sr:14,chq:'699',party:'Enviro facility',purpose:'Technical & H.K team Bill',amount:651849,date:'30-Jan-2026',status:'Paid',clearedOn:'02-Feb-2026'},
    {sr:15,chq:'695',party:'No Broker Technologies',purpose:'Main Gate 02 New Device',amount:8000,date:'13-Jan-2026',status:'Paid',clearedOn:'21-Feb-2026'},
    {sr:16,chq:'701',party:'Petty Cash',purpose:'Internal material & Republic day',amount:59500,date:'30-Jan-2026',status:'Paid',clearedOn:'02-Feb-2026'},
    {sr:17,chq:'709',party:'Shree shyam enterprises',purpose:'Fire Extingusher Rifiling',amount:126565,date:'09-Feb-2026',status:'Paid',clearedOn:'02-Dec-2026'},
    {sr:18,chq:'708',party:'VC Enterprises',purpose:'Camera Reaparing',amount:1180,date:'09-Feb-2026',status:'Paid',clearedOn:'07-Mar-2026'},
    {sr:19,chq:'707',party:'Inn4smart Solutions',purpose:'Sub Meter AMC',amount:26621,date:'09-Feb-2026',status:'Paid',clearedOn:'27-Feb-2026'},
    {sr:20,chq:'706',party:'AS Constructions',purpose:'Main gate chamber repairing',amount:5896,date:'09-Feb-2026',status:'Paid',clearedOn:'16-Feb-2026'},
    {sr:21,chq:'705',party:'Kamal Motors',purpose:'Diesel Purchasing',amount:69016,date:'09-Feb-2026',status:'Paid',clearedOn:'23-Feb-2026'},
    {sr:22,chq:'704',party:'R.P Enterpises',purpose:'Garbage Collection',amount:18880,date:'09-Feb-2026',status:'Bounced',clearedOn:''},
    {sr:23,chq:'710',party:'L.S Enterprises',purpose:'H.T VCB Repair',amount:0,date:'09-Feb-2026',status:'Cancel',clearedOn:''},
    {sr:24,chq:'703',party:'Petty Cash',purpose:'Internal material & Laisoning',amount:53389,date:'09-Feb-2026',status:'Paid',clearedOn:'11-Feb-2026'},
    {sr:25,chq:'711',party:'Petty Cash',purpose:'Advance for STP',amount:45000,date:'10-Feb-2026',status:'Paid',clearedOn:'02-Nov-2026'},
    {sr:26,chq:'712',party:'DHBVN Monthly Electricity',purpose:'DHBVN Monthly Electricity',amount:743111,date:'10-Feb-2026',status:'Paid',clearedOn:'02-Dec-2026'},
    {sr:27,chq:'713',party:'VC Enterprises',purpose:'Camera Reaparing',amount:10986,date:'10-Feb-2026',status:'Paid',clearedOn:'07-Mar-2026'},
    {sr:28,chq:'715',party:'L.S Enterprises',purpose:'H.T VCB Repair',amount:28674,date:'12-Feb-2026',status:'Paid',clearedOn:'16-Feb-2026'},
    {sr:29,chq:'716',party:'Team Works',purpose:'Security',amount:330986,date:'17-Feb-2026',status:'Paid',clearedOn:'18-Feb-2026'},
    {sr:30,chq:'717',party:'Sun Power Company',purpose:'D.G Service 125kva',amount:51687,date:'18-Feb-2026',status:'Paid',clearedOn:'24-Feb-2026'},
    {sr:31,chq:'718',party:'Shahrukh',purpose:'Fire Exit staire case Welding',amount:28500,date:'21-Feb-2026',status:'Paid',clearedOn:'23-Feb-2026'},
    {sr:32,chq:'722',party:'A.S Enterprises',purpose:'L.T Room Pillar make work',amount:4816,date:'25-Feb-2026',status:'Paid',clearedOn:'07-Mar-2026'},
    {sr:33,chq:'719',party:'Bala Ji Cement Store',purpose:'HDPE Black Pipe line purchase',amount:10800,date:'25-Feb-2026',status:'Paid',clearedOn:'02-Mar-2026'},
    {sr:34,chq:'726',party:'Shri Ganpati pipes & Tools',purpose:'Plumbing material purchase',amount:43576,date:'26-Feb-2026',status:'Paid',clearedOn:'04-Mar-2026'},
    {sr:35,chq:'724',party:'Petty Cash',purpose:'Internal material',amount:0,date:'26-Feb-2026',status:'Cancel',clearedOn:''},
    {sr:36,chq:'725',party:'Petty Cash',purpose:'Internal material',amount:4751,date:'26-Feb-2026',status:'Paid',clearedOn:'02-Mar-2026'},
    {sr:37,chq:'723',party:'Park smart Technologetes',purpose:'RFID Tags Expense',amount:70210,date:'26-Feb-2026',status:'Paid',clearedOn:'02-Mar-2026'},
    {sr:38,chq:'728',party:'S & V SWITCHGEARS',purpose:'1600 KVA Transformer Repair',amount:0,date:'28-Feb-2026',status:'Cancel',clearedOn:''},
    {sr:39,chq:'729',party:'DPS Electricals',purpose:'1500 kva Transformer Rent',amount:0,date:'28-Feb-2026',status:'Cancel',clearedOn:''},
    {sr:40,chq:'730',party:'DPS Electricals',purpose:'1500 kva Transformer Rent',amount:0,date:'01-Mar-2026',status:'Bounced',clearedOn:''},
    {sr:41,chq:'731',party:'S & V SWITCHGEARS',purpose:'1600 KVA Transformer Repair',amount:599157,date:'01-Mar-2026',status:'Paid',clearedOn:'02-Mar-2026'},
    {sr:42,chq:'732',party:'R.P Enterpises',purpose:'Garbage Collection',amount:18880,date:'05-Mar-2026',status:'Bounced',clearedOn:''},
    {sr:43,chq:'733',party:'Inn4smart Solutions',purpose:'Sub Meter AMC',amount:26621,date:'05-Mar-2026',status:'Pending',clearedOn:''},
    {sr:44,chq:'734',party:'Enviro facility',purpose:'Technical & H.K team Bill',amount:703289,date:'05-Mar-2026',status:'Paid',clearedOn:'06-Mar-2026'},
    {sr:45,chq:'735',party:'Petty Cash',purpose:'Internal material',amount:50000,date:'06-Mar-2026',status:'Paid',clearedOn:'06-Mar-2026'},
    {sr:46,chq:'736',party:'Team Works',purpose:'Security',amount:336003,date:'07-Mar-2026',status:'Paid',clearedOn:'07-Mar-2026'},
    {sr:47,chq:'737',party:'DPS Electricals',purpose:'1500 kva Transformer Rent',amount:94400,date:'10-Mar-2026',status:'Pending',clearedOn:''},
    {sr:48,chq:'738',party:'Kamal Motors',purpose:'Diesel Purchasing',amount:0,date:'13-Mar-2026',status:'Cancel',clearedOn:''},
    {sr:49,chq:'739',party:'Kamal Motors',purpose:'Diesel Purchasing',amount:61337,date:'13-Mar-2026',status:'Pending',clearedOn:''},
    {sr:50,chq:'740',party:'Petty Cash',purpose:'Internal material',amount:15000,date:'13-Mar-2026',status:'Pending',clearedOn:''},
    {sr:51,chq:'741',party:'Petty Cash',purpose:'Internal material',amount:25932,date:'13-Mar-2026',status:'Pending',clearedOn:''},
    {sr:52,chq:'742',party:'KARAM ELECTRICALS',purpose:'Transformer connection',amount:5900,date:'13-Mar-2026',status:'Pending',clearedOn:''},
    {sr:53,chq:'743',party:'DHBVN Monthly Electricity',purpose:'DHBVN Monthly Electricity',amount:574599,date:'13-Mar-2026',status:'Pending',clearedOn:''},
    {sr:54,chq:'744',party:'KVN ENTERPRISES',purpose:'CCTV Installation Advance',amount:0,date:'17-Mar-2026',status:'Cancel',clearedOn:''},
    {sr:55,chq:'745',party:'KVN ENTERPRISES',purpose:'CCTV Installation Advance',amount:150000,date:'17-Mar-2026',status:'Paid',clearedOn:''},
    {sr:56,chq:'746',party:'Kamal Motors',purpose:'Diesel Purchasing',amount:113876,date:'27-Mar-2026',status:'Pending',clearedOn:''},
    {sr:57,chq:'747',party:'Shri Ganpati pipes & Tools',purpose:'Plumbing material purchase',amount:7671,date:'27-Mar-2026',status:'Pending',clearedOn:''},
    {sr:58,chq:'748',party:'Park smart Technologetes',purpose:'Boom Barrier Entry Exit',amount:42480,date:'27-Mar-2026',status:'Pending',clearedOn:''},
    {sr:59,chq:'749',party:'BHARDWAJ TRADING CO.',purpose:'EID Decoration Items',amount:16711,date:'27-Mar-2026',status:'Pending',clearedOn:''},
    {sr:60,chq:'750',party:'M.S ENGINEER WORK SHOP',purpose:'125 KVA D.G Repairing',amount:0,date:'28-Mar-2026',status:'Cancel',clearedOn:''},
    {sr:61,chq:'751',party:'M.S ENGINEER WORK SHOP',purpose:'125 KVA D.G Repairing',amount:15458,date:'28-Mar-2026',status:'Pending',clearedOn:''},
  ];

  const enriched = useMemo(() => {
    return CHEQUES.map(c => {
      const bankMatch = bankDebits.find(b => {
        const bRef = b.ref.replace(/^0+/, '');
        return bRef === c.chq && Math.abs(b.amount - c.amount) < 1;
      });
      const actualStatus = c.status === 'Bounced' ? 'Bounced'
        : c.status === 'Cancel' ? 'Cancel'
        : bankMatch ? 'Cleared'
        : c.status === 'Paid' ? 'Paid (Unverified)'
        : 'Pending';
      return { ...c, bankMatch, actualStatus };
    });
  }, [bankDebits]);

  const filtered_cheques = useMemo(() => {
    if (filter === 'all')       return enriched;
    if (filter === 'matched')   return enriched.filter(c => c.actualStatus === 'Cleared');
    if (filter === 'unmatched') return enriched.filter(c => ['Pending','Paid (Unverified)'].includes(c.actualStatus));
    if (filter === 'bounced')   return enriched.filter(c => c.actualStatus === 'Bounced');
    if (filter === 'cancelled') return enriched.filter(c => c.actualStatus === 'Cancel');
    return enriched;
  }, [enriched, filter]);

  const summary = useMemo(() => {
    const cleared    = enriched.filter(c => c.actualStatus === 'Cleared');
    const bounced    = enriched.filter(c => c.actualStatus === 'Bounced');
    const cancelled  = enriched.filter(c => c.actualStatus === 'Cancel');
    const pending    = enriched.filter(c => ['Pending','Paid (Unverified)'].includes(c.actualStatus));
    return {
      total: enriched.length,
      cleared: cleared.length, clearedAmt: cleared.reduce((s,c)=>s+c.amount,0),
      bounced: bounced.length, bouncedAmt: bounced.reduce((s,c)=>s+c.amount,0),
      cancelled: cancelled.length,
      pending: pending.length, pendingAmt: pending.reduce((s,c)=>s+c.amount,0),
    };
  }, [enriched]);

  const statusBadge = (status) => {
    const cfg = {
      'Cleared':          'bg-green-100 text-green-700',
      'Paid (Unverified)':'bg-yellow-100 text-yellow-700',
      'Pending':          'bg-orange-100 text-orange-700',
      'Bounced':          'bg-red-100 text-red-700',
      'Cancel':           'bg-gray-100 text-gray-500',
    };
    return <span className={`status-badge text-xs ${cfg[status]||'bg-gray-100 text-gray-500'}`}>{status}</span>;
  };

  if (bankDebits.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <p className="text-sm font-medium">No bank statement data loaded yet.</p>
        <p className="text-xs mt-1">Import the HDFC bank statement first using the Import Statement button.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {label:'Cleared in Bank', val:summary.cleared, sub:INR.format(summary.clearedAmt), color:'#10b981', filter:'matched'},
          {label:'Pending/Unverified', val:summary.pending, sub:INR.format(summary.pendingAmt), color:'#f97316', filter:'unmatched'},
          {label:'Bounced', val:summary.bounced, sub:summary.bounced>0?INR.format(summary.bouncedAmt):'—', color:'#ef4444', filter:'bounced'},
          {label:'Cancelled', val:summary.cancelled, sub:'Zero-amount cheques', color:'#9ca3af', filter:'cancelled'},
        ].map(({label,val,sub,color,filter:f}) => (
          <div key={label} onClick={() => setFilter(filter===f?'all':f)}
            className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${filter===f?'ring-2':''}` }>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-2xl font-bold mt-1" style={{color}}>{val}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {summary.bounced > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
              <p className="font-semibold text-red-800">{summary.bounced} Bounced Cheque{summary.bounced>1?'s':''} Detected</p>
              <p className="text-red-700 text-xs mt-1">
                Chq #704 — R.P Enterpises ₹18,880 (Feb 2026) · Chq #732 — R.P Enterpises ₹18,880 (Mar 2026)
              </p>
              <p className="text-red-600 text-xs mt-1">Bank charged ₹59 return fee per bounce. Follow up with vendor.</p>
            </div>
          </div>
        </div>
      )}

      {summary.pending > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
              <p className="font-semibold text-orange-800">{summary.pending} Cheques Not Yet Found in Bank Statement</p>
              <p className="text-orange-700 text-xs mt-1">Total exposure: {INR.format(summary.pendingAmt)}.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {[['all','All Cheques'],['matched','Cleared'],['unmatched','Pending'],['bounced','Bounced'],['cancelled','Cancelled']].map(([f,label]) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter===f?'bg-blue-500 text-white':'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {label} ({f==='all'?enriched.length:f==='matched'?summary.cleared:f==='unmatched'?summary.pending:f==='bounced'?summary.bounced:summary.cancelled})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['#','Chq No.','Party','Purpose','Chq Amount','Bank Amount','Chq Date','Cleared Date','Status','Match'].map(h => (
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered_cheques.map(c => (
              <tr key={c.sr} className={`hover:bg-gray-50 transition-colors ${c.actualStatus==='Bounced'?'bg-red-50':''}`}>
                <td className="px-3 py-2.5 text-xs text-gray-400">{c.sr}</td>
                <td className="px-3 py-2.5 font-mono font-semibold text-gray-800">{c.chq}</td>
                <td className="px-3 py-2.5"><p className="text-gray-800 font-medium max-w-[140px] truncate" title={c.party}>{c.party}</p></td>
                <td className="px-3 py-2.5 text-gray-500 max-w-[160px] truncate text-xs" title={c.purpose}>{c.purpose}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-gray-800 whitespace-nowrap">
                  {c.amount > 0 ? INR.format(c.amount) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                  {c.bankMatch ? <span className="font-semibold text-emerald-600">{INR.format(c.bankMatch.amount)}</span> : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{c.date}</td>
                <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                  {c.bankMatch ? c.bankMatch.date : (c.clearedOn || <span className="text-gray-300">—</span>)}
                </td>
                <td className="px-3 py-2.5">{statusBadge(c.actualStatus)}</td>
                <td className="px-3 py-2.5">
                  {c.bankMatch ? (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                      <span className="text-xs text-emerald-600 font-medium">Matched</span>
                    </div>
                  ) : c.actualStatus === 'Cancel' ? (
                    <span className="text-xs text-gray-400">N/A</span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      <span className="text-xs text-orange-500 font-medium">Not found</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span>{filtered_cheques.length} cheques shown</span>
          <span className="font-semibold text-gray-700">Total: {INR.format(filtered_cheques.reduce((s,c)=>s+c.amount,0))}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TransactionViewModal
   ═══════════════════════════════════════════════════════════ */
function TransactionViewModal({ row, onClose }) {
  const bankCols = ['Date','Narration','Chq/Ref No','Value Date','Withdrawal Amt','Deposit Amt','Closing Balance','Type','Category','Description','Attachment'];
  const legacyCols = ['Date','Description','Type','Amount','Category','Attachment'];
  const hasBankCols = 'Narration' in row || 'Deposit Amt' in row;
  const cols = hasBankCols ? bankCols : legacyCols;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e=>e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Transaction Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-4">
          {cols.filter(c => c in row).map(col => (
            <div key={col} className={col==='Narration'||col==='Description'?'col-span-2':''}>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">{col}</label>
              {col==='Attachment' && row[col] ? (
                <a href={row[col]} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm hover:underline">View File</a>
              ) : (
                <p className="text-sm text-gray-800 break-words">
                  {(col==='Withdrawal Amt'||col==='Deposit Amt'||col==='Closing Balance'||col==='Amount') && row[col]
                    ? INR.format(Number(row[col]))
                    : (col==='Date'||col==='Value Date')
                    ? formatDateDisplay(row[col])
                    : row[col] || '—'}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="p-5 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">Close</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TransactionModal (Add / Edit)
   ═══════════════════════════════════════════════════════════ */
function TransactionModal({ row, chartOfAccounts, uploading, onClose, onSave }) {
  const { useState, useMemo } = React;
  const isNew = !row;
  const [fd, setFd] = useState(row || {
    Date: new Date().toISOString().split('T')[0],
    Narration:'', Description:'', Type:'Credit',
    'Deposit Amt':'', 'Withdrawal Amt':'',
    Amount:'', Category:'', 'Chq/Ref No':'',
    'Value Date':'', 'Closing Balance':'', Attachment:''
  });
  const set = (k,v) => setFd(p=>({...p,[k]:v}));

  const categories = useMemo(() =>
    chartOfAccounts.filter(c => (c.Group||'').toLowerCase() === (fd.Type.toLowerCase()==='credit'?'income':'expense')),
  [chartOfAccounts, fd.Type]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e=>e.stopPropagation()}>
        <div className="p-5 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">{isNew?'Add':'Edit'} Transaction</h3>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto" style={{maxHeight:'65vh'}}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Date</label>
              <input type="date" value={fd.Date} onChange={e=>set('Date',e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Type</label>
              <select value={fd.Type} onChange={e=>set('Type',e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="Credit">Credit (Deposit)</option>
                <option value="Debit">Debit (Withdrawal)</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Narration / Description</label>
              <input type="text" value={fd.Narration||fd.Description} onChange={e=>{set('Narration',e.target.value);set('Description',e.target.value);}}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                {fd.Type==='Credit'?'Deposit Amount':'Withdrawal Amount'}
              </label>
              <input type="number" value={fd.Type==='Credit'?fd['Deposit Amt']:fd['Withdrawal Amt']}
                onChange={e=>{
                  const k = fd.Type==='Credit'?'Deposit Amt':'Withdrawal Amt';
                  set(k,e.target.value); set('Amount',e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Category</label>
              <select value={fd.Category} onChange={e=>set('Category',e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Auto / Select</option>
                {categories.map((c,i)=><option key={i} value={c.Category}>{c.Category}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Chq / Ref No</label>
              <input type="text" value={fd['Chq/Ref No']||''} onChange={e=>set('Chq/Ref No',e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Value Date</label>
              <input type="date" value={fd['Value Date']||''} onChange={e=>set('Value Date',e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Closing Balance</label>
              <input type="number" value={fd['Closing Balance']||''} onChange={e=>set('Closing Balance',e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Attachment</label>
              <input type="file" onChange={e=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onload=()=>set('Attachment',r.result);r.readAsDataURL(f);}}}
                className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700"/>
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} disabled={uploading} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button onClick={()=>onSave(fd)} disabled={uploading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2">
            {uploading && <div className="spinner" style={{width:'14px',height:'14px',borderWidth:'2px'}}/>}
            {uploading?'Saving…':'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
