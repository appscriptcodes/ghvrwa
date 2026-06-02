/* ===================================================
   App.js — Main App Shell, ChangePasswordModal & Boot
   Global Hillview Society Portal
   =================================================== */

// ── Change Password Modal ─────────────────────────────
function ChangePasswordModal({ username, onClose }) {
  const { useState } = React;
  const [formData, setFormData] = useState({ oldPass: '', newPass: '', confirmPass: '' });
  const [loading,  setLoading]  = useState(false);
  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!formData.oldPass || !formData.newPass) return showToast('Please fill all fields', 'error');
    if (formData.newPass !== formData.confirmPass)  return showToast('New passwords do not match', 'error');
    setLoading(true);
    try {
      const res = await api.changePassword(username, formData.oldPass, formData.newPass);
      if (res.ok) { showToast('Password changed successfully!', 'success'); onClose(); }
      else          showToast(res.error || 'Failed to change password', 'error');
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
    finally     { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold">Change Password</h3>
        </div>
        <div className="p-6 space-y-4">
          {[['Old Password','oldPass'],['New Password','newPass'],['Confirm New Password','confirmPass']].map(([label, key]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type="password" className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                value={formData[key]} onChange={e => set(key, e.target.value)} />
            </div>
          ))}
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────
function App() {
  const { useState, useEffect } = React;

  const [theme,        toggleTheme]      = useDarkMode();
  const [session,      setSession]       = useState({ token: null, role: null, username: null });
  const [view,         setView]          = useState(session.username === 'enviro' ? 'Imprest' : 'dashboard');
  const [data,         setData]          = useState({
    Directory: [], Notices: [], Issues: [], Transactions: [],
    Documents: [], Voters: [], OpeningBalances: [], ChartOfAccounts: [], Tenants: [],
    Residents: typeof RESIDENTS_STATIC_DATA !== 'undefined' ? RESIDENTS_STATIC_DATA : [],
    Cheques:   [],
    Imprest:   [],
  });
  const [loading,             setLoading]             = useState(true);
  const [sidebarOpen,         setSidebarOpen]         = useState(true);
  const [showChatbot,         setShowChatbot]         = useState(false);
  const [showPasswordModal,   setShowPasswordModal]   = useState(false);
  const [chatBtnPos, setChatBtnPos] = React.useState({
  x: window.innerWidth - 120,
  y: window.innerHeight - 120
});

const chatBtnDrag = React.useRef({
  dragging: false,
  offsetX: 0,
  offsetY: 0
});

const startChatBtnDrag = (e) => {
  if (e.button !== 0) return;

  chatBtnDrag.current = {
    dragging: true,
    offsetX: e.clientX - chatBtnPos.x,
    offsetY: e.clientY - chatBtnPos.y
  };

  e.preventDefault();
};

React.useEffect(() => {
  const move = (e) => {
    if (!chatBtnDrag.current.dragging) return;

    setChatBtnPos({
      x: Math.max(10, Math.min(window.innerWidth - 80, e.clientX - chatBtnDrag.current.offsetX)),
      y: Math.max(10, Math.min(window.innerHeight - 80, e.clientY - chatBtnDrag.current.offsetY))
    });
  };

  const stop = () => {
    chatBtnDrag.current.dragging = false;
  };

  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", stop);

  return () => {
    window.removeEventListener("mousemove", move);
    window.removeEventListener("mouseup", stop);
  };
}, []);

  // Restore session on mount
  useEffect(() => {
    const token = qs.get('session') || localStorage.getItem('session');
    if (token) {
      (async () => {
        try {
          const s = await api.sessionInfo(token);
          if (s?.ok) setSession({ token, role: (s.role || 'user').toLowerCase(), username: s.username || 'user' });
          else        localStorage.removeItem('session');
        } catch (e) { console.error(e); }
        await refreshData();
      })();
    } else {
      setLoading(false);
    }
  }, []);

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') { root.classList.add('dark'); document.body.classList.add('dark'); }
    else                  { root.classList.remove('dark'); document.body.classList.remove('dark'); }
  }, [theme]);

  async function refreshData() {
    setLoading(true);
    const safe = p => p.catch(e => { console.warn('API:', e); return { rows: [] }; });
    try {
      const [dirRes,notRes,issRes,txnRes,docRes,votRes,obRes,coaRes,tenRes,resRes,cheRes,impRes] = await Promise.all([
        safe(api.list.Directory()), safe(api.list.Notices()), safe(api.list.Issues()),
        safe(api.list.Transactions()), safe(api.list.Documents()), safe(api.list.Voters()),
        safe(api.list.OpeningBalances()), safe(api.list.ChartOfAccounts()), safe(api.list.Tenants()),
        safe(api.list.Residents()), safe(api.list.Cheques()), safe(api.list.Imprest()),
      ]);
      setData({
        Directory:       dirRes?.rows || [],
        Notices:         notRes?.rows || [],
        Issues:          issRes?.rows || [],
        Transactions:    txnRes?.rows || [],
        Documents:       docRes?.rows || [],
        Voters:          votRes?.rows || [],
        OpeningBalances: obRes?.rows  || [],
        ChartOfAccounts: coaRes?.rows || [],
        Tenants:         tenRes?.rows || [],
        Residents:       resRes?.rows?.length ? resRes.rows : (typeof RESIDENTS_STATIC_DATA !== 'undefined' ? RESIDENTS_STATIC_DATA : []),
        Cheques:         cheRes?.rows || [],
        Imprest:         impRes?.rows || [],
      });
    } catch (e) { showToast('Failed to load data: ' + String(e), 'error'); }
    finally     { setLoading(false); }
  }

  if (!session.token) {
    return <LoginScreen onSuccess={s => { setSession(s); refreshData(); }} />;
  }

  const isAdmin  = session.role === 'admin';
  const isEnviro = session.username === 'enviro';

  // Build navigation — enviro sees ONLY Imprest
  const navItems = isEnviro ? [
    { id: 'Imprest', label: 'Imprest', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ] : [
    { id: 'dashboard',  label: 'Dashboard',  icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'Defaulters', label: 'Defaulters', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }, 
    { id: 'Directory',  label: 'Directory',  icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'Notices',    label: 'Notices',    icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { id: 'Issues',     label: 'Issues',     icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    { id: 'Documents',  label: 'Documents',  icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'Voters',     label: 'Voters',     icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  ];

  if (!isEnviro && isAdmin) {
    navItems.splice(2, 0, { id: 'Tenants', label: 'Tenants', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' });
    navItems.splice(2, 0, { id: 'Residents', label: 'Residents', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' });
    navItems.push(
      { id: 'Cheques',         label: 'Cheques',            icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
      { id: 'Imprest',         label: 'Imprest',            icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      { id: 'Budget',          label: 'Budget',             icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
      { id: 'Transactions',    label: 'Transactions',       icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      { id: 'OpeningBalances', label: 'Opening Balances',   icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
      { id: 'ChartOfAccounts', label: 'Chart of Accounts',  icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' }
    );
  }

  // ── Access Denied Placeholder ──────────────────────
  const AccessDenied = () => (
    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
      <p className="text-gray-500">This section is only available to administrators.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: hamburger + logo */}
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Global Hillview</h1>
                  <p className="text-xs text-gray-500">Sec-11, Sohna, Gurgaon</p>
                </div>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-3">
              <button onClick={refreshData} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Refresh data">
                <svg className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{session.username}</p>
                  <p className="text-xs text-gray-500 capitalize">{session.role}</p>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${isAdmin ? 'bg-blue-500' : 'bg-gray-500'}`}>
                  {session.username[0].toUpperCase()}
                </div>
                <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                <button onClick={() => setShowPasswordModal(true)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Change Password">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </button>
                <button onClick={() => { if (confirm('Are you sure you want to logout?')) { localStorage.removeItem('session'); setSession({ token: null, role: null, username: null }); }}}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Logout">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* ── Sidebar ── */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky top-16 left-0 z-20 w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-transform duration-300 flex flex-col`}>
          <nav className="p-4 space-y-1 overflow-y-auto flex-1">
            {navItems.map(item => (
              <button key={item.id} onClick={() => { setView(item.id); setSidebarOpen(false); }}
                className={`nav-item w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${view === item.id ? 'active' : 'text-gray-700 hover:text-gray-900'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                </svg>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-10 top-16" />
        )}

        {/* ── Main Content ── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
          ) : view === 'dashboard' ? (
            <Dashboard data={data} onNavigate={setView} isAdmin={isAdmin} />
          ) : view === 'Cheques' ? (
            isAdmin
              ? <ChequesPage gasData={data.Cheques} onDataChange={rows => setData(prev => ({...prev, Cheques: rows}))} />
              : <AccessDenied />
          ) : view === 'Imprest' ? (
            (isAdmin || isEnviro)
              ? <ImprestPage gasData={data.Imprest} onDataChange={rows => setData(prev => ({...prev, Imprest: rows}))} />
              : <AccessDenied />
          ) : view === 'Budget' ? (
            isAdmin
              ? <BudgetPage />
              : <AccessDenied />
          ) : view === 'Residents' ? (
            isAdmin
              ? <ResidentsPage data={data.Residents} />
              : <AccessDenied />
/* ─── YOUR NEW SECTION ─── */
          ) : view === 'Defaulters' ? (
            isAdmin 
              ? <DefaultersPage /> 
              : <AccessDenied />
          /* ─────────────────────── */
          ) : view === 'Directory' ? (
            <DirectoryPage data={data.Directory} isAdmin={isAdmin} onRefresh={refreshData} />
          ) : view === 'Tenants' ? (
            isAdmin
              ? <TenantsPage data={data.Tenants} isAdmin={isAdmin} onRefresh={refreshData} />
              : <AccessDenied />
          ) : view === 'Issues' ? (
            <IssuesPage data={data.Issues} isAdmin={isAdmin} onRefresh={refreshData} currentUser={session.username} />
          ) : view === 'Notices' ? (
            <NoticesPage data={data.Notices} isAdmin={isAdmin} onRefresh={refreshData} />
          ) : view === 'Transactions' ? (
            isAdmin
              ? <TransactionsPage data={data.Transactions} isAdmin={isAdmin} onRefresh={refreshData} chartOfAccounts={data.ChartOfAccounts} />
              : <div className="bg-white rounded-2xl shadow-sm p-8 text-center"><p>Access Restricted</p></div>
          ) : view === 'Documents' ? (
            <DocumentsPage data={data.Documents} isAdmin={isAdmin} onRefresh={refreshData} />
          ) : view === 'Voters' ? (
            <GenericTable title="Voters"
              data={isAdmin ? data.Voters : data.Voters.filter(v => {
                const parts     = (session.username || '').split('-');
                if (parts.length < 2) return false;
                const userTower = parts[0].trim().toLowerCase();
                const userFlat  = parts[1].trim();
                return String(v.Tower || '').trim().toLowerCase() === userTower
                    && String(v.Flat  || '').trim()               === userFlat;
              })}
              isAdmin={isAdmin} onRefresh={refreshData} />
          ) : view === 'OpeningBalances' ? (
            isAdmin
              ? <GenericTable title="Opening Balances" data={data.OpeningBalances} isAdmin={isAdmin} onRefresh={refreshData} />
              : <AccessDenied />
          ) : view === 'ChartOfAccounts' ? (
            isAdmin
              ? <GenericTable title="Chart of Accounts" data={data.ChartOfAccounts} isAdmin={isAdmin} onRefresh={refreshData} />
              : <AccessDenied />
          ) : (
            <GenericTable title={view} data={data[view]} isAdmin={isAdmin} onRefresh={refreshData} />
          )}

          {/* Chatbot */}
          {showChatbot && <Chatbot data={data} setView={setView} isAdmin={isAdmin} theme={theme} onClose={() => setShowChatbot(false)} />}

          {/* Floating chatbot toggle */}
<div
  onMouseDown={startChatBtnDrag}
  style={{
    position: "fixed",
    left: `${chatBtnPos.x}px`,
    top: `${chatBtnPos.y}px`,
    zIndex: 9999
  }}
>
  <button
    onClick={() => setShowChatbot(!showChatbot)}
    className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all cursor-grab active:cursor-grabbing"
    aria-label="Toggle Chatbot"
  >
       
            {showChatbot ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            )}
          </button>
</div>

          {/* Change Password Modal */}
          {showPasswordModal && (
            <ChangePasswordModal username={session.username} onClose={() => setShowPasswordModal(false)} />
          )}
        </main>
      </div>
    </div>
  );
}


/* ===================================================
   Boot.js — CORS Test & App Entry Point
   =================================================== */

function Boot() {
  const { useState, useEffect } = React;
  const [status, setStatus] = useState('connecting'); // connecting | ok | error
  const [errMsg, setErrMsg] = useState('');

  function tryConnect() {
    setStatus('connecting'); setErrMsg('');
    getJSON('testCors', {}, 15000)
      .then(() => setStatus('ok'))
      .catch(e => { console.error('Boot:', e); setErrMsg(String(e)); setStatus('error'); });
  }

  useEffect(() => { tryConnect(); }, []);

  /* ── Connecting splash — no URL shown ── */
  if (status === 'connecting') return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl mx-auto mb-5 flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
        </div>
        <div className="spinner mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900">Global Hillview</h2>
        <p className="text-sm text-gray-400 mt-1">Connecting to backend…</p>
      </div>
    </div>
  );

  /* ── Error screen ── */
  if (status === 'error') return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Connection Failed</h2>
          <p className="text-sm text-gray-500">Could not reach the backend service.</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5 text-xs text-amber-900 space-y-1">
          <p className="font-semibold mb-1">Common fixes:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Redeploy GAS — <em>Execute as: Me, Access: Anyone</em></li>
            <li>Verify the GAS URL in <code>index.html</code></li>
            <li>Open the GAS URL directly to confirm it responds</li>
          </ul>
        </div>
        <div className="flex gap-3">
          <button onClick={tryConnect}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
            Retry
          </button>
          <button onClick={() => setStatus('ok')}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition-colors">
            Continue Anyway
          </button>
        </div>
      </div>
    </div>
  );

  return React.createElement(App);
}

// ── Mount ──────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(Boot));
