/* ===================================================
   utils_supabase.js - Supabase-only client and shared helpers
   Global Hillview Society Portal
   =================================================== */

const qs = new URLSearchParams(location.search);

const SUPABASE_URL =
  qs.get('supabaseUrl') ||
  window.SUPABASE_URL ||
  'https://htubxnqlalgmktvjphex.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  qs.get('supabaseKey') ||
  window.SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_eZThw1S2MOut6qXg6JAMSg_cA3MH86p';

const SUPABASE_UPLOAD_BUCKET = window.SUPABASE_UPLOAD_BUCKET || 'portal-uploads';
const BACKEND_URL = SUPABASE_URL;
const GAS = ''; // compatibility placeholder; GAS is no longer used.

console.log('Using Supabase:', SUPABASE_URL);

const SHEETS = {
  Directory: 'Directory',
  Notices: 'Notices',
  Issues: 'Issues',
  Transactions: 'Transactions',
  Documents: 'Documents',
  Voters: 'Voters',
  OpeningBalances: 'OpeningBalances',
  ChartOfAccounts: 'ChartOfAccounts',
  Tenants: 'Tenants',
  Residents: 'Residents',
  Cheques: 'Cheques',
  Imprest: 'Imprest',
};

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const TOWERS = ['1', '2', '3', '4', '5'];
const FLATS_PER_FLOOR = ['01', '02', '03', '04', '05', '06', '07', '08'];

function generateFlatNumbers(tower) {
  const flats = [];
  const maxFloor = tower === '3' ? 18 : 19;
  for (let floor = 1; floor <= maxFloor; floor++) {
    FLATS_PER_FLOOR.forEach(flat => flats.push(`${floor}${flat}`));
  }
  return flats;
}

const formatDateDisplay = (val) => {
  if (!val) return '-';
  if (typeof val === 'string' && /^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(val)) return val;
  if (typeof val === 'string' && /^\d{1,2}-\d{1,2}-\d{4}$/.test(val)) {
    const [d, m, y] = val.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${d.padStart(2,'0')}-${months[parseInt(m)-1]}-${y}`;
  }
  const date = new Date(val);
  if (isNaN(date.getTime())) return val;
  const d = String(date.getDate()).padStart(2, '0');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d}-${months[date.getMonth()]}-${date.getFullYear()}`;
};

function driveDirectLink(url, size = 100) {
  if (!url) return '';
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const id = (match1 && match1[1]) || (match2 && match2[1]);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${size}` : url;
}

const ExcelExport = {
  exportToExcel(data, filename) {
    if (typeof XLSX === 'undefined') {
      alert('Excel library not loaded. Please refresh.');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0,10)}.xlsx`);
  },
};

function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container') || (() => {
    const div = document.createElement('div');
    div.id = 'toast-container';
    div.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
    document.body.appendChild(div);
    return div;
  })();

  const toast = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  toast.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg fade-in`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

async function fetchWithTimeout(url, opts = {}, ms = 12000) {
  const ctl = new AbortController();
  const id = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctl.signal });
  } finally {
    clearTimeout(id);
  }
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    'Content-Type': 'application/json',
    ...extra,
  };
}

function restUrl(table, params = {}) {
  const u = new URL(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/${table}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, v);
  });
  return u.toString();
}

async function supabaseRest(table, params = {}, opts = {}) {
  const headers = supabaseHeaders(opts.headers || {});
  if (opts.prefer) headers.Prefer = opts.prefer;

  const r = await fetchWithTimeout(restUrl(table, params), {
    method: opts.method || 'GET',
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    cache: 'no-store',
  }, opts.timeoutMs || 60000);

  if (!r.ok) {
    const text = await r.text().catch(() => r.statusText);
    throw new Error(`Supabase ${r.status}: ${text}`);
  }

  const text = await r.text();
  if (!text) return null;
  return JSON.parse(text);
}

async function selectAll(table, params = {}, pageSize = 1000) {
  const rows = [];
  let offset = 0;
  while (true) {
    const page = await supabaseRest(table, {
      ...params,
      limit: String(pageSize),
      offset: String(offset),
    });
    const batch = Array.isArray(page) ? page : [];
    rows.push(...batch);
    if (batch.length < pageSize) break;
    offset += pageSize;
  }
  return rows;
}

function serialNumberFromRow(rowObj) {
  const keys = ['Serial Number', 'Serial', 'SR.NO.', 'Sr No', 'Sr. No.', 'Sr.No', 'serial'];
  for (const key of keys) {
    const value = rowObj && rowObj[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      const n = Number(String(value).replace(/,/g, ''));
      if (!Number.isNaN(n)) return n;
    }
  }
  return null;
}

function keyCandidates(keyHeader) {
  const map = {
    'Serial Number': ['Serial Number', 'Serial', 'SR.NO.', 'Sr No', 'Sr. No.', 'Sr.No'],
    Serial: ['Serial', 'Serial Number', 'SR.NO.', 'Sr No', 'Sr. No.', 'Sr.No'],
    'CHEQUE NO.': ['CHEQUE NO.', 'Cheque No', 'Cheque Number', 'Chq/Ref No'],
    'Sr No': ['Sr No', 'Serial Number', 'Serial', 'SR.NO.', 'Sr. No.', 'Sr.No'],
  };
  return map[keyHeader] || [keyHeader];
}

function firstText(rowObj, keys, fallback = '') {
  for (const key of keys) {
    const value = rowObj && rowObj[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return fallback;
}

function normalizeResidentRow(rowObj) {
  const residingRaw = firstText(rowObj, ['Residing', 'Residing (Owner/Tenant)', 'Occupancy'], 'No Status');
  const residing = residingRaw === 'Vacant' ? 'Vaccant' : residingRaw;

  return {
    ...rowObj,
    SlNo: firstText(rowObj, ['SlNo', 'Sl. No.', 'Serial Number', 'Serial']),
    Tower: firstText(rowObj, ['Tower', 'Tower No.', 'Tower No', 'TowerNumber']),
    Flat: firstText(rowObj, ['Flat', 'Flat No.', 'Flat No', 'FlatNumber']),
    Residing: residing,
    SaleResale: firstText(rowObj, ['SaleResale', 'Sale & Resale'], '1st Owner'),
    Area: firstText(rowObj, ['Area', 'AREA(SqFt)', 'AREA(Sq Ft)', 'Area(SqFt)']),
    FlatType: firstText(rowObj, ['FlatType', 'Flat Type']),
    PrimaryOwner: firstText(rowObj, ['PrimaryOwner', 'Primary Owner Name']),
    SecondaryOwner: firstText(rowObj, ['SecondaryOwner', 'Secondary Owner Name'], '-'),
    PrimaryPhone: firstText(rowObj, ['PrimaryPhone', 'Primary Owner Number']),
    AltPhone1: firstText(rowObj, ['AltPhone1', 'Alternate Owner Number-1'], '-'),
    AltPhone2: firstText(rowObj, ['AltPhone2', 'Alternate Owner Number-2'], '-'),
    OwnerEmail: firstText(rowObj, ['OwnerEmail', 'Owner E-MAIL ID'], '-'),
    OwnerAltEmail: firstText(rowObj, ['OwnerAltEmail', 'Owner Alt E-MAIL ID'], '-'),
    Parking: firstText(rowObj, ['Parking', 'Parking No.'], '-'),
    Vehicle: firstText(rowObj, ['Vehicle', 'Vehicle Number'], '-'),
    OwnerKYC: firstText(rowObj, ['OwnerKYC', 'Owner KYC Done'], 'No Status'),
    TenantKYC: firstText(rowObj, ['TenantKYC', 'Tenant KYC Done'], 'No Status'),
    OwnerRegistry: firstText(rowObj, ['OwnerRegistry', 'Owner Registry'], 'No Status'),
    OwnerPhoto: firstText(rowObj, ['OwnerPhoto', 'Owner Photo'], 'No Status'),
    OwnerAadhar: firstText(rowObj, ['OwnerAadhar', 'Owner Aadhar'], 'No Status'),
    OwnerRC: firstText(rowObj, ['OwnerRC', 'Owner RC'], '-'),
    TenantRC: firstText(rowObj, ['TenantRC', 'Tenant RC'], '-'),
    TenantPhoto: firstText(rowObj, ['TenantPhoto', 'Tenant Photo'], 'No Status'),
    TenantAadhar: firstText(rowObj, ['TenantAadhar', 'Tenant Aadhar'], 'No Status'),
    TenantRentAgreement: firstText(rowObj, ['TenantRentAgreement', 'Tenant Rent Agreement'], 'No Status'),
    TenantPoliceVerification: firstText(rowObj, ['TenantPoliceVerification', 'Tenant Police Verification'], 'No Status'),
    DocumentsPending: firstText(rowObj, ['DocumentsPending', 'Documents Pending'], 'No Status'),
    EnviroReason: firstText(rowObj, ['EnviroReason', 'Enviro Reason']),
    MoveInOut: firstText(rowObj, ['MoveInOut', 'Move In & Out Charges']),
    MoveIn: firstText(rowObj, ['MoveIn', 'Move In'], '-'),
    MoveOut: firstText(rowObj, ['MoveOut', 'Move Out'], '-'),
    TenantName: firstText(rowObj, ['TenantName', 'Tenant Name'], '-'),
    TenantPhone: firstText(rowObj, ['TenantPhone', 'Tenant Contact no'], '-'),
    TenantEmail: firstText(rowObj, ['TenantEmail', 'Tenant Email Id'], '-'),
    TenantMoveIn: firstText(rowObj, ['TenantMoveIn', 'Tenant Move In'], '-'),
    TenantMoveOut: firstText(rowObj, ['TenantMoveOut', 'Tenant Move Out'], '-'),
    OldOwnerName: firstText(rowObj, ['OldOwnerName', 'Primary Old Owner Name'], '-'),
    NewDateOfPossession: firstText(rowObj, ['NewDateOfPossession', 'New Date of Possession'], '-'),
  };
}

async function nextNumber(field, sheet) {
  const rows = await supabaseRest('portal_rows', {
    select: field,
    sheet: `eq.${sheet}`,
    [field]: 'not.is.null',
    order: `${field}.desc`,
    limit: '1',
  });
  const current = rows && rows.length ? Number(rows[0][field]) || 0 : 0;
  return current + 1;
}

async function applyAutoSerial(sheet, rowObj) {
  if (serialNumberFromRow(rowObj) !== null) return rowObj;
  if (!['Documents', 'Notices', 'Transactions', 'Tenants', 'Directory'].includes(sheet)) return rowObj;
  const serial = await nextNumber('serial_number', sheet);
  rowObj[sheet === 'Directory' ? 'Serial' : 'Serial Number'] = serial;
  return rowObj;
}

async function listPortalRows(sheet) {
  const rows = await selectAll('portal_rows', {
    select: 'id,sheet,row_data,serial_number,sort_order,created_at,updated_at',
    sheet: `eq.${sheet}`,
    order: 'sort_order.asc,created_at.asc',
  });
  return rows.map(r => {
    const rowObj = { ...(r.row_data || {}) };
    return sheet === SHEETS.Residents ? normalizeResidentRow(rowObj) : rowObj;
  });
}

async function listPortalRowRecords(sheet) {
  return selectAll('portal_rows', {
    select: 'id,sheet,row_data,serial_number,sort_order,created_at,updated_at',
    sheet: `eq.${sheet}`,
    order: 'sort_order.asc,created_at.asc',
  });
}

async function findPortalRowByKey(sheet, keyHeader, rowObj) {
  const candidates = keyCandidates(keyHeader);
  const keyValue = candidates
    .map(k => rowObj && rowObj[k])
    .find(v => v !== undefined && v !== null && String(v) !== '');
  if (keyValue === undefined) return null;

  const wanted = String(keyValue);
  const records = await listPortalRowRecords(sheet);
  return records.find(record => {
    const data = record.row_data || {};
    return candidates.some(key => String(data[key] || '') === wanted);
  }) || null;
}

async function createPortalRow(sheet, rowObj, files = []) {
  const row = { ...(rowObj || {}) };
  await applyAutoSerial(sheet, row);
  const uploadedFiles = await applyFilePayloadsToRow(sheet, row, files);

  if (sheet === 'Directory' && row['Resigned On'] && String(row['Resigned On']).trim()) {
    row.Active = 'No';
  }

  const serial = serialNumberFromRow(row);
  const sortOrder = serial !== null ? serial : await nextNumber('sort_order', sheet);

  await supabaseRest('portal_rows', {}, {
    method: 'POST',
    body: {
      sheet,
      row_data: row,
      serial_number: serial,
      sort_order: sortOrder,
    },
    prefer: 'return=minimal',
  });

  return {
    ok: true,
    uploadedFiles,
    recordId: row['Serial Number'] || row.Serial || row['Tracking ID'] ||
      row['Flat Number'] || row['Transaction ID'] || row['Document ID'] ||
      row['CHEQUE NO.'] || row['Sr No'] || '',
  };
}

async function upsertPortalRow(sheet, keyHeader, rowObj, files = []) {
  const found = await findPortalRowByKey(sheet, keyHeader, rowObj || {});
  if (!found) {
    return { ...(await createPortalRow(sheet, rowObj, files)), mode: 'create' };
  }

  const merged = { ...(found.row_data || {}), ...(rowObj || {}) };
  const uploadedFiles = await applyFilePayloadsToRow(sheet, merged, files);
  if (sheet === 'Directory' && merged['Resigned On'] && String(merged['Resigned On']).trim()) {
    merged.Active = 'No';
  }

  await supabaseRest('portal_rows', { id: `eq.${found.id}` }, {
    method: 'PATCH',
    body: {
      row_data: merged,
      serial_number: serialNumberFromRow(merged),
    },
    prefer: 'return=minimal',
  });

  return { ok: true, mode: 'update', uploadedFiles };
}

async function clearPortalSheet(sheet) {
  await supabaseRest('portal_rows', { sheet: `eq.${sheet}` }, {
    method: 'DELETE',
    prefer: 'return=minimal',
  });
  return { ok: true };
}

function sessionToken() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2);
}

async function loginSupabase(username, password) {
  const rows = await supabaseRest('portal_users', {
    select: 'username,password,role,active',
    username: `eq.${username}`,
    password: `eq.${password}`,
    active: 'eq.Yes',
    limit: '1',
  });

  if (!rows || !rows.length) return { ok: false, error: 'Invalid credentials' };

  const user = rows[0];
  const token = sessionToken();
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString();

  await supabaseRest('portal_sessions', {}, {
    method: 'POST',
    body: {
      token,
      username: user.username,
      role: user.role || 'user',
      expires_at: expires,
    },
    prefer: 'return=minimal',
  });

  localStorage.setItem('session', token);
  return { ok: true, token, role: user.role || 'user', username: user.username };
}

async function sessionInfoSupabase(token) {
  if (!token) return { ok: false };
  const rows = await supabaseRest('portal_sessions', {
    select: 'token,username,role,expires_at',
    token: `eq.${token}`,
    limit: '1',
  });
  if (!rows || !rows.length) return { ok: false };
  if (new Date(rows[0].expires_at) < new Date()) return { ok: false };
  return { ok: true, username: rows[0].username, role: rows[0].role || 'user' };
}

async function changePasswordSupabase(username, oldPassword, newPassword) {
  const rows = await supabaseRest('portal_users', {
    select: 'username,password',
    username: `eq.${username}`,
    limit: '1',
  });
  if (!rows || !rows.length) return { ok: false, error: 'User not found' };
  if (String(rows[0].password) !== String(oldPassword)) return { ok: false, error: 'Incorrect old password' };

  await supabaseRest('portal_users', { username: `eq.${username}` }, {
    method: 'PATCH',
    body: { password: newPassword },
    prefer: 'return=minimal',
  });
  return { ok: true };
}

function dataUrlToBlob(dataUrl) {
  const [meta, raw] = String(dataUrl || '').split(',');
  const mime = ((meta || '').match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
  const bytes = atob(raw || '');
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return { blob: new Blob([arr], { type: mime }), mime };
}

async function uploadDataUrlToSupabase(dataUrl, fileName) {
  const { blob, mime } = dataUrlToBlob(dataUrl);
  const safeName = String(fileName || `upload_${Date.now()}`)
    .replace(/[^A-Za-z0-9._-]/g, '_');
  const path = `${new Date().toISOString().slice(0,10)}/${Date.now()}_${safeName}`;
  const url = `${SUPABASE_URL.replace(/\/+$/, '')}/storage/v1/object/${SUPABASE_UPLOAD_BUCKET}/${encodeURIComponent(path).replace(/%2F/g, '/')}`;

  const r = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      'Content-Type': mime,
      'x-upsert': 'true',
    },
    body: blob,
  }, 60000);

  if (!r.ok) throw new Error(await r.text().catch(() => 'Upload failed'));
  return `${SUPABASE_URL.replace(/\/+$/, '')}/storage/v1/object/public/${SUPABASE_UPLOAD_BUCKET}/${path}`;
}

async function applyFilePayloadsToRow(sheet, row, files = []) {
  if (!files || !files.length) return [];
  const uploaded = [];
  for (const file of files) {
    if (!file || !file.data) continue;
    const url = await uploadDataUrlToSupabase(file.data, file.name || `${sheet}_${Date.now()}`);
    uploaded.push({ name: file.name || '', url });
  }
  if (uploaded.length) {
    const urls = uploaded.map(f => f.url).join(', ');
    row.Attachment = row.Attachment ? `${row.Attachment}, ${urls}` : urls;
  }
  return uploaded;
}

async function maybeUploadField(obj, sheet, field, namePrefix = field.toLowerCase()) {
  const val = obj[field];
  if (!val || typeof val !== 'string' || !val.startsWith('data:')) return obj;

  const mimeMatch = val.match(/data:([^;]+)(;base64)?/);
  const mime = (mimeMatch && mimeMatch[1]) || 'application/octet-stream';
  const ext = (mime.split('/')[1] || 'bin').replace('+xml', '');
  obj[field] = await uploadDataUrlToSupabase(val, `${namePrefix}_${Date.now()}.${ext}`);
  return obj;
}

async function postPlain(body) {
  switch ((body && body.op) || '') {
    case 'ping':
      return { ok: true, now: new Date().toISOString() };
    case 'login':
      return loginSupabase(body.username || body.u || '', body.password || body.p || '');
    case 'sessionInfo':
      return sessionInfoSupabase(body.token);
    case 'changePassword':
      return changePasswordSupabase(body.username, body.oldPassword, body.newPassword);
    case 'createRow':
      return createPortalRow(body.sheet, body.row || {}, body.files || []);
    case 'upsertRow':
      return upsertPortalRow(body.sheet, body.key, body.row || {}, body.files || []);
    case 'clearSheet':
      return clearPortalSheet(body.sheet);
    case 'uploadFile': {
      const url = await uploadDataUrlToSupabase(body.fileData, body.fileName);
      return { ok: true, url, file: { url, name: body.fileName } };
    }
    default:
      return { ok: false, error: 'Unknown op: ' + ((body && body.op) || '') };
  }
}

async function getJSON(action, extra = {}, timeoutMs = 12000) {
  if (action === 'testCors') {
    await supabaseRest('portal_rows', { select: 'id', limit: '1' }, { timeoutMs });
    return { ok: true, message: 'Supabase is connected.', timestamp: new Date().toISOString() };
  }

  if (action === 'login') return loginSupabase(extra.u || '', extra.p || '');

  const map = {
    listDirectory: SHEETS.Directory,
    listNotices: SHEETS.Notices,
    listIssues: SHEETS.Issues,
    listTransactions: SHEETS.Transactions,
    listDocuments: SHEETS.Documents,
    listVoters: SHEETS.Voters,
    listOpeningBalances: SHEETS.OpeningBalances,
    listChartOfAccounts: SHEETS.ChartOfAccounts,
    listTenants: SHEETS.Tenants,
    listResidents: SHEETS.Residents,
    listCheques: SHEETS.Cheques,
    listImprest: SHEETS.Imprest,
  };

  const sheet = map[action];
  if (!sheet) return { ok: true, hint: 'Use list* actions' };
  return { rows: await listPortalRows(sheet) };
}

const api = {
  login: (u, p) => loginSupabase(u, p),
  sessionInfo: token => sessionInfoSupabase(token),
  changePassword: (username, oldPassword, newPassword) => changePasswordSupabase(username, oldPassword, newPassword),
  list: {
    Directory: () => getJSON('listDirectory'),
    Notices: () => getJSON('listNotices'),
    Issues: () => getJSON('listIssues'),
    Transactions: () => getJSON('listTransactions'),
    Documents: () => getJSON('listDocuments'),
    Voters: () => getJSON('listVoters'),
    OpeningBalances: () => getJSON('listOpeningBalances').catch(() => ({ rows: [] })),
    ChartOfAccounts: () => getJSON('listChartOfAccounts').catch(() => ({ rows: [] })),
    Tenants: () => getJSON('listTenants'),
    Residents: () => getJSON('listResidents').catch(() => ({ rows: [] })),
    Cheques: () => getJSON('listCheques').catch(() => ({ rows: [] })),
    Imprest: () => getJSON('listImprest').catch(() => ({ rows: [] })),
  },
  upsertRow: (sheet, key, row, files = []) => upsertPortalRow(sheet, key, row, files),
  createRow: (sheet, row, files = []) => createPortalRow(sheet, row, files),
};

function useDarkMode() {
  const [theme, setTheme] = React.useState(() => localStorage.getItem('theme') || 'light');

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  return [theme, toggleTheme];
}

function ThemeToggle({ theme, toggleTheme }) {
  return (
    <button
      onClick={toggleTheme}
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
}

function ExportButton({ data, filename, label = 'Export' }) {
  return (
    <button
      onClick={() => ExcelExport.exportToExcel(data, filename)}
      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2 transition-colors"
      title="Export to Excel"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
