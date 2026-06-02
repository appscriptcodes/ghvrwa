/* ===================================================
   utils.js — Shared Helpers, API Client & Config
   Global Hillview Society Portal
   =================================================== */

// ─── GAS URL ────────────────────────────────────────
const qs  = new URLSearchParams(location.search);
const GAS = qs.get('gas') || window.ENV_GAS_URL || '';
console.log('🔗 Using GAS URL:', GAS);

// ─── INR Formatter ──────────────────────────────────
const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

// ─── Tower / Flat Config ────────────────────────────
const TOWERS         = ['1', '2', '3', '4', '5'];
const FLATS_PER_FLOOR = ['01', '02', '03', '04', '05', '06', '07', '08'];

function generateFlatNumbers(tower) {
  const flats    = [];
  const maxFloor = tower === '3' ? 18 : 19;
  for (let floor = 1; floor <= maxFloor; floor++) {
    FLATS_PER_FLOOR.forEach(flat => flats.push(`${floor}${flat}`));
  }
  return flats;
}

// ─── Date Formatter ─────────────────────────────────
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
  const d      = String(date.getDate()).padStart(2, '0');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d}-${months[date.getMonth()]}-${date.getFullYear()}`;
};

// ─── Drive Thumbnail Helper ──────────────────────────
function driveDirectLink(url, size = 100) {
  if (!url) return '';
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const id     = (match1 && match1[1]) || (match2 && match2[1]);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${size}` : url;
}

// ─── Excel Export ────────────────────────────────────
const ExcelExport = {
  exportToExcel(data, filename) {
    if (typeof XLSX === 'undefined') { alert('Excel library not loaded. Please refresh.'); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0,10)}.xlsx`);
  }
};

// ─── Toast Notification ──────────────────────────────
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container') || (() => {
    const div       = document.createElement('div');
    div.id          = 'toast-container';
    div.className   = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
    document.body.appendChild(div);
    return div;
  })();

  const toast     = document.createElement('div');
  const bgColor   = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  toast.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg fade-in`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ─── HTTP Helpers ────────────────────────────────────
async function fetchWithTimeout(url, opts = {}, ms = 12000) {
  const ctl = new AbortController();
  const id  = setTimeout(() => ctl.abort(), ms);
  try   { return await fetch(url, { ...opts, signal: ctl.signal }); }
  finally { clearTimeout(id); }
}

async function getJSON(action, extra = {}, timeoutMs = 12000) {
  if (!GAS) throw new Error('Backend not configured');
  const u = new URL(GAS);
  u.searchParams.set('action', action);
  for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v);

  try {
    const r = await fetchWithTimeout(u, { cache: 'no-store' }, timeoutMs);
    if (!r.ok) throw new Error(await r.text().catch(() => r.statusText));
    return r.json();
  } catch (corsError) {
    console.log('⚠️ CORS failed, trying JSONP fallback...', corsError);
    return new Promise((resolve, reject) => {
      const callbackName  = 'jsonp_' + Date.now();
      window[callbackName] = (data) => {
        delete window[callbackName];
        document.body.removeChild(script);
        resolve(data);
      };
      const script   = document.createElement('script');
      u.searchParams.set('callback', callbackName);
      script.src     = u.toString();
      script.onerror = () => reject(new Error('JSONP request failed'));
      document.body.appendChild(script);
      setTimeout(() => {
        if (window[callbackName]) {
          delete window[callbackName];
          document.body.removeChild(script);
          reject(new Error('Request timeout'));
        }
      }, timeoutMs);
    });
  }
}

async function postPlain(body) {
  if (!GAS) throw new Error('Backend not configured');
  const r = await fetchWithTimeout(GAS, {
    method:  'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body:    JSON.stringify(body)
  }, 60000);
  if (!r.ok) throw new Error(await r.text().catch(() => r.statusText));
  return r.json();
}

// ─── API Client ──────────────────────────────────────
const api = {
  async login(u, p) {
    try   { return await postPlain({ op: 'login', username: u, password: p }); }
    catch { return getJSON('login', { u, p }); }
  },
  async sessionInfo(token)                                    { return postPlain({ op: 'sessionInfo', token }); },
  async changePassword(username, oldPassword, newPassword)    { return postPlain({ op: 'changePassword', username, oldPassword, newPassword }); },
  list: {
    Directory:       () => getJSON('listDirectory'),
    Notices:         () => getJSON('listNotices'),
    Issues:          () => getJSON('listIssues'),
    Transactions:    () => getJSON('listTransactions'),
    Documents:       () => getJSON('listDocuments'),
    Voters:          () => getJSON('listVoters'),
    OpeningBalances: () => getJSON('listOpeningBalances').catch(() => ({ rows: [] })),
    ChartOfAccounts: () => getJSON('listChartOfAccounts').catch(() => ({ rows: [] })),
    Tenants:         () => getJSON('listTenants'),
    Residents:       () => getJSON('listResidents').catch(() => ({ rows: [] })),
    Cheques:         () => getJSON('listCheques').catch(() => ({ rows: [] })),
    Imprest:         () => getJSON('listImprest').catch(() => ({ rows: [] })),
  },
  async upsertRow(sheet, key, row) { return postPlain({ op: 'upsertRow', sheet, key, row }); },
  async createRow(sheet, row)      { return postPlain({ op: 'createRow', sheet, row }); },
};

// ─── File Upload Helper ──────────────────────────────
async function maybeUploadField(obj, sheet, field, namePrefix = field.toLowerCase()) {
  const val = obj[field];
  if (!val || typeof val !== 'string' || !val.startsWith('data:')) return obj;

  const mimeMatch = val.match(/data:([^;]+)(;base64)?/);
  const mime      = (mimeMatch && mimeMatch[1]) || 'application/octet-stream';
  const ext       = (mime.split('/')[1] || 'bin').replace('+xml', '');

  const res = await postPlain({
    op:       'uploadFile',
    sheet,
    fileName: `${namePrefix}_${Date.now()}.${ext}`,
    fileData: val
  });

  if (!res.ok) throw new Error(res.error || 'Upload failed');
  obj[field] = res.file.url;
  return obj;
}

// ─── Dark Mode Hook ──────────────────────────────────
function useDarkMode() {
  const [theme, setTheme] = React.useState(() => localStorage.getItem('theme') || 'light');

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  return [theme, toggleTheme];
}

// ─── Theme Toggle Button ─────────────────────────────
function ThemeToggle({ theme, toggleTheme }) {
  return (
    <button
      onClick={toggleTheme}
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
}

// ─── Export Button ───────────────────────────────────
function ExportButton({ data, filename, label = 'Export to Excel' }) {
  return (
    <button
      onClick={() => ExcelExport.exportToExcel(data, filename)}
      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2 transition-colors"
      title="Export to Excel"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
