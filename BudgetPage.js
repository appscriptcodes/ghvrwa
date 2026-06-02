/* ===================================================
   BudgetPage.js — CAM Budget Analytics Dashboard
   Global Hillview Society

   Flat data:
     Type A: 376 flats × 585.41 carpet + 99.11 balcony = 684.52 sq ft
     Type B: 376 flats × 554.17 carpet + 98.81 balcony = 652.98 sq ft
     Total : 752 flats

   CAM Rate       : ₹2.57/sq ft (carpet + balcony)
   Water          : ₹300/flat/month (separate)
   Electricity    : ₹60/flat/month fixed (common area, separate)
                  + ₹6.80/unit for variable common area units
   Occupied flats : adjustable (not all flats pay maintenance)
   Expenses       : saved in localStorage — persist across sessions
   =================================================== */

const BUDGET_CONSTANTS = {
  TYPE_A:         { count: 376, area: 585.41, balcony: 99.11 },
  TYPE_B:         { count: 376, area: 554.17, balcony: 98.81 },
  CAM_RATE:       2.57,
  WATER_PER_FLAT: 300,
  ELEC_FIXED:     60,    // ₹60 fixed per flat per month
  ELEC_RATE:      6.80,  // ₹ per unit for variable
  ELEC_UNITS:     0,  // common area units/month
  TOTAL_FLATS:    752,
};

// Total chargeable area per flat (carpet + balcony)
const AREA_A = BUDGET_CONSTANTS.TYPE_A.area + BUDGET_CONSTANTS.TYPE_A.balcony; // 684.52
const AREA_B = BUDGET_CONSTANTS.TYPE_B.area + BUDGET_CONSTANTS.TYPE_B.balcony; // 652.98

const DEFAULT_EXPENSES = [
  // ── Manpower & Operations ──
  { id: 'enviro_mp',      label: 'Enviro – Admin, Technical, HK, Horticulture', amount: 874486, icon: '🧹', color: '#10b981' },
  { id: 'security',       label: 'Security Manpower & Operations',               amount: 450000, icon: '🛡️', color: '#3b82f6' },
  { id: 'stp',            label: 'STP Manpower & Operation',                     amount: 145000, icon: '💧', color: '#0ea5e9' },
  // ── Consumables ──
  { id: 'elec_cons',      label: 'Electrical Consumables',                       amount: 20000,  icon: '⚡', color: '#f59e0b' },
  { id: 'plumb_cons',     label: 'Plumbing Consumables',                         amount: 25000,  icon: '🔧', color: '#ea580c' },
  { id: 'civil_cons',     label: 'Civil Consumables',                            amount: 15000,  icon: '🏗️', color: '#78716c' },
  { id: 'horti_cons',     label: 'Horticulture Consumables',                     amount: 5000,   icon: '🌿', color: '#22c55e' },
  { id: 'hk_cons',        label: 'House Keeping Consumables',                    amount: 8700,   icon: '🧴', color: '#6b7280' },
  // ── Compliance & Liaison ──
  { id: 'compliance',     label: 'Compliances & Liasoning',                      amount: 70000,  icon: '🏛️', color: '#1d4ed8' },
  // ── AMC & Maintenance ──
  { id: 'lift_amc',       label: 'Lift AMC',                                     amount: 62500,  icon: '🛗', color: '#7c3aed' },
  { id: 'dg_amc',         label: 'D.G Sets AMC',                                 amount: 5833,   icon: '⚙️', color: '#475569' },
  { id: 'dg_bcheck',      label: 'D.G Sets B.Check',                             amount: 13750,  icon: '🔩', color: '#64748b' },
  { id: 'fire_bcheck',    label: 'Fire Engine B Check',                          amount: 1250,   icon: '🚒', color: '#ef4444' },
  { id: 'plumb_pump',     label: 'Plumbing Pump Repairs',                        amount: 6250,   icon: '🪛', color: '#f97316' },
  { id: 'fire_panel',     label: 'Fire Panel AMC & Repair',                      amount: 10417,  icon: '🔥', color: '#dc2626' },
  { id: 'lt_ht_amc',      label: 'LT & HT AMC',                                  amount: 6250,   icon: '🔌', color: '#0f766e' },
  { id: 'transformer',    label: 'Transformer Servicing & Dehydration',           amount: 3333,   icon: '⚡', color: '#0d9488' },
  { id: 'rwh',            label: 'RWH Pits Cleaning',                            amount: 8333,   icon: '🌧️', color: '#38bdf8' },
  { id: 'sewage',         label: 'Sewage Lines Cleaning',                        amount: 8333,   icon: '🚿', color: '#7dd3fc' },
  { id: 'pest',           label: 'Pest Control Services',                        amount: 11000,  icon: '🐛', color: '#84cc16' },
  // ── Vendors ──
  { id: 'garbage',        label: 'Garbage Picking Vendor',                       amount: 18880,  icon: '🗑️', color: '#a3a3a3' },
  { id: 'inn4smart',      label: 'Inn4Smart Solutions',                          amount: 26621,  icon: '📡', color: '#8b5cf6' },
  { id: 'boom',           label: 'Boom Barrier',                                 amount: 14160,  icon: '🚧', color: '#a855f7' },
  { id: 'cctv',           label: 'CCTV AMC',                                     amount: 8333,   icon: '📷', color: '#6366f1' },
  // ── Miscellaneous & Admin ──
  { id: 'events',         label: 'Events Expenditure',                           amount: 6250,   icon: '🎉', color: '#ec4899' },
  { id: 'pantry',         label: 'Pantry Expenditure',                           amount: 2000,   icon: '☕', color: '#b45309' },
  { id: 'pettycash',      label: 'Petty Cash',                                   amount: 25000,  icon: '💵', color: '#059669' },
  { id: 'misc',           label: 'Miscellaneous Expenses',                       amount: 25000,  icon: '📦', color: '#d97706' },
  { id: 'insurance',      label: 'Building Insurance',                           amount: 2500,   icon: '🏢', color: '#2563eb' },
  { id: 'it',             label: 'IT Expenses',                                  amount: 6250,   icon: '💻', color: '#7c3aed' },
  { id: 'batteries',      label: 'Batteries – DG, Lifts, Fire, ARD, UPS',       amount: 12500,  icon: '🔋', color: '#f59e0b' },
  { id: 'legal',          label: 'Legal Fees',                                   amount: 6250,   icon: '⚖️', color: '#1e40af' },
  { id: 'ca',             label: 'CA Fees',                                      amount: 8000,   icon: '📊', color: '#0369a1' },
  { id: 'ppe',            label: 'PPE Kits',                                     amount: 1250,   icon: '🦺', color: '#15803d' },
  { id: 'tools',          label: 'Tools & Tackle Engineering',                   amount: 2000,   icon: '🧰', color: '#92400e' },
  { id: 'stationary',     label: 'Stationary',                                   amount: 3500,   icon: '📎', color: '#9ca3af' },
  { id: 'hk_machinery',   label: 'H.K Machinery',                               amount: 4200,   icon: '🧽', color: '#6b7280' },
  { id: 'horti_mach',     label: 'Horticulture Machinery',                       amount: 2000,   icon: '🌱', color: '#16a34a' },
  { id: 'fire_ext',       label: 'Fire Extinguishers',                           amount: 10833,  icon: '🧯', color: '#b91c1c' },
  { id: 'diesel',         label: 'Diesel Expense',                               amount: 100000, icon: '⛽', color: '#dc2626' },
  { id: 'solar',          label: 'Solar System Repair & Maintenance',            amount: 5000,   icon: '☀️', color: '#eab308' },
  { id: 'sinking',        label: 'Sinking Fund',                                 amount: 16667,  icon: '🏦', color: '#14b8a6' },
];

const LS_KEY = 'ghv_budget_v3';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch(_) { return null; }
}

function saveToStorage(state) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch(_) {}
}

// ── Helpers ───────────────────────────────────────────
const fmt  = v => '₹' + Math.round(Number(v)||0).toLocaleString('en-IN');
const fmtK = v => {
  const n = Math.round(Number(v)||0);
  if (n >= 100000) return '₹' + (n/100000).toFixed(2) + 'L';
  if (n >= 1000)   return '₹' + (n/1000).toFixed(1)   + 'K';
  return '₹' + n;
};

// ── Sub-components ────────────────────────────────────
function BStatCard({ label, value, sub, color, bg, icon }) {
  return (
    <div className={`rounded-xl p-4 ${bg}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
          <p className="text-xl font-bold truncate" style={{ color }}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <span className="text-2xl flex-shrink-0 ml-2">{icon}</span>
      </div>
    </div>
  );
}

function BudgetBar({ label, icon, amount, total, color, editable, onChange }) {
  const pct = total > 0 ? Math.min((amount/total)*100, 100) : 0;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-base w-6 flex-shrink-0 text-center">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700 truncate pr-2">{label}</span>
          {editable ? (
            <input type="number" value={amount}
              onChange={e => onChange(Number(e.target.value)||0)}
              className="text-xs font-bold w-28 text-right border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
              style={{ color }} />
          ) : (
            <span className="text-xs font-bold flex-shrink-0" style={{ color }}>{fmt(amount)}</span>
          )}
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}

function DonutB({ segments, size=120 }) {
  let offset = 0;
  const r = 40, circ = 2*Math.PI*r;
  const total = segments.reduce((s,g) => s+g.value, 0);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
      {segments.map((seg,i) => {
        const pct  = total > 0 ? (seg.value/total)*100 : 0;
        const dash = (pct/100)*circ;
        const el = (
          <circle key={i} cx="50" cy="50" r={r} fill="none"
            stroke={seg.color} strokeWidth="18"
            strokeDasharray={`${dash} ${circ-dash}`}
            strokeDashoffset={-offset*circ/100} />
        );
        offset += pct;
        return el;
      })}
      <circle cx="50" cy="50" r="31" fill="white" />
    </svg>
  );
}

// ── Occupied Flats Adjuster ───────────────────────────
function FlatsAdjuster({ occupiedA, occupiedB, setOccupiedA, setOccupiedB, camRate, waterRate, elecFixed }) {
  const maxA = BUDGET_CONSTANTS.TYPE_A.count;
  const maxB = BUDGET_CONSTANTS.TYPE_B.count;
  const totalMax = maxA + maxB;
  const totalOcc = occupiedA + occupiedB;
  const totalPct = totalMax > 0 ? ((totalOcc / totalMax) * 100).toFixed(1) : '0.0';
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">Paying Flats Adjustment</h3>
      <p className="text-xs text-gray-400 mb-4">Not all flats may be paying maintenance. Adjust to reflect actual collections.</p>
      <div className="space-y-4">
        {[
          { label: 'Type A Flats', max: maxA, val: occupiedA, set: setOccupiedA, color: '#3b82f6', area: AREA_A },
          { label: 'Type B Flats', max: maxB, val: occupiedB, set: setOccupiedB, color: '#6366f1', area: AREA_B },
        ].map(f => {
          const payingPct = f.max > 0 ? ((f.val / f.max) * 100).toFixed(1) : '0.0';
          const lossPerFlat = f.area * camRate + waterRate + elecFixed;
          const notPaying = f.max - f.val;
          return (
          <div key={f.label}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600">{f.label}</span>
              <span className="text-xs text-gray-400">
                {f.val} / {f.max} paying
                <span className="ml-1.5 font-semibold" style={{color: f.color}}>({payingPct}%)</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => f.set(Math.max(0, f.val - 1))}
                className="w-8 h-8 flex-shrink-0 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600 font-bold text-lg transition-colors">−</button>
              <div className="flex-1">
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width:`${(f.val/f.max)*100}%`, background: f.color }} />
                </div>
              </div>
              <button onClick={() => f.set(Math.min(f.max, f.val + 1))}
                className="w-8 h-8 flex-shrink-0 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-green-50 hover:border-green-300 hover:text-green-600 font-bold text-lg transition-colors">+</button>
              <input type="number" value={f.val} min={0} max={f.max}
                onChange={e => f.set(Math.min(f.max, Math.max(0, Number(e.target.value)||0)))}
                className="w-16 text-center border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{ color: f.color }} />
            </div>
            {notPaying > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ {notPaying} flat{notPaying > 1 ? 's' : ''} not paying · Loss: {fmt(notPaying * lossPerFlat)}/month
                <span className="ml-1 text-amber-500">({(100 - parseFloat(payingPct)).toFixed(1)}% unpaid)</span>
              </p>
            )}
          </div>
          );
        })}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total paying flats</span>
            <div className="text-right">
              <span className="font-bold text-amber-700">{totalOcc} / {totalMax}</span>
              <span className="ml-2 text-xs font-semibold text-amber-600">({totalPct}%)</span>
            </div>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-gray-600">Non-paying flats</span>
            <div className="text-right">
              <span className="font-bold text-red-500">{totalMax - totalOcc}</span>
              <span className="ml-2 text-xs font-semibold text-red-400">({(100 - parseFloat(totalPct)).toFixed(1)}% unpaid)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Per-flat Breakdown Card ───────────────────────────
function PerFlatCard({ label, carpetArea, balconyArea, camRate, waterRate, elecFixed, elecVarPerFlat }) {
  const camCarpet  = carpetArea  * camRate;
  const camBalcony = balconyArea * camRate;
  const camTotal   = camCarpet + camBalcony;
  const grand      = camTotal + waterRate + elecFixed + elecVarPerFlat;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <h4 className="text-sm font-semibold text-gray-800 mb-1">{label}</h4>
      <p className="text-xs text-gray-400 mb-4">
        Carpet {carpetArea} + Balcony {balconyArea} = {(carpetArea+balconyArea).toFixed(2)} sq ft
      </p>

      <div className="bg-blue-50 rounded-lg p-3 mb-3">
        <p className="text-xs font-semibold text-blue-700 mb-2">CAM Charges @ ₹{camRate}/sq ft</p>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Carpet ({carpetArea} sq ft)</span>
            <span className="font-medium text-blue-600">{fmt(camCarpet)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Balcony ({balconyArea} sq ft)</span>
            <span className="font-medium text-blue-600">{fmt(camBalcony)}</span>
          </div>
          <div className="flex justify-between text-xs border-t border-blue-200 pt-1.5">
            <span className="font-semibold text-blue-700">CAM Total</span>
            <span className="font-bold text-blue-700">{fmt(camTotal)}</span>
          </div>
        </div>
      </div>

      <div className="bg-sky-50 rounded-lg p-3 mb-3 flex justify-between items-center">
        <div>
          <p className="text-xs font-semibold text-sky-700">💧 Water Charges</p>
          <p className="text-xs text-sky-400">Fixed monthly levy</p>
        </div>
        <span className="text-base font-bold text-sky-600">{fmt(waterRate)}</span>
      </div>

      <div className="bg-amber-50 rounded-lg p-3 mb-3">
        <p className="text-xs font-semibold text-amber-700 mb-2">⚡ Electricity Charges</p>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Fixed common area (per flat)</span>
            <span className="font-medium text-amber-600">{fmt(elecFixed)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Variable units share (per flat)</span>
            <span className="font-medium text-amber-600">{fmt(elecVarPerFlat)}</span>
          </div>
          <div className="flex justify-between text-xs border-t border-amber-200 pt-1.5">
            <span className="font-semibold text-amber-700">Electricity Total</span>
            <span className="font-bold text-amber-700">{fmt(elecFixed + elecVarPerFlat)}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-3 flex justify-between items-center">
        <span className="text-sm font-bold text-white">Monthly Total / Flat</span>
        <span className="text-lg font-bold text-green-400">{fmt(grand)}</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[['CAM',camTotal,'#3b82f6'],['Water',waterRate,'#0ea5e9'],['Elec',elecFixed+elecVarPerFlat,'#f59e0b']].map(([l,v,c])=>(
          <div key={l} className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-400">{l}</p>
            <p className="text-xs font-bold mt-0.5" style={{color:c}}>{((v/grand)*100).toFixed(0)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Budget Page ──────────────────────────────────
function BudgetPage() {
  const { useState, useMemo, useCallback, useEffect } = React;

  // Load saved state from localStorage on mount
  const saved = loadFromStorage();

  const [expenses,   setExpenses]   = useState(() => saved?.expenses   || DEFAULT_EXPENSES);
  const [camRate,    setCamRate]    = useState(() => saved?.camRate    ?? BUDGET_CONSTANTS.CAM_RATE);
  const [waterRate,  setWaterRate]  = useState(() => saved?.waterRate  ?? BUDGET_CONSTANTS.WATER_PER_FLAT);
  const [elecFixed,  setElecFixed]  = useState(() => saved?.elecFixed  ?? BUDGET_CONSTANTS.ELEC_FIXED);
  const [elecRate,   setElecRate]   = useState(() => saved?.elecRate   ?? BUDGET_CONSTANTS.ELEC_RATE);
  const [elecUnits,  setElecUnits]  = useState(() => saved?.elecUnits  ?? BUDGET_CONSTANTS.ELEC_UNITS);
  const [occupiedA,  setOccupiedA]  = useState(() => saved?.occupiedA  ?? BUDGET_CONSTANTS.TYPE_A.count);
  const [occupiedB,  setOccupiedB]  = useState(() => saved?.occupiedB  ?? BUDGET_CONSTANTS.TYPE_B.count);
  const [editMode,   setEditMode]   = useState(false);
  const [activeTab,  setActiveTab]  = useState('overview');
  const [saveMsg,    setSaveMsg]    = useState('');

  const totalOccupied = occupiedA + occupiedB;
  const totalFlats    = BUDGET_CONSTANTS.TOTAL_FLATS;

  // ── Save to localStorage whenever anything changes ─
  useEffect(() => {
    saveToStorage({ expenses, camRate, waterRate, elecFixed, elecRate, elecUnits, occupiedA, occupiedB });
  }, [expenses, camRate, waterRate, elecFixed, elecRate, elecUnits, occupiedA, occupiedB]);

  // ── Revenue (based on occupied flats only) ─────────
  const revenue = useMemo(() => {
    const camA      = occupiedA * AREA_A * camRate;
    const camB      = occupiedB * AREA_B * camRate;
    const water     = totalOccupied * waterRate;
    const elecF     = totalOccupied * elecFixed;
    const elecVar   = elecUnits * elecRate;
    const totalCam  = camA + camB;
    const totalElec = elecF + elecVar;
    const total     = totalCam + water + totalElec;
    return { camA, camB, totalCam, water, elecF, elecVar, totalElec, total };
  }, [camRate, waterRate, elecFixed, elecRate, elecUnits, occupiedA, occupiedB, totalOccupied]);

  // Revenue if ALL 752 flats were paying
  const revenueIfFull = useMemo(() => {
    const camA    = BUDGET_CONSTANTS.TYPE_A.count * AREA_A * camRate;
    const camB    = BUDGET_CONSTANTS.TYPE_B.count * AREA_B * camRate;
    const water   = totalFlats * waterRate;
    const elecF   = totalFlats * elecFixed;
    const elecVar = elecUnits  * elecRate;
    return camA + camB + water + elecF + elecVar;
  }, [camRate, waterRate, elecFixed, elecRate, elecUnits]);

  const totalExpenses = useMemo(() =>
    expenses.reduce((s,e) => s + (Number(e.amount)||0), 0), [expenses]);

  const surplus    = revenue.total - totalExpenses;
  const lostRev    = revenueIfFull - revenue.total;
  const elecVarPF  = (elecUnits / totalFlats) * elecRate;

  // Break-even CAM rate
  const totalChargeableArea =
    (occupiedA * AREA_A) + (occupiedB * AREA_B);
  const camNeeded = totalChargeableArea > 0
    ? (totalExpenses - revenue.water - revenue.elecF - revenue.elecVar) / totalChargeableArea
    : 0;

  const topExpenses = [...expenses].sort((a,b) => b.amount - a.amount).slice(0,5);

  const donutRevenue = [
    { label:'CAM Type A', value: revenue.camA,    color:'#3b82f6' },
    { label:'CAM Type B', value: revenue.camB,    color:'#6366f1' },
    { label:'Water',      value: revenue.water,   color:'#0ea5e9' },
    { label:'Elec Fixed', value: revenue.elecF,   color:'#f59e0b' },
    { label:'Elec Units', value: revenue.elecVar, color:'#fb923c' },
  ];

  const expenseGroups = [
    { label:'Manpower',    ids:['enviro_mp','security','stp'],                                                                                         color:'#3b82f6' },
    { label:'AMC & Maint', ids:['lift_amc','dg_amc','dg_bcheck','fire_bcheck','plumb_pump','fire_panel','lt_ht_amc','transformer','fire_ext','solar','boom','cctv','inn4smart'], color:'#f59e0b' },
    { label:'Operations',  ids:['diesel','pest','garbage','rwh','sewage','elec_cons','plumb_cons','civil_cons','horti_cons','hk_cons','batteries','tools','hk_machinery','horti_mach','ppe'], color:'#10b981' },
    { label:'Admin/Misc',  ids:['compliance','events','pantry','pettycash','misc','insurance','it','legal','ca','stationary','sinking'],               color:'#8b5cf6' },
  ].map(g => ({ ...g, value: expenses.filter(e => g.ids.includes(e.id)).reduce((s,e) => s+e.amount, 0) }));

  const updateExpense = useCallback((id, val) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, amount: val } : e));
  }, []);

  const reset = () => {
    setExpenses(DEFAULT_EXPENSES);
    setCamRate(BUDGET_CONSTANTS.CAM_RATE);
    setWaterRate(BUDGET_CONSTANTS.WATER_PER_FLAT);
    setElecFixed(BUDGET_CONSTANTS.ELEC_FIXED);
    setElecRate(BUDGET_CONSTANTS.ELEC_RATE);
    setElecUnits(BUDGET_CONSTANTS.ELEC_UNITS);
    setOccupiedA(BUDGET_CONSTANTS.TYPE_A.count);
    setOccupiedB(BUDGET_CONSTANTS.TYPE_B.count);
    localStorage.removeItem(LS_KEY);
    setSaveMsg('Reset to defaults');
    setTimeout(() => setSaveMsg(''), 2000);
  };

  const manualSave = () => {
    saveToStorage({ expenses, camRate, waterRate, elecFixed, elecRate, elecUnits, occupiedA, occupiedB });
    setSaveMsg('✓ Saved');
    setTimeout(() => setSaveMsg(''), 2000);
  };

  const TABS = [
    ['overview',    '📊 Overview'],
    ['perflat',     '🏠 Per Flat'],
    ['flats',       '🏢 Paying Flats'],
    ['breakdown',   '📋 Expenses'],
    ['simulation',  '🔮 Simulator'],
  ];

  return (
    <div className="space-y-5 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">CAM Budget Dashboard</h1>
          <p className="text-sm text-gray-500">
            {totalOccupied}/{totalFlats} paying flats · ₹{camRate}/sq ft · ₹{waterRate} water · ₹{elecFixed} elec fixed/flat
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {TABS.map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${activeTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
              {label}
            </button>
          ))}
          <button onClick={() => setEditMode(e => !e)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all
              ${editMode ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            {editMode ? '✓ Done' : '✏️ Edit'}
          </button>
          <button onClick={manualSave}
            className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium">
            💾 Save
          </button>
          <button onClick={reset}
            className="px-3 py-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-sm">
            ↺ Reset
          </button>
          {saveMsg && <span className="text-xs text-green-600 font-medium">{saveMsg}</span>}
        </div>
      </div>

      {/* Non-paying alert */}
      {activeTab === 'overview' && totalOccupied < totalFlats && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-5 py-3 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {totalFlats - totalOccupied} flats not paying maintenance
            </p>
            <p className="text-xs text-amber-600">
              Monthly revenue loss: <strong>{fmt(lostRev)}</strong> · Annual loss: <strong>{fmtK(lostRev * 12)}</strong> · Go to "Paying Flats" tab to adjust.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <BStatCard label="Monthly Revenue"   value={fmtK(revenue.total)}    sub={fmt(revenue.total)}      color="#2563eb" bg="bg-blue-50"   icon="💰" />
        <BStatCard label="Monthly Expenses"  value={fmtK(totalExpenses)}     sub={fmt(totalExpenses)}      color="#dc2626" bg="bg-red-50"    icon="📤" />
        <BStatCard label={surplus>=0 ? 'Surplus' : 'Deficit'}
          value={fmtK(Math.abs(surplus))} sub={surplus>=0 ? 'Healthy ✓' : 'Increase CAM ⚠️'}
          color={surplus>=0 ? '#16a34a' : '#dc2626'} bg={surplus>=0 ? 'bg-green-50' : 'bg-red-50'} icon={surplus>=0 ? '✅' : '⚠️'} />
        <BStatCard label="Annual Projection" value={fmtK(revenue.total*12)} sub={`Exp: ${fmtK(totalExpenses*12)}`} color="#7c3aed" bg="bg-purple-50" icon="📅" />
      </div>

      {/* ══ OVERVIEW TAB ══ */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Revenue donut */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Revenue Breakdown</h3>
              <div className="flex items-center gap-4">
                <DonutB segments={donutRevenue} size={110} />
                <div className="space-y-2 flex-1">
                  {donutRevenue.map(seg => (
                    <div key={seg.label} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:seg.color}} />
                      <span className="text-xs text-gray-600 flex-1">{seg.label}</span>
                      <span className="text-xs font-bold" style={{color:seg.color}}>{fmtK(seg.value)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between">
                    <span className="text-xs font-semibold text-gray-700">Total</span>
                    <span className="text-xs font-bold text-blue-600">{fmt(revenue.total)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 border-t pt-4 space-y-2">
                {[
                  [`CAM Type A (${occupiedA}×${AREA_A.toFixed(2)}×₹${camRate})`, revenue.camA,  '#3b82f6'],
                  [`CAM Type B (${occupiedB}×${AREA_B.toFixed(2)}×₹${camRate})`, revenue.camB,  '#6366f1'],
                  [`Water (${totalOccupied}×₹${waterRate})`,                      revenue.water, '#0ea5e9'],
                  [`Elec fixed (${totalOccupied}×₹${elecFixed})`,                 revenue.elecF, '#f59e0b'],
                  [`Elec units (${elecUnits}×₹${elecRate})`,                       revenue.elecVar,'#fb923c'],
                ].map(([label, val, color]) => (
                  <div key={label} className="flex justify-between items-start gap-2">
                    <span className="text-xs text-gray-500 leading-tight">{label}</span>
                    <span className="text-xs font-semibold flex-shrink-0" style={{color}}>{fmt(val)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expense donut */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Expense Categories</h3>
              <div className="flex items-center gap-4">
                <DonutB segments={expenseGroups} size={110} />
                <div className="space-y-2 flex-1">
                  {expenseGroups.map(seg => (
                    <div key={seg.label} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:seg.color}} />
                      <span className="text-xs text-gray-600 flex-1">{seg.label}</span>
                      <span className="text-xs font-bold" style={{color:seg.color}}>{fmtK(seg.value)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between">
                    <span className="text-xs font-semibold text-gray-700">Total</span>
                    <span className="text-xs font-bold text-red-500">{fmt(totalExpenses)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 border-t pt-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Top 5 Expenses</p>
                {topExpenses.map(e => (
                  <div key={e.id} className="flex items-center gap-2 py-1">
                    <span className="text-sm w-6">{e.icon}</span>
                    <span className="text-xs text-gray-600 flex-1 truncate">{e.label}</span>
                    <span className="text-xs font-semibold" style={{color:e.color}}>{fmtK(e.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget health */}
            <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Budget Health</h3>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Expenses ({((totalExpenses/Math.max(revenue.total,1))*100).toFixed(1)}%)</span>
                  <span>Revenue</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden relative">
                  <div className="h-full rounded-full transition-all"
                    style={{width:`${Math.min((totalExpenses/Math.max(revenue.total,totalExpenses))*100,100)}%`,
                            background: surplus>=0 ? '#ef4444' : '#dc2626'}} />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                    {surplus>=0 ? `${((totalExpenses/revenue.total)*100).toFixed(1)}% utilized` : 'Over budget!'}
                  </div>
                </div>
              </div>

              <div className={`rounded-lg p-4 text-center ${surplus>=0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className="text-xs text-gray-500">{surplus>=0 ? 'Monthly Surplus' : 'Monthly Deficit'}</p>
                <p className={`text-2xl font-bold mt-1 ${surplus>=0 ? 'text-green-600' : 'text-red-600'}`}>
                  {surplus>=0 ? '+' : '-'}{fmt(Math.abs(surplus))}
                </p>
                <p className="text-xs text-gray-400 mt-1">Annual: {surplus>=0 ? '+' : '-'}{fmtK(Math.abs(surplus*12))}</p>
              </div>

              <div className="border-t pt-3 space-y-2">
                <p className="text-xs font-semibold text-gray-600">Quick Summary</p>
                {[
                  {label:`Paying flats`, val:`${totalOccupied}/${totalFlats}`, color:'#3b82f6'},
                  {label:`Revenue/flat avg`, val:fmt(revenue.total/Math.max(totalOccupied,1)), color:'#10b981'},
                  {label:`Expense/flat avg`, val:fmt(totalExpenses/totalFlats), color:'#ef4444'},
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-500">{r.label}</span>
                    <span className="text-sm font-bold" style={{color:r.color}}>{r.val}</span>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700 font-medium">Break-even CAM Rate</p>
                <p className="text-lg font-bold text-amber-600">₹{camNeeded.toFixed(2)}/sq ft</p>
                <p className="text-xs text-amber-500">
                  {camNeeded > camRate
                    ? `Need ₹${(camNeeded-camRate).toFixed(2)} more/sq ft`
                    : `₹${(camRate-camNeeded).toFixed(2)}/sq ft headroom`}
                </p>
              </div>
            </div>
          </div>

          {/* Annual table */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Annual Summary ({totalOccupied} paying flats)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    {['Item','Monthly','Quarterly','Half-Yearly','Annual'].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    {label:'💰 Total Revenue',    val:revenue.total,      color:'text-blue-600',  bold:true},
                    {label:'   CAM Collection',   val:revenue.totalCam,   color:'text-blue-500'},
                    {label:'   Water Charges',    val:revenue.water,      color:'text-sky-500'},
                    {label:'   Electricity Fixed',val:revenue.elecF,      color:'text-amber-500'},
                    {label:'   Electricity Units',val:revenue.elecVar,    color:'text-orange-400'},
                    {label:'📤 Total Expenses',   val:totalExpenses,      color:'text-red-500',   bold:true},
                    {label:surplus>=0?'✅ Surplus':'⚠️ Deficit',
                     val:Math.abs(surplus), color:surplus>=0?'text-green-600':'text-red-600', bold:true},
                  ].map(row => (
                    <tr key={row.label} className="hover:bg-gray-50">
                      <td className={`px-4 py-2 text-xs ${row.bold?'font-semibold':'text-gray-500 pl-8'}`}>{row.label}</td>
                      {[1,3,6,12].map(m => (
                        <td key={m} className={`px-4 py-2 text-xs font-medium ${row.color} ${row.bold?'font-bold':''}`}>
                          {fmt(row.val*m)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ PER FLAT TAB ══ */}
      {activeTab === 'perflat' && (
        <div className="space-y-5">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 text-sm text-blue-800">
            CAM on carpet + balcony · Water & Electricity shown separately · Variable electricity split equally across {totalFlats} flats
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <PerFlatCard label="Type A Flat (2 BHK)"
              carpetArea={BUDGET_CONSTANTS.TYPE_A.area}
              balconyArea={BUDGET_CONSTANTS.TYPE_A.balcony}
              camRate={camRate} waterRate={waterRate}
              elecFixed={elecFixed} elecVarPerFlat={elecVarPF} />
            <PerFlatCard label="Type B Flat (2 BHK)"
              carpetArea={BUDGET_CONSTANTS.TYPE_B.area}
              balconyArea={BUDGET_CONSTANTS.TYPE_B.balcony}
              camRate={camRate} waterRate={waterRate}
              elecFixed={elecFixed} elecVarPerFlat={elecVarPF} />
          </div>

          {/* Comparison table */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Rate Impact on Monthly Bill per Flat</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    {['CAM Rate','Type A CAM','Type B CAM','Water','Elec Fixed','Elec Var','Type A Total','A % vs Cur','Type B Total','B % vs Cur'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(() => {
                    const tACur = AREA_A*camRate + waterRate + elecFixed + elecVarPF;
                    const tBCur = AREA_B*camRate + waterRate + elecFixed + elecVarPF;
                    return [2.57,2.75,3.00,3.25,3.50,3.57,4.00].map(rate => {
                    const cA = AREA_A*rate, cB = AREA_B*rate;
                    const tA = cA+waterRate+elecFixed+elecVarPF;
                    const tB = cB+waterRate+elecFixed+elecVarPF;
                    const isCur = rate === camRate;
                    const pctA = tACur > 0 ? ((tA - tACur)/tACur*100) : 0;
                    const pctB = tBCur > 0 ? ((tB - tBCur)/tBCur*100) : 0;
                    return (
                      <tr key={rate} className={isCur?'bg-blue-50 font-semibold':'hover:bg-gray-50'}>
                        <td className={`px-3 py-2 font-bold ${isCur?'text-blue-700':'text-gray-700'}`}>
                          ₹{rate.toFixed(2)}{isCur&&<span className="text-blue-400 font-normal ml-1">(current)</span>}
                        </td>
                        <td className="px-3 py-2 text-blue-600">{fmt(cA)}</td>
                        <td className="px-3 py-2 text-indigo-600">{fmt(cB)}</td>
                        <td className="px-3 py-2 text-sky-600">{fmt(waterRate)}</td>
                        <td className="px-3 py-2 text-amber-600">{fmt(elecFixed)}</td>
                        <td className="px-3 py-2 text-orange-500">{fmt(elecVarPF)}</td>
                        <td className="px-3 py-2 font-bold text-gray-800">{fmt(tA)}</td>
                        <td className={`px-3 py-2 font-bold text-center ${isCur?'text-blue-400':pctA>0?'text-red-500':'text-green-600'}`}>
                          {isCur ? '—' : (pctA>0?'+':'')+pctA.toFixed(1)+'%'}
                        </td>
                        <td className="px-3 py-2 font-bold text-gray-800">{fmt(tB)}</td>
                        <td className={`px-3 py-2 font-bold text-center ${isCur?'text-blue-400':pctB>0?'text-red-500':'text-green-600'}`}>
                          {isCur ? '—' : (pctB>0?'+':'')+pctB.toFixed(1)+'%'}
                        </td>
                      </tr>
                    );
                  })
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ PAYING FLATS TAB ══ */}
      {activeTab === 'flats' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <FlatsAdjuster
            occupiedA={occupiedA} occupiedB={occupiedB}
            setOccupiedA={setOccupiedA} setOccupiedB={setOccupiedB}
            camRate={camRate} waterRate={waterRate} elecFixed={elecFixed} />

          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue Impact of Non-Paying Flats</h3>
              {[
                {label:'Full 752 flats revenue',    val:revenueIfFull,              color:'#10b981'},
                {label:`Actual ${totalOccupied} flats revenue`, val:revenue.total, color:'#3b82f6'},
                {label:'Monthly revenue loss',       val:lostRev,                    color:'#ef4444'},
                {label:'Annual revenue loss',        val:lostRev*12,                 color:'#dc2626'},
              ].map(r => (
                <div key={r.label} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-600">{r.label}</span>
                  <span className="text-sm font-bold" style={{color:r.color}}>{fmt(r.val)}</span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Scenario: What if more flats pay?</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left text-gray-500">Paying Flats</th>
                      <th className="px-3 py-2 text-right text-gray-500">Revenue</th>
                      <th className="px-3 py-2 text-right text-gray-500">Surplus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[600,650,700,720,740,752].map(n => {
                      const nA = Math.min(n, BUDGET_CONSTANTS.TYPE_A.count);
                      const nB = Math.min(n - nA, BUDGET_CONSTANTS.TYPE_B.count);
                      const rev = (nA*AREA_A*camRate) + (nB*AREA_B*camRate) +
                                  (n*waterRate) + (n*elecFixed) + (elecUnits*elecRate);
                      const sur = rev - totalExpenses;
                      const isCur = n === totalOccupied;
                      return (
                        <tr key={n} className={isCur?'bg-blue-50 font-semibold':'hover:bg-gray-50'}>
                          <td className={`px-3 py-2 font-bold ${isCur?'text-blue-700':'text-gray-700'}`}>
                            {n}{isCur&&<span className="text-blue-400 font-normal ml-1">(current)</span>}
                          </td>
                          <td className="px-3 py-2 text-right text-blue-600 font-medium">{fmt(rev)}</td>
                          <td className={`px-3 py-2 text-right font-bold ${sur>=0?'text-green-600':'text-red-500'}`}>
                            {sur>=0?'+':''}{fmt(sur)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ BREAKDOWN TAB ══ */}
      {activeTab === 'breakdown' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Monthly Vendor Expenses</h3>
              {editMode && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">✏️ Editing — auto-saved</span>}
            </div>
            <p className="text-xs text-gray-400 mb-3">Changes are saved to your browser and persist across logouts.</p>
            {expenses.map(exp => (
              <BudgetBar key={exp.id} label={exp.label} icon={exp.icon}
                amount={exp.amount} total={totalExpenses}
                color={exp.color} editable={editMode}
                onChange={val => updateExpense(exp.id, val)} />
            ))}
            <div className="border-t mt-3 pt-3 flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-700">Total Monthly</span>
              <span className="text-base font-bold text-red-500">{fmt(totalExpenses)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue vs Expenses</h3>
              {[
                {label:'CAM Revenue',      val:revenue.totalCam,  color:'#3b82f6'},
                {label:'Water Revenue',    val:revenue.water,     color:'#0ea5e9'},
                {label:'Elec Fixed Rev',   val:revenue.elecF,     color:'#f59e0b'},
                {label:'Elec Units Rev',   val:revenue.elecVar,   color:'#fb923c'},
                {label:'Total Expenses',   val:totalExpenses,     color:'#ef4444'},
                {label:surplus>=0?'Surplus':'Deficit', val:Math.abs(surplus), color:surplus>=0?'#10b981':'#dc2626'},
              ].map(r => {
                const max = Math.max(revenue.total, totalExpenses);
                return (
                  <div key={r.label} className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{r.label}</span>
                      <span className="font-semibold" style={{color:r.color}}>{fmt(r.val)}</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{width:`${(r.val/max)*100}%`,background:r.color}} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Electricity Settings</h3>
              {[
                {label:'Fixed charge per flat (₹/month)', key:'ef',  val:elecFixed, set:setElecFixed, step:10,  color:'#f59e0b'},
                {label:'Variable rate (₹/unit)',          key:'er',  val:elecRate,  set:setElecRate,  step:0.1, color:'#fb923c'},
                {label:'Common area units/month',         key:'eu',  val:elecUnits, set:setElecUnits, step:500, color:'#f97316'},
              ].map(f => (
                <div key={f.key} className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <div className="flex items-center gap-2">
                    <input type="number" step={f.step} value={f.val}
                      onChange={e => f.set(Number(e.target.value))}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                      style={{color:f.color}} />
                    <span className="text-xs font-bold" style={{color:f.color}}>{fmt(
                      f.key==='ef' ? f.val*totalOccupied :
                      f.key==='eu' ? f.val*elecRate       :
                      elecUnits*f.val
                    )}/mo</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ SIMULATOR TAB ══ */}
      {activeTab === 'simulation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-5">
            {/* Rate controls */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">🔮 Live Rate Simulator</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  {label:'CAM Rate (₹/sq ft)',        key:'cam',   val:camRate,   set:setCamRate,   step:0.01},
                  {label:'Water Charge (₹/flat)',      key:'water', val:waterRate, set:setWaterRate, step:50  },
                  {label:'Elec Fixed (₹/flat/month)',  key:'ef',    val:elecFixed, set:setElecFixed, step:10  },
                  {label:'Elec Rate (₹/unit)',         key:'er',    val:elecRate,  set:setElecRate,  step:0.1 },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                    <input type="number" step={f.step} value={f.val}
                      onChange={e => f.set(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm font-bold text-blue-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-lg p-3 space-y-1.5">
                {donutRevenue.map(r => (
                  <div key={r.label} className="flex justify-between text-xs">
                    <span className="text-gray-500">{r.label}</span>
                    <span className="font-semibold" style={{color:r.color}}>{fmt(r.value)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-xs font-bold text-gray-700">Total ({totalOccupied} flats)</span>
                  <span className="text-sm font-bold text-blue-600">{fmt(revenue.total)}</span>
                </div>
              </div>
            </div>

            {/* CAM scenario table */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">CAM Rate Scenarios</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left text-gray-500">Rate</th>
                      <th className="px-3 py-2 text-right text-gray-500">CAM Rev</th>
                      <th className="px-3 py-2 text-right text-gray-500">Total Rev</th>
                      <th className="px-3 py-2 text-right text-gray-500">Surplus</th>
                      <th className="px-3 py-2 text-right text-gray-500">Rev % of Exp</th>
                      <th className="px-3 py-2 text-center text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[2.57,2.75,3.00,3.25,3.50,3.57,4.00].map(rate => {
                      const cam = (occupiedA*AREA_A*rate)+(occupiedB*AREA_B*rate);
                      const tot = cam + revenue.water + revenue.elecF + revenue.elecVar;
                      const sur = tot - totalExpenses;
                      const isCur = rate===camRate;
                      return (
                        <tr key={rate} className={isCur?'bg-blue-50':'hover:bg-gray-50'}>
                          <td className={`px-3 py-2 font-bold ${isCur?'text-blue-700':'text-gray-700'}`}>
                            ₹{rate.toFixed(2)}{isCur&&<span className="text-blue-400 font-normal ml-1">(cur)</span>}
                          </td>
                          <td className="px-3 py-2 text-right text-blue-600">{fmt(cam)}</td>
                          <td className="px-3 py-2 text-right text-gray-700 font-medium">{fmt(tot)}</td>
                          <td className={`px-3 py-2 text-right font-bold ${sur>=0?'text-green-600':'text-red-500'}`}>
                            {sur>=0?'+':''}{fmt(sur)}
                          </td>
                          <td className={`px-3 py-2 text-right font-bold ${tot>=totalExpenses?'text-green-600':'text-red-500'}`}>
                            {totalExpenses>0 ? ((tot/totalExpenses)*100).toFixed(1)+'%' : '—'}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`status-badge ${sur>=0?'bg-green-100 text-green-700':'bg-red-100 text-red-600'}`}>
                              {sur>=0?'✓ OK':'✗ Deficit'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {/* Insights */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 text-white">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><span>💡</span> Budget Insights</h3>
              <div className="space-y-3 text-xs">
                {[
                  [`Break-even CAM: ₹${camNeeded.toFixed(2)}/sq ft (carpet+balcony)`, '#fbbf24'],
                  [`${totalFlats-totalOccupied} non-paying flats = ₹${Math.round(lostRev).toLocaleString('en-IN')} lost/month`, '#f87171'],
                  [`Raising CAM ₹0.10/sq ft → +${fmt(totalChargeableArea*0.10)}/month`, '#34d399'],
                  [`Raising water ₹50/flat → +${fmt(totalOccupied*50)}/month`, '#34d399'],
                  [`Elec fixed ₹${elecFixed}/flat → ${fmt(revenue.elecF)}/month total`, '#fbbf24'],
                  [`Revenue covers ${((revenue.total/totalExpenses)*100).toFixed(1)}% of expenses`, surplus>=0?'#34d399':'#f87171'],
                  [`Enviro Manpower = ${((expenses.find(e=>e.id==='enviro_mp')?.amount||0)/totalExpenses*100).toFixed(1)}% of total expenses`, '#f87171'],
                ].map(([text,color],i) => (
                  <div key={i} className="flex gap-2">
                    <span style={{color}}>•</span>
                    <span style={{color:'#d1d5db'}}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expense change scenarios */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">If Expenses Change By…</h3>
              <div className="space-y-2">
                {[-20,-10,-5,0,5,10,20].map(pct => {
                  const adjExp = totalExpenses*(1+pct/100);
                  const adjSur = revenue.total - adjExp;
                  const isCur  = pct===0;
                  return (
                    <div key={pct} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${isCur?'bg-gray-100 font-bold':'hover:bg-gray-50'}`}>
                      <span className={`font-medium ${pct<0?'text-green-600':pct>0?'text-red-500':'text-gray-700'}`}>
                        {pct===0?'Current':(pct>0?'▲ +':'▼ ')+pct+'%'}
                      </span>
                      <span className="text-gray-500">{fmt(adjExp)}</span>
                      <span className={`font-bold ${adjSur>=0?'text-green-600':'text-red-500'}`}>
                        {adjSur>=0?'+':''}{fmt(adjSur)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
