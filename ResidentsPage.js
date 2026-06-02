/* ===================================================
   ResidentsPage.js
   Global Hillview Society Portal — Residents Module
   Includes: Analytics Dashboard + Full Directory
   =================================================== */

// ── Tiny SVG Chart Helpers (no external lib needed) ──
function MiniBarChart({ data, colorFn, height = 80 }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center flex-1 gap-1">
          <span className="text-xs text-gray-500 font-medium">{d.value}</span>
          <div
            className="w-full rounded-t transition-all"
            style={{ height: `${(d.value / max) * (height - 24)}px`, background: colorFn(i, d) }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="text-xs text-gray-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments, size = 120 }) {
  const total = segments.reduce((s, d) => s + d.value, 0) || 1;
  let angle = -90;
  const paths = segments.map(seg => {
    const pct = seg.value / total;
    const start = angle;
    angle += pct * 360;
    const end = angle;
    const r = size / 2 - 8;
    const cx = size / 2, cy = size / 2;
    const startRad = (start * Math.PI) / 180;
    const endRad   = (end   * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const large = pct > 0.5 ? 1 : 0;
    return { ...seg, d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z` };
  });
  const ir = (size / 2 - 8) * 0.55;
  return (
    <svg width={size} height={size} className="flex-shrink-0">
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} opacity={0.9}>
          <title>{p.label}: {p.value} ({((p.value / total) * 100).toFixed(1)}%)</title>
        </path>
      ))}
      <circle cx={size / 2} cy={size / 2} r={ir} fill="white" />
      <text x={size / 2} y={size / 2 - 6} textAnchor="middle" fontSize="16" fontWeight="700" fill="#1f2937">{total}</text>
      <text x={size / 2} y={size / 2 + 12} textAnchor="middle" fontSize="9" fill="#6b7280">TOTAL</text>
    </svg>
  );
}

// ── KPI Stat Card ─────────────────────────────────────
function StatCard({ label, value, sub, color = '#3b82f6', icon, onClick, active }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-4 shadow-sm transition-all ${onClick ? 'cursor-pointer hover:shadow-md' : ''} ${active ? 'ring-2' : ''}`}
      style={active ? { ringColor: color } : {}}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        {icon && (
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: color + '20' }}>
            <svg className="w-5 h-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
            </svg>
          </div>
        )}
      </div>
      {active && <div className="mt-2 h-0.5 rounded" style={{ background: color }} />}
    </div>
  );
}

// ── Tower Heat-map Grid ───────────────────────────────
function TowerOccupancyGrid({ data }) {
  const towers = ['1','2','3','4','5'];
  const byTower = towers.map(t => {
    const flats = data.filter(r => r.Tower === t);
    const owner  = flats.filter(r => r.Residing === 'Owner').length;
    const tenant = flats.filter(r => r.Residing === 'Tenant').length;
    const vacant = flats.filter(r => r.Residing === 'Vaccant').length;
    const noStat = flats.filter(r => r.Residing === 'No Status').length;
    const kycDone = flats.filter(r => r.OwnerKYC === 'Yes').length;
    return { t, total: flats.length, owner, tenant, vacant, noStat, kycDone };
  });

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Tower-wise Occupancy Breakdown</h3>
      <div className="space-y-3">
        {byTower.map(({ t, total, owner, tenant, vacant, noStat, kycDone }) => {
          const ownerPct  = Math.round(owner  / total * 100);
          const tenantPct = Math.round(tenant / total * 100);
          const vacantPct = Math.round(vacant / total * 100);
          const noStatPct = 100 - ownerPct - tenantPct - vacantPct;
          return (
            <div key={t}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-600">Tower {t}</span>
                <span className="text-xs text-gray-400">{total} flats · {kycDone} KYC done</span>
              </div>
              <div className="flex h-6 rounded-md overflow-hidden gap-px">
                {owner  > 0 && <div style={{ width: `${ownerPct}%`,  background:'#3b82f6' }} title={`Owner: ${owner}`} className="flex items-center justify-center text-white text-xs font-medium">{ownerPct > 8 ? `${owner}` : ''}</div>}
                {tenant > 0 && <div style={{ width: `${tenantPct}%`, background:'#10b981' }} title={`Tenant: ${tenant}`} className="flex items-center justify-center text-white text-xs font-medium">{tenantPct > 8 ? `${tenant}` : ''}</div>}
                {vacant > 0 && <div style={{ width: `${vacantPct}%`, background:'#f59e0b' }} title={`Vacant: ${vacant}`} className="flex items-center justify-center text-white text-xs font-medium">{vacantPct > 8 ? `${vacant}` : ''}</div>}
                {noStat > 0 && <div style={{ width: `${noStatPct}%`, background:'#e5e7eb' }} title={`No Status: ${noStat}`} />}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 flex-wrap">
        {[['Owner','#3b82f6'],['Tenant','#10b981'],['Vacant','#f59e0b'],['No Status','#e5e7eb']].map(([l,c]) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: c }} />
            <span className="text-xs text-gray-500">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── KYC Progress Panel ────────────────────────────────
function KYCProgressPanel({ data }) {
  const towers = ['1','2','3','4','5'];
  const cols = [
    { key: 'OwnerKYC',      label: 'Owner KYC',         color: '#3b82f6' },
    { key: 'OwnerRegistry', label: 'Registry',           color: '#8b5cf6' },
    { key: 'OwnerAadhar',   label: 'Owner Aadhar',       color: '#06b6d4' },
    { key: 'TenantKYC',     label: 'Tenant KYC',         color: '#10b981' },
    { key: 'TenantPoliceVerification', label: 'Police Verif.', color: '#f59e0b' },
    { key: 'TenantRentAgreement', label: 'Rent Agreement', color: '#ef4444' },
  ];

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm overflow-x-auto">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">KYC & Document Completion by Tower</h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 pr-3 text-gray-500 font-medium">Tower</th>
            {cols.map(c => (
              <th key={c.key} className="text-center py-2 px-2 text-gray-500 font-medium whitespace-nowrap">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {towers.map(t => {
            const flats = data.filter(r => r.Tower === t);
            const total = flats.length || 1;
            return (
              <tr key={t} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 pr-3 font-semibold text-gray-700">T{t}</td>
                {cols.map(c => {
                  const done = flats.filter(r => r[c.key] === 'Yes').length;
                  const pct  = Math.round(done / total * 100);
                  return (
                    <td key={c.key} className="py-2 px-2 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold text-gray-700">{pct}%</span>
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.color }} />
                        </div>
                        <span className="text-gray-400">{done}/{total}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Document Status Breakdown ─────────────────────────
function DocumentStatusBreakdown({ data }) {
  const counts = {};
  data.forEach(r => {
    const d = (r.DocumentsPending || 'Unknown').trim();
    counts[d] = (counts[d] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const palette = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16','#f97316','#14b8a6','#6366f1','#78716c'];
  const total = sorted.reduce((s, [,v]) => s + v, 0);

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Document Status Distribution</h3>
      <div className="flex items-start gap-4 flex-wrap">
        <DonutChart
          size={140}
          segments={sorted.map(([label, value], i) => ({ label, value, color: palette[i % palette.length] }))}
        />
        <div className="flex-1 space-y-1.5 min-w-0">
          {sorted.map(([label, value], i) => (
            <div key={label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: palette[i % palette.length] }} />
                <span className="text-xs text-gray-600 truncate">{label}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(value / total) * 100}%`, background: palette[i % palette.length] }} />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-6 text-right">{value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Move-in Timeline ──────────────────────────────────
function MoveInTimeline({ data }) {
  const { useMemo } = React;
  const monthly = useMemo(() => {
    const map = {};
    data.forEach(r => {
      if (!r.MoveIn || r.MoveIn === '-' || r.MoveIn === 'nan' || r.MoveIn === 'NaT') return;
      const d = new Date(r.MoveIn);
      if (isNaN(d.getTime()) || d.getFullYear() < 2018) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).sort().slice(-18).map(([label, value]) => ({ label: label.slice(2), value }));
  }, [data]);

  const max = Math.max(...monthly.map(d => d.value), 1);

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Move-in Timeline (last 18 months)</h3>
      {monthly.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-8">No move-in date data available</p>
      ) : (
        <div className="flex items-end gap-1 h-24">
          {monthly.map((d, i) => (
            <div key={i} className="flex flex-col items-center flex-1 gap-1" title={`${d.label}: ${d.value} move-ins`}>
              <div
                className="w-full rounded-t"
                style={{ height: `${(d.value / max) * 64}px`, background: `hsl(${210 + i * 3}, 70%, ${55 - i}%)` }}
              />
              <span className="text-gray-400" style={{ fontSize: '8px', writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '28px' }}>
                {d.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Flat Type & Area Stats ─────────────────────────────
function FlatTypeStats({ data }) {
  const aFlats = data.filter(r => r.FlatType === 'A');
  const bFlats = data.filter(r => r.FlatType === 'B');
  const ownerA = aFlats.filter(r => r.Residing === 'Owner').length;
  const ownerB = bFlats.filter(r => r.Residing === 'Owner').length;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Flat Type Analysis</h3>
      <div className="grid grid-cols-2 gap-4">
        {[
          { type: 'Type A', area: '585.41 sq ft', count: aFlats.length, owner: ownerA, color: '#3b82f6' },
          { type: 'Type B', area: '554.17 sq ft', count: bFlats.length, owner: ownerB, color: '#10b981' },
        ].map(({ type, area, count, owner, color }) => (
          <div key={type} className="rounded-xl p-4 border-2" style={{ borderColor: color + '30', background: color + '08' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold" style={{ color }}>{type}</span>
              <span className="text-xl font-bold text-gray-800">{count}</span>
            </div>
            <div className="text-xs text-gray-500 mb-3">{area}</div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Owner occupied</span>
                <span className="font-semibold text-gray-700">{owner} ({Math.round(owner/count*100)}%)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Rented out</span>
                <span className="font-semibold text-gray-700">{count - owner} ({Math.round((count-owner)/count*100)}%)</span>
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(owner/count)*100}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Resident Detail Modal ─────────────────────────────
function ResidentViewModal({ row, onClose }) {
  const sections = [
    {
      title: 'Flat Details',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      fields: [
        ['Tower', `Tower ${row.Tower}`],
        ['Flat No.', row.Flat],
        ['Flat Type', row.FlatType],
        ['Area', `${row.Area} sq ft`],
        ['Parking No.', row.Parking],
        ['Vehicle', row.Vehicle !== 'nan' ? row.Vehicle : '-'],
        ['Residing', row.Residing],
        ['Ownership', row.SaleResale],
        ['Move-in Date', row.MoveIn !== 'nan' && row.MoveIn !== 'NaT' ? row.MoveIn?.split(' ')[0] : '-'],
      ]
    },
    {
      title: 'Owner Details',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      fields: [
        ['Primary Owner', row.PrimaryOwner],
        ['Secondary Owner', row.SecondaryOwner !== '-' ? row.SecondaryOwner : 'N/A'],
        ['Mobile', row.PrimaryPhone],
        ['Alt. Mobile', row.AltPhone1 !== '-' ? row.AltPhone1 : 'N/A'],
        ['Email', row.OwnerEmail !== '-' ? row.OwnerEmail : 'N/A'],
        ['KYC Status', row.OwnerKYC],
        ['Registry', row.OwnerRegistry],
        ['Photo', row.OwnerPhoto],
        ['Aadhar', row.OwnerAadhar],
      ]
    },
    {
      title: 'Tenant Details',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      fields: [
        ['Tenant Name', row.TenantName !== '-' && row.TenantName !== 'nan' ? row.TenantName : 'No Tenant'],
        ['Mobile', row.TenantPhone !== '-' && row.TenantPhone !== 'nan' ? row.TenantPhone : '-'],
        ['Email', row.TenantEmail !== '-' && row.TenantEmail !== 'nan' ? row.TenantEmail : '-'],
        ['Tenant KYC', row.TenantKYC],
        ['Rent Agreement', row.TenantRentAgreement],
        ['Police Verif.', row.TenantPoliceVerification],
        ['Tenant RC', row.TenantRC],
        ['Move-in', row.TenantMoveIn !== '-' && row.TenantMoveIn !== 'nan' ? row.TenantMoveIn?.split(' ')[0] : '-'],
        ['Move-out', row.TenantMoveOut !== '-' && row.TenantMoveOut !== 'nan' ? row.TenantMoveOut?.split(' ')[0] : '-'],
      ]
    },
    {
      title: 'Documents',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      fields: [
        ['Documents Pending', row.DocumentsPending],
        ['Enviro Reason', row.EnviroReason],
        ['Move In/Out Charges', row.MoveInOut],
      ]
    }
  ];

  const kycColor = { Yes: 'bg-green-100 text-green-700', No: 'bg-red-100 text-red-700', Partial: 'bg-yellow-100 text-yellow-700' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <span className="text-blue-700 font-bold text-sm">T{row.Tower}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Flat {row.Flat} · Tower {row.Tower}</h3>
              <p className="text-xs text-gray-500">{row.PrimaryOwner} · Type {row.FlatType} · {row.Area} sq ft</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {['Owner','Tenant','No Status','Vaccant'].map(s =>
              row.Residing === s ? (
                <span key={s} className={`text-xs px-2 py-1 rounded-full font-medium ${
                  s === 'Owner' ? 'bg-blue-100 text-blue-700' :
                  s === 'Tenant' ? 'bg-green-100 text-green-700' :
                  s === 'Vaccant' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>{s}</span>
              ) : null
            )}
          </div>
        </div>

        <div className="p-5 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {sections.map(sec => (
              <div key={sec.title} className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sec.icon} />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{sec.title}</span>
                </div>
                <div className="space-y-2">
                  {sec.fields.map(([label, value]) => (
                    <div key={label} className="flex justify-between items-start gap-2">
                      <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
                      <span className={`text-xs font-medium text-right ${
                        value === 'Yes'   ? 'text-green-600' :
                        value === 'No'    ? 'text-red-500' :
                        value === 'Partial' ? 'text-yellow-600' :
                        value === 'No Status' ? 'text-gray-400' :
                        'text-gray-700'
                      }`}>{value || '-'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────
function ResidentsPage({ data }) {
  const { useState, useMemo } = React;

  const [activeTab,   setActiveTab]   = useState('analytics');  // 'analytics' | 'directory'
  const [search,      setSearch]      = useState('');
  const [towerFilter, setTowerFilter] = useState('all');
  const [typeFilter,  setTypeFilter]  = useState('all');         // Owner/Tenant/Vaccant/No Status
  const [kycFilter,   setKYCFilter]   = useState('all');         // Yes/No/Partial/No Status
  const [docFilter,   setDocFilter]   = useState('all');
  const [viewRow,     setViewRow]     = useState(null);

  // ── summary stats ──────────────────────────────────
  const stats = useMemo(() => {
    const total      = data.length;
    const owners     = data.filter(r => r.Residing === 'Owner').length;
    const tenants    = data.filter(r => r.Residing === 'Tenant').length;
    const vacant     = data.filter(r => r.Residing === 'Vaccant').length;
    const noStatus   = data.filter(r => r.Residing === 'No Status').length;
    const kycDone    = data.filter(r => r.OwnerKYC === 'Yes').length;
    const kycPending = data.filter(r => r.OwnerKYC === 'No').length;
    const kycPartial = data.filter(r => r.OwnerKYC === 'Partial').length;
    const regDone    = data.filter(r => r.OwnerRegistry === 'Yes').length;
    const firstOwner = data.filter(r => r.SaleResale === '1st Owner').length;
    const secondOwner= data.filter(r => r.SaleResale === '2nd Owner').length;
    const docComplete= data.filter(r => (r.DocumentsPending || '').includes('Complete')).length;
    const typeA      = data.filter(r => r.FlatType === 'A').length;
    const typeB      = data.filter(r => r.FlatType === 'B').length;
    return { total, owners, tenants, vacant, noStatus, kycDone, kycPending, kycPartial, regDone, firstOwner, secondOwner, docComplete, typeA, typeB };
  }, [data]);

  // ── filter options ─────────────────────────────────
  const docOptions = useMemo(() => {
    const set = new Set(data.map(r => r.DocumentsPending || 'Unknown'));
    return ['all', ...Array.from(set).sort()];
  }, [data]);

  // ── filtered rows for directory ────────────────────
  const filtered = useMemo(() => {
    let rows = data;
    if (towerFilter !== 'all') rows = rows.filter(r => r.Tower === towerFilter);
    if (typeFilter  !== 'all') rows = rows.filter(r => r.Residing === typeFilter);
    if (kycFilter   !== 'all') rows = rows.filter(r => r.OwnerKYC === kycFilter);
    if (docFilter   !== 'all') rows = rows.filter(r => (r.DocumentsPending || '') === docFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.PrimaryOwner.toLowerCase().includes(q)  ||
        r.Flat.includes(q)                         ||
        r.Tower.includes(q)                        ||
        r.TenantName?.toLowerCase().includes(q)   ||
        r.PrimaryPhone.includes(q)
      );
    }
    return rows;
  }, [data, towerFilter, typeFilter, kycFilter, docFilter, search]);

  // ── KYC badge helper ───────────────────────────────
  const kycBadge = (val) => {
    const cls = val === 'Yes' ? 'bg-green-100 text-green-700' :
                val === 'No'  ? 'bg-red-100 text-red-700' :
                val === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-500';
    return <span className={`status-badge ${cls}`}>{val || '-'}</span>;
  };

  const residentBadge = (val) => {
    const cls = val === 'Owner'   ? 'bg-blue-100 text-blue-700' :
                val === 'Tenant'  ? 'bg-green-100 text-green-700' :
                val === 'Vaccant' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-500';
    return <span className={`status-badge ${cls}`}>{val || '-'}</span>;
  };

  return (
    <div className="space-y-5 fade-in">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Residents</h1>
          <p className="text-sm text-gray-500">{stats.total} flats across 5 towers · Global Hillview Society</p>
        </div>
        <div className="flex items-center gap-2">
          {[['analytics','Analytics Dashboard'],['directory','Resident Directory']].map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
          <ExportButton data={filtered} filename="Residents" />
        </div>
      </div>

      {/* ── KPI Row (always visible) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard label="Total Flats"    value={stats.total}       color="#3b82f6" />
        <StatCard label="Owner Occupied" value={stats.owners}      color="#3b82f6" sub={`${Math.round(stats.owners/stats.total*100)}% of flats`} onClick={() => { setActiveTab('directory'); setTypeFilter(typeFilter === 'Owner' ? 'all' : 'Owner'); }} active={typeFilter === 'Owner'} />
        <StatCard label="Tenant Rented"  value={stats.tenants}     color="#10b981" sub={`${Math.round(stats.tenants/stats.total*100)}% of flats`} onClick={() => { setActiveTab('directory'); setTypeFilter(typeFilter === 'Tenant' ? 'all' : 'Tenant'); }} active={typeFilter === 'Tenant'} />
        <StatCard label="Vacant"         value={stats.vacant}      color="#f59e0b" sub="Unoccupied" onClick={() => { setActiveTab('directory'); setTypeFilter(typeFilter === 'Vaccant' ? 'all' : 'Vaccant'); }} active={typeFilter === 'Vaccant'} />
        <StatCard label="KYC Done"       value={stats.kycDone}     color="#8b5cf6" sub={`${Math.round(stats.kycDone/stats.total*100)}% complete`} onClick={() => { setActiveTab('directory'); setKYCFilter(kycFilter === 'Yes' ? 'all' : 'Yes'); }} active={kycFilter === 'Yes'} />
        <StatCard label="KYC Pending"    value={stats.kycPending}  color="#ef4444" sub="Needs action" onClick={() => { setActiveTab('directory'); setKYCFilter(kycFilter === 'No' ? 'all' : 'No'); }} active={kycFilter === 'No'} />
        <StatCard label="Docs Complete"  value={stats.docComplete} color="#06b6d4" sub="Owner + Tenant" />
      </div>

      {/* ════════════════════════════════════════════
          ANALYTICS TAB
          ════════════════════════════════════════════ */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          {/* Row 1: Occupancy + KYC Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <TowerOccupancyGrid data={data} />

            {/* Sale / Resale + KYC Summary donut */}
            <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Ownership & KYC Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Occupancy donut */}
                <div>
                  <p className="text-xs text-gray-500 mb-3 font-medium">Occupancy Type</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <DonutChart size={120} segments={[
                      { label: 'Owner',     value: stats.owners,   color: '#3b82f6' },
                      { label: 'Tenant',    value: stats.tenants,  color: '#10b981' },
                      { label: 'Vacant',    value: stats.vacant,   color: '#f59e0b' },
                      { label: 'No Status', value: stats.noStatus, color: '#e5e7eb' },
                    ]} />
                    <div className="space-y-1.5 text-xs">
                      {[['Owner','#3b82f6',stats.owners],['Tenant','#10b981',stats.tenants],['Vacant','#f59e0b',stats.vacant],['No Status','#9ca3af',stats.noStatus]].map(([l,c,v]) => (
                        <div key={l} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
                          <span className="text-gray-600">{l}</span>
                          <span className="font-semibold text-gray-800 ml-auto">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Owner KYC donut */}
                <div>
                  <p className="text-xs text-gray-500 mb-3 font-medium">Owner KYC Status</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <DonutChart size={120} segments={[
                      { label: 'KYC Done',    value: stats.kycDone,                          color: '#10b981' },
                      { label: 'KYC Pending', value: stats.kycPending,                       color: '#ef4444' },
                      { label: 'Partial',     value: stats.kycPartial,                       color: '#f59e0b' },
                      { label: 'No Status',   value: stats.total - stats.kycDone - stats.kycPending - stats.kycPartial, color: '#e5e7eb' },
                    ]} />
                    <div className="space-y-1.5 text-xs">
                      {[['Done','#10b981',stats.kycDone],['Pending','#ef4444',stats.kycPending],['Partial','#f59e0b',stats.kycPartial]].map(([l,c,v]) => (
                        <div key={l} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
                          <span className="text-gray-600">{l}</span>
                          <span className="font-semibold text-gray-800 ml-auto">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 1st vs 2nd owner bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 font-medium">1st vs 2nd Owner</span>
                  <span className="text-xs text-gray-400">{stats.secondOwner} resale flats ({Math.round(stats.secondOwner/stats.total*100)}%)</span>
                </div>
                <div className="flex h-5 rounded-md overflow-hidden gap-px">
                  <div style={{ width: `${(stats.firstOwner/stats.total)*100}%`, background: '#3b82f6' }} className="flex items-center justify-center text-white text-xs">
                    {stats.firstOwner} 1st Owners
                  </div>
                  <div style={{ width: `${(stats.secondOwner/stats.total)*100}%`, background: '#8b5cf6' }} className="flex items-center justify-center text-white text-xs">
                    {stats.secondOwner} Resale
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: KYC Progress Table */}
          <KYCProgressPanel data={data} />

          {/* Row 3: Tower bar chart + Flat type */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Tower-wise occupant counts bar */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Residents per Tower</h3>
              {['1','2','3','4','5'].map(t => {
                const flats = data.filter(r => r.Tower === t);
                const o = flats.filter(r => r.Residing === 'Owner').length;
                const ten = flats.filter(r => r.Residing === 'Tenant').length;
                return (
                  <div key={t} className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-600">Tower {t}</span>
                      <span className="text-xs text-gray-400">{flats.length} flats</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-14 text-right text-xs text-blue-600 font-medium">{o} owners</div>
                          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(o/flats.length)*100}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-14 text-right text-xs text-green-600 font-medium">{ten} tenants</div>
                          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-400 rounded-full" style={{ width: `${(ten/flats.length)*100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <FlatTypeStats data={data} />
          </div>

          {/* Row 4: Document Status + Move-in Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <DocumentStatusBreakdown data={data} />
            <MoveInTimeline data={data} />
          </div>

          {/* Row 5: Registry & Document summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Registry Submitted',   value: stats.regDone,  total: stats.total, color: '#8b5cf6' },
              { label: 'Docs Fully Complete',  value: stats.docComplete, total: stats.total, color: '#10b981' },
              { label: '1st Ownership',        value: stats.firstOwner, total: stats.total, color: '#3b82f6' },
              { label: 'Type A Flats',         value: stats.typeA,    total: stats.total, color: '#06b6d4' },
            ].map(({ label, value, total, color }) => (
              <div key={label} className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500 mb-2">{label}</p>
                <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(value/total)*100}%`, background: color }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{Math.round((value/total)*100)}% of total</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          DIRECTORY TAB
          ════════════════════════════════════════════ */}
      {activeTab === 'directory' && (
        <div className="bg-white rounded-2xl shadow-sm">
          {/* Filters */}
          <div className="p-5 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-48">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search owner, flat, phone…"
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              {/* Tower */}
              <select value={towerFilter} onChange={e => setTowerFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="all">All Towers</option>
                {['1','2','3','4','5'].map(t => <option key={t} value={t}>Tower {t}</option>)}
              </select>
              {/* Type */}
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="all">All Residents</option>
                <option value="Owner">Owner</option>
                <option value="Tenant">Tenant</option>
                <option value="Vaccant">Vacant</option>
                <option value="No Status">No Status</option>
              </select>
              {/* KYC */}
              <select value={kycFilter} onChange={e => setKYCFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="all">All KYC</option>
                <option value="Yes">KYC Done</option>
                <option value="No">KYC Pending</option>
                <option value="Partial">KYC Partial</option>
              </select>
              {/* Reset */}
              {(towerFilter !== 'all' || typeFilter !== 'all' || kycFilter !== 'all' || docFilter !== 'all' || search) && (
                <button onClick={() => { setTowerFilter('all'); setTypeFilter('all'); setKYCFilter('all'); setDocFilter('all'); setSearch(''); }}
                  className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg border border-red-200">
                  Clear Filters
                </button>
              )}
              <span className="text-sm text-gray-500 ml-auto">{filtered.length} results</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Flat','Owner','Type','Residing','Owner KYC','Tenant KYC','Documents Pending','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.slice(0, 300).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 text-xs font-bold">T{row.Tower}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{row.Flat}</p>
                          <p className="text-xs text-gray-400">{row.FlatType} · {row.Area} ft²</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 whitespace-nowrap">{row.PrimaryOwner}</p>
                      {row.PrimaryPhone && row.PrimaryPhone !== '-' && row.PrimaryPhone !== 'nan' && (
                        <p className="text-xs text-gray-400">{row.PrimaryPhone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`status-badge text-xs ${row.SaleResale === '1st Owner' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                        {row.SaleResale}
                      </span>
                    </td>
                    <td className="px-4 py-3">{residentBadge(row.Residing)}</td>
                    <td className="px-4 py-3">{kycBadge(row.OwnerKYC)}</td>
                    <td className="px-4 py-3">{kycBadge(row.TenantKYC)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${
                        (row.DocumentsPending || '').includes('Complete') ? 'text-green-600' :
                        (row.DocumentsPending || '').includes('Pending') ? 'text-red-500' :
                        'text-gray-500'
                      }`}>{row.DocumentsPending || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setViewRow(row)}
                        className="text-blue-500 hover:text-blue-600 text-sm font-medium hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium">No residents match your filters</p>
              </div>
            )}
            {filtered.length > 300 && (
              <div className="text-center py-4 text-xs text-gray-400 border-t">
                Showing first 300 of {filtered.length} results. Use filters to narrow down.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {viewRow && <ResidentViewModal row={viewRow} onClose={() => setViewRow(null)} />}
    </div>
  );
}
