/* ===================================================
   DefaultersPage.js — Real Data Analytics Dashboard
   Global Hillview Society

   Data sourced from:
   - Out_standing_sheet.xlsx  (752 flats, balances as of May 2026)
   - Recharges CSV            (41,777 transactions, Aug 2023–May 2026)

   Key findings:
   - 195 defaulters (25.9% of 752 flats)
   - Total outstanding: ₹53.68L
   - 73 active defaulters (still recharging meters)
   - 122 inactive defaulters (no recharge since Feb 2026)
   - Worst tower: T2 (30.3% default rate, ₹13.7L O/S)
   - Best tower:  T5 (21.7% default rate, ₹6.8L O/S)
   =================================================== */

// ── Real tower data from Out_standing_sheet.xlsx ──────
const DEFAULTER_DATA = [
  { tower: 'T1', total: 152, defaulters: 35, outstanding: 1040894.74, activeDefaulters: 13, inactiveDefaulters: 22, avgMonthly: 437475 },
  { tower: 'T2', total: 152, defaulters: 46, outstanding: 1374063.94, activeDefaulters: 19, inactiveDefaulters: 27, avgMonthly: 436193 },
  { tower: 'T3', total: 144, defaulters: 40, outstanding: 1035740.44, activeDefaulters: 15, inactiveDefaulters: 25, avgMonthly: 407778 },
  { tower: 'T4', total: 152, defaulters: 41, outstanding: 1233141.07, activeDefaulters: 13, inactiveDefaulters: 28, avgMonthly: 443410 },
  { tower: 'T5', total: 152, defaulters: 33, outstanding:  684218.52, activeDefaulters: 13, inactiveDefaulters: 20, avgMonthly: 457120 },
];

// ── Severity buckets (real from xlsx analysis) ────────
const SEVERITY_BUCKETS = [
  { label: 'Light',  range: '< ₹25K',      flats: 126, amount: 847169.98,   color: '#378add', bgColor: '#e6f1fb', textColor: '#185fa5' },
  { label: 'Medium', range: '₹25K – ₹75K', flats: 46,  amount: 2530706.79,  color: '#ef9f27', bgColor: '#faeeda', textColor: '#854f0b' },
  { label: 'Heavy',  range: '> ₹75K',       flats: 23,  amount: 1990181.94,  color: '#e24b4a', bgColor: '#fcebeb', textColor: '#a32d2d' },
];

// ── Top 25 defaulters (real from xlsx, sorted by O/S) ─
const TOP_DEFAULTERS = [
  { flat: 'T2-1101', outstanding: 105359.33 },
  { flat: 'T1-1005', outstanding: 104764.19 },
  { flat: 'T4-104',  outstanding: 104761.61 },
  { flat: 'T5-801',  outstanding: 104758.75 },
  { flat: 'T2-804',  outstanding: 104758.75 },
  { flat: 'T3-1507', outstanding: 100704.14 },
  { flat: 'T4-1802', outstanding: 100104.14 },
  { flat: 'T1-1002', outstanding:  99804.14 },
  { flat: 'T2-1602', outstanding:  85002.09 },
  { flat: 'T4-1801', outstanding:  84538.75 },
  { flat: 'T3-805',  outstanding:  79825.24 },
  { flat: 'T1-205',  outstanding:  77726.61 },
  { flat: 'T3-1701', outstanding:  76739.30 },
  { flat: 'T3-1205', outstanding:  76738.75 },
  { flat: 'T5-1901', outstanding:  76440.49 },
  { flat: 'T1-1908', outstanding:  76438.75 },
  { flat: 'T4-1601', outstanding:  76423.51 },
  { flat: 'T2-506',  outstanding:  76277.32 },
  { flat: 'T2-1308', outstanding:  76138.75 },
  { flat: 'T2-801',  outstanding:  76138.75 },
  { flat: 'T3-1308', outstanding:  75838.75 },
  { flat: 'T4-1104', outstanding:  75838.75 },
  { flat: 'T5-308',  outstanding:  75061.08 },
  { flat: 'T3-306',  outstanding:  73400.35 },
  { flat: 'T4-703',  outstanding:  73399.23 },
];

// ── Monthly collections from recharges CSV ────────────
const MONTHLY_TREND = [
  { month: 'May 25',  total: 2161598,  payers: 458 },
  { month: 'Jun 25',  total: 2285067,  payers: 471 },
  { month: 'Jul 25',  total: 2520087,  payers: 498 },
  { month: 'Aug 25',  total: 2560284,  payers: 502 },
  { month: 'Sep 25',  total: 2034034,  payers: 461 },
  { month: 'Oct 25',  total: 2282545,  payers: 428 },
  { month: 'Nov 25',  total: 1688885,  payers: 493 },
  { month: 'Dec 25',  total: 1976236,  payers: 483 },
  { month: 'Jan 26',  total: 2037148,  payers: 504 },
  { month: 'Feb 26',  total: 1792786,  payers: 485 },
  { month: 'Mar 26',  total: 1877981,  payers: 494 },
  { month: 'Apr 26',  total: 1926035,  payers: 493 },
];

// ── Unique payers per month by tower (real data) ──────
const PAYER_TABLE = [
  { month: 'Nov 2025',  t1: 102, t2: 91,  t3: 90, t4: 106, t5: 104 },
  { month: 'Dec 2025',  t1: 98,  t2: 94,  t3: 94, t4: 99,  t5: 98  },
  { month: 'Jan 2026',  t1: 101, t2: 102, t3: 95, t4: 110, t5: 96  },
  { month: 'Feb 2026',  t1: 93,  t2: 105, t3: 94, t4: 99,  t5: 94  },
  { month: 'Mar 2026',  t1: 106, t2: 94,  t3: 93, t4: 100, t5: 101 },
  { month: 'Apr 2026',  t1: 99,  t2: 95,  t3: 95, t4: 105, t5: 99  },
  { month: 'May 2026*', t1: 83,  t2: 73,  t3: 77, t4: 86,  t5: 87  },
];

const AVG_MONTHLY_MAINTENANCE = 2200; // ₹/flat/month (CAM + water + electricity)

// ── Formatters ────────────────────────────────────────
const fmt  = v => '₹' + Math.round(Number(v) || 0).toLocaleString('en-IN');
const fmtL = v => '₹' + (v / 100000).toFixed(1) + 'L';
const fmtK = v => {
  const n = Math.round(Number(v) || 0);
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
  if (n >= 1000)   return '₹' + (n / 1000).toFixed(1) + 'K';
  return '₹' + n;
};

// ── Stat Card ─────────────────────────────────────────
function StatCard({ label, value, sub, color, bg, icon, border }) {
  return (
    <div className={`rounded-xl p-4 ${bg} relative overflow-hidden`}>
      {border && <div className="absolute top-0 left-0 w-1 h-full" style={{ background: border }} />}
      <div className={`flex items-start justify-between ${border ? 'pl-2' : ''}`}>
        <div className="min-w-0">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-2xl font-black truncate" style={{ color }}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        {icon && <span className="text-2xl flex-shrink-0 ml-2">{icon}</span>}
      </div>
    </div>
  );
}

// ── Mini Bar ──────────────────────────────────────────
function MiniBar({ pct, color }) {
  return (
    <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden max-w-24">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ── Severity Pill ─────────────────────────────────────
function SeverityPill({ amount }) {
  if (amount > 75000)  return <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#fcebeb', color: '#a32d2d' }}>Heavy</span>;
  if (amount > 25000)  return <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#faeeda', color: '#854f0b' }}>Medium</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#e6f1fb', color: '#185fa5' }}>Light</span>;
}

// ── Donut Chart (pure SVG, no library needed) ─────────
function DonutChart({ segments, size = 130 }) {
  const r = 44, circ = 2 * Math.PI * r;
  const total = segments.reduce((s, g) => s + g.value, 0);
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
      {segments.map((seg, i) => {
        const pct  = total > 0 ? (seg.value / total) * 100 : 0;
        const dash = (pct / 100) * circ;
        const el = (
          <circle key={i} cx="50" cy="50" r={r} fill="none"
            stroke={seg.color} strokeWidth="14"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-(offset / 100) * circ} />
        );
        offset += pct;
        return el;
      })}
      <circle cx="50" cy="50" r="37" fill="white" />
    </svg>
  );
}

// ── Main DefaultersPage ───────────────────────────────
function DefaultersPage() {
  const [activeTab, setActiveTab] = React.useState('overview');

  const totalOutstanding = DEFAULTER_DATA.reduce((s, d) => s + d.outstanding, 0);
  const totalDefaulters  = DEFAULTER_DATA.reduce((s, d) => s + d.defaulters, 0);
  const totalFlats       = DEFAULTER_DATA.reduce((s, d) => s + d.total, 0);
  const totalActive      = DEFAULTER_DATA.reduce((s, d) => s + d.activeDefaulters, 0);
  const totalInactive    = DEFAULTER_DATA.reduce((s, d) => s + d.inactiveDefaulters, 0);
  const monthlyRevLoss   = totalDefaulters * AVG_MONTHLY_MAINTENANCE;
  const annualRevLoss    = monthlyRevLoss * 12;

  const worstTower = [...DEFAULTER_DATA].sort((a, b) => (b.defaulters / b.total) - (a.defaulters / a.total))[0];
  const bestTower  = [...DEFAULTER_DATA].sort((a, b) => (a.defaulters / a.total) - (b.defaulters / b.total))[0];

  const TABS = [
    ['overview',  '📊 Overview'],
    ['towers',    '🏢 Towers'],
    ['trend',     '📈 Trend'],
    ['top',       '⚠️ Top Defaulters'],
    ['recovery',  '🛡️ Recovery'],
  ];

  return (
    <div className="space-y-5 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Defaulter Analytics</h1>
          <p className="text-sm text-gray-500">
            Live data · {totalFlats} flats · {totalDefaulters} defaulters · As of May 2026
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {TABS.map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${activeTab === tab
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Alert banner */}
      <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 flex items-center gap-3">
        <span className="text-xl">🚨</span>
        <div>
          <p className="text-sm font-semibold text-red-800">
            {totalDefaulters} flats ({((totalDefaulters / totalFlats) * 100).toFixed(1)}%) have outstanding dues totalling {fmtL(totalOutstanding)}
          </p>
          <p className="text-xs text-red-600">
            Monthly revenue loss: <strong>{fmt(monthlyRevLoss)}</strong> ·
            Annual loss: <strong>{fmtK(annualRevLoss)}</strong> ·
            {totalInactive} flats fully inactive (highest risk)
          </p>
        </div>
      </div>

      {/* ══ OVERVIEW TAB ══ */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total O/S"        value={fmtL(totalOutstanding)} sub="Accumulated dues"    color="#a32d2d"  bg="bg-red-50"    border="#e24b4a" />
            <StatCard label="Defaulters"        value={totalDefaulters}         sub={`${((totalDefaulters/totalFlats)*100).toFixed(1)}% of society`} color="#a32d2d" bg="bg-white" border="#e24b4a" />
            <StatCard label="Avg dues / flat"   value={fmt(totalOutstanding / totalDefaulters)} sub="Per defaulting unit" color="#854f0b" bg="bg-amber-50" />
            <StatCard label="Active defaulters" value={totalActive}             sub="Still recharging"   color="#854f0b"  bg="bg-amber-50" />
            <StatCard label="Inactive flats"    value={totalInactive}           sub="No activity Feb+"   color="#a32d2d"  bg="bg-red-50" />
            <StatCard label="Monthly rev. loss" value={fmtK(monthlyRevLoss)}    sub={`₹${(annualRevLoss/100000).toFixed(1)}L/year`} color="#185fa5" bg="bg-blue-50" />
          </div>

          {/* Donuts + budget impact */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Severity donut */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Outstanding by severity</h3>
              <div className="flex items-center gap-4">
                <DonutChart size={120} segments={SEVERITY_BUCKETS.map(b => ({ value: b.amount, color: b.color }))} />
                <div className="space-y-2 flex-1">
                  {SEVERITY_BUCKETS.map(b => (
                    <div key={b.label} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded flex-shrink-0" style={{ background: b.color }} />
                      <span className="text-xs text-gray-600 flex-1">{b.label} ({b.range})</span>
                      <span className="text-xs font-bold" style={{ color: b.color }}>{fmtL(b.amount)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between">
                    <span className="text-xs font-semibold text-gray-700">Total</span>
                    <span className="text-xs font-bold text-red-600">{fmtL(totalOutstanding)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-3 border-t pt-4">
                {SEVERITY_BUCKETS.map(b => (
                  <div key={b.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">{b.label} — {b.flats} flats</span>
                      <span className="font-semibold" style={{ color: b.color }}>{fmtL(b.amount)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{ width: `${(b.amount / totalOutstanding) * 100}%`, background: b.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status donut */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Defaulter status</h3>
              <div className="flex items-center gap-4">
                <DonutChart size={120} segments={[
                  { value: totalFlats - totalDefaulters, color: '#1d9e75' },
                  { value: totalActive,                   color: '#ef9f27' },
                  { value: totalInactive,                 color: '#e24b4a' },
                ]} />
                <div className="space-y-2 flex-1">
                  {[
                    { label: 'Paying (no dues)',   value: totalFlats - totalDefaulters, color: '#1d9e75' },
                    { label: 'Active defaulters',  value: totalActive,                   color: '#ef9f27' },
                    { label: 'Inactive defaulters',value: totalInactive,                 color: '#e24b4a' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded flex-shrink-0" style={{ background: s.color }} />
                      <span className="text-xs text-gray-600 flex-1">{s.label}</span>
                      <span className="text-xs font-bold" style={{ color: s.color }}>{s.value}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between">
                    <span className="text-xs font-semibold text-gray-700">Total flats</span>
                    <span className="text-xs font-bold text-gray-700">{totalFlats}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 border-t pt-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Recovery priority</p>
                <div className="space-y-2">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                    <p className="text-xs font-semibold text-amber-700">⚡ Quick wins — {totalActive} flats</p>
                    <p className="text-xs text-amber-600 mt-0.5">Still using services. Apply amenity restrictions to prompt payment.</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                    <p className="text-xs font-semibold text-red-700">⚖️ Legal track — {totalInactive} flats</p>
                    <p className="text-xs text-red-600 mt-0.5">Fully inactive. Formal notice + committee escalation required.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Budget impact */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Budget impact</h3>
              <div className="space-y-3">
                {[
                  { label: 'Monthly revenue loss',    value: monthlyRevLoss,    color: '#e24b4a', bg: 'bg-red-50' },
                  { label: 'Quarterly revenue loss',  value: monthlyRevLoss * 3, color: '#e24b4a', bg: 'bg-red-50' },
                  { label: 'Annual revenue loss',     value: annualRevLoss,     color: '#dc2626', bg: 'bg-red-50' },
                  { label: 'Accumulated outstanding', value: totalOutstanding,  color: '#a32d2d', bg: 'bg-red-100' },
                ].map(r => (
                  <div key={r.label} className={`${r.bg} rounded-lg p-3 flex justify-between items-center`}>
                    <span className="text-xs text-gray-600">{r.label}</span>
                    <span className="text-sm font-bold" style={{ color: r.color }}>{fmt(r.value)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t pt-4 space-y-2">
                <p className="text-xs font-medium text-gray-500">Tower highlights</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                  <p className="text-xs font-semibold text-red-700">
                    ⚠️ Worst: {worstTower.tower} — {((worstTower.defaulters / worstTower.total) * 100).toFixed(1)}% default rate
                  </p>
                  <p className="text-xs text-red-500">{worstTower.defaulters} defaulters · {fmtL(worstTower.outstanding)}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-2.5">
                  <p className="text-xs font-semibold text-green-700">
                    ✓ Best: {bestTower.tower} — {((bestTower.defaulters / bestTower.total) * 100).toFixed(1)}% default rate
                  </p>
                  <p className="text-xs text-green-500">{bestTower.defaulters} defaulters · {fmtL(bestTower.outstanding)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ TOWERS TAB ══ */}
      {activeTab === 'towers' && (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {DEFAULTER_DATA.map(d => {
              const rate = (d.defaulters / d.total) * 100;
              const isWorst = d.tower === worstTower.tower;
              const isBest  = d.tower === bestTower.tower;
              return (
                <div key={d.tower}
                  className={`bg-white rounded-xl p-4 shadow-sm border-2 ${isWorst ? 'border-red-400' : isBest ? 'border-green-400' : 'border-transparent'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-black text-gray-900">{d.tower}</span>
                    {isWorst && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">Worst</span>}
                    {isBest  && <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-bold">Best</span>}
                  </div>
                  <p className="text-2xl font-black text-red-600">{rate.toFixed(1)}%</p>
                  <p className="text-xs text-gray-400 mb-2">{d.defaulters}/{d.total} flats</p>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div className="h-full rounded-full"
                      style={{ width: `${rate}%`, background: isWorst ? '#e24b4a' : isBest ? '#1d9e75' : '#ef9f27' }} />
                  </div>
                  <p className="text-xs font-semibold text-gray-700">{fmtL(d.outstanding)}</p>
                  <p className="text-xs text-gray-400">outstanding</p>
                </div>
              );
            })}
          </div>

          {/* Detailed table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Tower-wise breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    {['Tower','Flats','Defaulters','Default %','Total O/S','Avg dues/flat','Active def.','Inactive','Avg monthly','Monthly loss'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {DEFAULTER_DATA.map(d => {
                    const rate = (d.defaulters / d.total) * 100;
                    const avg  = d.outstanding / d.defaulters;
                    const loss = d.defaulters * AVG_MONTHLY_MAINTENANCE;
                    const isWorst = d.tower === worstTower.tower;
                    return (
                      <tr key={d.tower} className={`hover:bg-gray-50 ${isWorst ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3 font-black text-gray-900">
                          {d.tower}
                          {isWorst && <span className="ml-1 text-xs text-red-500">⚠</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{d.total}</td>
                        <td className="px-4 py-3 text-red-600 font-bold">{d.defaulters}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <MiniBar pct={rate} color={rate > 28 ? '#e24b4a' : rate > 24 ? '#ef9f27' : '#1d9e75'} />
                            <span className="text-xs font-bold text-gray-600">{rate.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-800">{fmtL(d.outstanding)}</td>
                        <td className="px-4 py-3 text-amber-600">{fmt(avg)}</td>
                        <td className="px-4 py-3 text-amber-600 font-semibold">{d.activeDefaulters}</td>
                        <td className="px-4 py-3 text-red-500 font-semibold">{d.inactiveDefaulters}</td>
                        <td className="px-4 py-3 text-blue-600">{fmtK(d.avgMonthly)}</td>
                        <td className="px-4 py-3 text-red-500">{fmtK(loss)}</td>
                      </tr>
                    );
                  })}
                  {/* Totals row */}
                  <tr className="bg-gray-100 font-bold">
                    <td className="px-4 py-3 text-gray-900">Total</td>
                    <td className="px-4 py-3 text-gray-700">{totalFlats}</td>
                    <td className="px-4 py-3 text-red-700">{totalDefaulters}</td>
                    <td className="px-4 py-3 text-gray-700">{((totalDefaulters / totalFlats) * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3 text-red-700">{fmtL(totalOutstanding)}</td>
                    <td className="px-4 py-3 text-amber-700">{fmt(totalOutstanding / totalDefaulters)}</td>
                    <td className="px-4 py-3 text-amber-700">{totalActive}</td>
                    <td className="px-4 py-3 text-red-700">{totalInactive}</td>
                    <td className="px-4 py-3 text-blue-700">
                      {fmtK(DEFAULTER_DATA.reduce((s, d) => s + d.avgMonthly, 0))}
                    </td>
                    <td className="px-4 py-3 text-red-700">{fmtK(monthlyRevLoss)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ TREND TAB ══ */}
      {activeTab === 'trend' && (
        <div className="space-y-5">
          {/* Monthly bar chart — pure CSS */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Monthly recharge collections (May 2025 – Apr 2026)</h3>
            <p className="text-xs text-gray-400 mb-5">Utility meter recharges only — excludes maintenance dues. Peak: Aug 2025 (₹25.6L)</p>
            <div className="flex items-end gap-1.5 h-48">
              {MONTHLY_TREND.map((m, i) => {
                const maxVal = Math.max(...MONTHLY_TREND.map(x => x.total));
                const pct = (m.total / maxVal) * 100;
                const isLow  = m.total < 1800000;
                const isPeak = m.total === maxVal;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold" style={{ color: isPeak ? '#185fa5' : isLow ? '#a32d2d' : '#6b7280' }}>
                      {(m.total / 100000).toFixed(1)}L
                    </span>
                    <div className="w-full rounded-t-sm transition-all"
                      style={{
                        height: `${pct}%`,
                        background: isPeak ? '#185fa5' : isLow ? '#e24b4a' : '#378add',
                        minHeight: 4
                      }} />
                    <span className="text-xs text-gray-400 text-center" style={{ fontSize: 10 }}>{m.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payer count table */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Unique paying flats per month by tower</h3>
            <p className="text-xs text-gray-400 mb-4">
              *May 2026 is partial (data cut-off: 16 May 2026). Total possible: 152+152+144+152+152 = {totalFlats}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    {['Month','T1','T2','T3','T4','T5','Total','Coverage'].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {PAYER_TABLE.map(row => {
                    const total = row.t1 + row.t2 + row.t3 + row.t4 + row.t5;
                    const coverage = ((total / totalFlats) * 100).toFixed(1);
                    const isPartial = row.month.includes('*');
                    return (
                      <tr key={row.month} className={`hover:bg-gray-50 ${isPartial ? 'text-gray-400 italic' : ''}`}>
                        <td className="px-4 py-2 font-medium text-gray-700">{row.month}</td>
                        <td className="px-4 py-2 text-gray-600">{row.t1}</td>
                        <td className="px-4 py-2 text-gray-600">{row.t2}</td>
                        <td className="px-4 py-2 text-gray-600">{row.t3}</td>
                        <td className="px-4 py-2 text-gray-600">{row.t4}</td>
                        <td className="px-4 py-2 text-gray-600">{row.t5}</td>
                        <td className="px-4 py-2 font-bold text-gray-800">{total}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-blue-400"
                                style={{ width: `${coverage}%` }} />
                            </div>
                            <span className={`text-xs font-bold ${parseFloat(coverage) >= 65 ? 'text-green-600' : 'text-amber-600'}`}>
                              {coverage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ TOP DEFAULTERS TAB ══ */}
      {activeTab === 'top' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Top 25 Defaulters by Outstanding Amount</h3>
                <p className="text-xs text-gray-400 mt-0.5">As of May 2026 · Estimated months based on ₹{AVG_MONTHLY_MAINTENANCE.toLocaleString('en-IN')}/month avg maintenance</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Top 25 account for</p>
                <p className="text-sm font-bold text-red-600">
                  {fmtL(TOP_DEFAULTERS.reduce((s, d) => s + d.outstanding, 0))} (
                  {((TOP_DEFAULTERS.reduce((s, d) => s + d.outstanding, 0) / totalOutstanding) * 100).toFixed(1)}%)
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    {['#','Flat','Tower','Outstanding','Severity','~Months unpaid','Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {TOP_DEFAULTERS.map((d, i) => {
                    const tower   = d.flat.split('-')[0];
                    const months  = Math.round(d.outstanding / AVG_MONTHLY_MAINTENANCE);
                    const action  = d.outstanding > 75000 ? '⚖️ Legal notice' : d.outstanding > 25000 ? '🚫 Restrict amenities' : '📱 Send reminder';
                    return (
                      <tr key={d.flat} className={`hover:bg-gray-50 ${i < 3 ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3 text-xs text-gray-400 font-bold">{i + 1}</td>
                        <td className="px-4 py-3 font-black text-gray-900">{d.flat}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-bold">{tower}</span>
                        </td>
                        <td className="px-4 py-3 font-black text-red-600">{fmt(d.outstanding)}</td>
                        <td className="px-4 py-3"><SeverityPill amount={d.outstanding} /></td>
                        <td className="px-4 py-3 text-amber-600 font-semibold">~{months} months</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{action}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ RECOVERY TAB ══ */}
      {activeTab === 'recovery' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {[
              {
                tier: 'Tier 1 — Soft reminder',
                severity: 'Light',
                range: '< ₹25K',
                flats: 126,
                outstanding: 847170,
                color: '#185fa5',
                bg: 'bg-blue-50',
                border: 'border-blue-200',
                icon: '📱',
                steps: [
                  'WhatsApp / SMS automated reminder',
                  'App push notification via resident portal',
                  'Monthly statement email with dues highlighted',
                  'Friendly follow-up call from admin',
                ],
                note: 'Most likely to self-resolve within 30 days.',
              },
              {
                tier: 'Tier 2 — Amenity restriction',
                severity: 'Medium',
                range: '₹25K – ₹75K',
                flats: 46,
                outstanding: 2530707,
                color: '#854f0b',
                bg: 'bg-amber-50',
                border: 'border-amber-200',
                icon: '🚫',
                steps: [
                  'Restrict clubhouse & gym access',
                  'Suspend intercom services',
                  'Formal written notice via registered post',
                  'Flag on noticeboard (per bye-laws)',
                  'One-on-one meeting with RWA committee',
                ],
                note: 'Apply after 2 failed soft reminders. Lift restrictions on full payment.',
              },
              {
                tier: 'Tier 3 — Legal escalation',
                severity: 'Heavy',
                range: '> ₹75K',
                flats: 23,
                outstanding: 1990182,
                color: '#a32d2d',
                bg: 'bg-red-50',
                border: 'border-red-200',
                icon: '⚖️',
                steps: [
                  'Formal legal notice (advocate-drafted)',
                  'File complaint with local housing authority',
                  'Committee resolution for recovery action',
                  'Consider civil court suit if unresponsive',
                  'Report to credit bureaus if applicable',
                ],
                note: 'These 23 flats hold ₹19.9L — each requires individual legal track.',
              },
            ].map(tier => (
              <div key={tier.tier} className={`${tier.bg} border ${tier.border} rounded-xl p-5`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{tier.icon}</span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: tier.color }}>{tier.tier}</p>
                    <p className="text-xs" style={{ color: tier.color }}>
                      {tier.flats} flats · {fmtL(tier.outstanding)} · {tier.range}
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 mb-3">
                  {tier.steps.map((step, i) => (
                    <li key={i} className="flex gap-2 text-xs" style={{ color: tier.color }}>
                      <span className="flex-shrink-0 font-bold">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs italic opacity-70" style={{ color: tier.color }}>{tier.note}</p>
              </div>
            ))}
          </div>

          {/* Summary table */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Recovery projection (optimistic scenario)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    {['Tier','Flats','O/S Amount','Recovery rate','Expected recovery','Timeline'].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { tier: 'Light (soft reminders)', flats: 126, amount: 847170,   rate: 70, timeline: '30–60 days' },
                    { tier: 'Medium (amenity block)',  flats: 46,  amount: 2530707,  rate: 55, timeline: '60–120 days' },
                    { tier: 'Heavy (legal)',           flats: 23,  amount: 1990182,  rate: 40, timeline: '90–180 days' },
                  ].map(r => {
                    const recovered = r.amount * (r.rate / 100);
                    return (
                      <tr key={r.tier} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-700 font-medium">{r.tier}</td>
                        <td className="px-4 py-2 text-gray-500">{r.flats}</td>
                        <td className="px-4 py-2 font-semibold text-red-500">{fmtL(r.amount)}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-green-400" style={{ width: `${r.rate}%` }} />
                            </div>
                            <span className="text-xs font-bold text-green-600">{r.rate}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 font-bold text-green-600">{fmtL(recovered)}</td>
                        <td className="px-4 py-2 text-xs text-gray-400">{r.timeline}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-green-50 font-bold">
                    <td className="px-4 py-2 text-gray-800">Total projection</td>
                    <td className="px-4 py-2 text-gray-700">{totalDefaulters}</td>
                    <td className="px-4 py-2 text-red-700">{fmtL(totalOutstanding)}</td>
                    <td className="px-4 py-2 text-green-700">~56%</td>
                    <td className="px-4 py-2 text-green-700">
                      {fmtL(847170 * 0.7 + 2530707 * 0.55 + 1990182 * 0.4)}
                    </td>
                    <td className="px-4 py-2 text-gray-500">Within 6 months</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              * Recovery rates are estimates. Actual results depend on enforcement consistency and legal timelines.
              Projections assume no new defaults during recovery period.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
