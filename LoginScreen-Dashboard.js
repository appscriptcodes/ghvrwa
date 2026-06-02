/* ===================================================
   LoginScreen.js — Login Page Component
   Global Hillview Society Portal
   =================================================== */

function LoginScreen({ onSuccess }) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error,    setError]    = React.useState('');
  const [loading,  setLoading]  = React.useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const r = await api.login(username, password);
      if (r?.ok && r?.token) {
        localStorage.setItem('session', r.token);
        onSuccess({ token: r.token, role: (r.role || 'user').toLowerCase(), username: r.username || username });
        showToast('Welcome back!', 'success');
      } else {
        setError(r?.error || 'Invalid credentials');
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 fade-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Global Hillview</h1>
            <p className="text-gray-600 mt-2">Society Management Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="Enter your username" required autoFocus />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="Enter your password" required />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading && <div className="spinner" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>


          </form>
        </div>
      </div>
    </div>
  );
}


/* ===================================================
   Dashboard.js — Dashboard Summary Component
   =================================================== */

function Dashboard({ data, onNavigate, isAdmin }) {
  const { useMemo } = React;

  const stats = useMemo(() => {
    const openIssues        = data.Issues.filter(i => (i.Status || '').toLowerCase() !== 'resolved').length;
    const totalEnviroStaff  = data.Directory.length;
    const collected         = data.Transactions
      .filter(t => (t.Type || '').toLowerCase() === 'credit')
      .reduce((sum, t) => sum + Number(t.Amount || 0), 0);
    const expenses          = data.Transactions
      .filter(t => { const type = (t.Type || '').toLowerCase().trim(); return type === 'debit' || type === 'expense'; })
      .reduce((sum, t) => sum + Number(t.Amount || 0), 0);
    return { openIssues, totalEnviroStaff, collected, expenses };
  }, [data]);

  return (
    <div className="space-y-6 fade-in">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div onClick={() => onNavigate('Directory')} className="bg-white rounded-2xl p-6 shadow-sm card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Enviro Staff</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalEnviroStaff}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div onClick={() => onNavigate('Issues')} className="bg-white rounded-2xl p-6 shadow-sm card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Open Issues</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.openIssues}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        {isAdmin && (
          <>
            <div onClick={() => onNavigate('Transactions')} className="bg-white rounded-2xl p-6 shadow-sm card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Collected</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{INR.format(stats.collected)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div onClick={() => onNavigate('Transactions')} className="bg-white rounded-2xl p-6 shadow-sm card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Expenses</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{INR.format(stats.expenses)}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent Notices & Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Notices</h3>
            <button onClick={() => onNavigate('Notices')} className="text-sm text-blue-500 hover:text-blue-600 font-medium">View All →</button>
          </div>
          <div className="space-y-3">
            {data.Notices.slice(0, 5).map((notice, i) => (
              <div key={i} onClick={() => onNavigate('Notices')}
                className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{notice.Subject}</p>
                  <p className="text-xs text-gray-500 mt-1">{notice.Date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Issues</h3>
            <button onClick={() => onNavigate('Issues')} className="text-sm text-blue-500 hover:text-blue-600 font-medium">View All →</button>
          </div>
          <div className="space-y-3">
            {data.Issues.slice(0, 5).map((issue, i) => (
              <div key={i} onClick={() => onNavigate('Issues')}
                className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{issue.Title || issue.Description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`status-badge status-${(issue.Status || 'open').toLowerCase().replace(' ', '')}`}>
                      {issue.Status || 'Open'}
                    </span>
                    <span className="text-xs text-gray-500">{issue['Tracking ID']}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
