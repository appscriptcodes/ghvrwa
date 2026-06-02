/* ===================================================
   IssuesPage.js — Issues Page, View, Edit & Add Modals
   Global Hillview Society Portal
   =================================================== */

function IssuesPage({ data, isAdmin, onRefresh, currentUser }) {
  const { useState, useMemo } = React;

  const [search,            setSearch]            = useState('');
  const [activeStatusFilter,setActiveStatusFilter] = useState(null);
  const [editRow,           setEditRow]           = useState(null);
  const [viewRow,           setViewRow]           = useState(null);
  const [showAddModal,      setShowAddModal]      = useState(false);
  const [uploading,         setUploading]         = useState(false);

  // Filter by user tower/flat for non-admins
  const visibleData = useMemo(() => {
    if (isAdmin) return data;
    const match = (currentUser || '').match(/^T(\d+)-(\d+)$/i);
    if (!match) return [];
    return data.filter(row => String(row.Tower) === match[1] && String(row.Flat) === match[2]);
  }, [data, isAdmin, currentUser]);

  const stats = useMemo(() => {
    const open       = visibleData.filter(i => (i.Status || 'Open').toLowerCase() === 'open').length;
    const inProgress = visibleData.filter(i => (i.Status || '').toLowerCase() === 'inprogress').length;
    const resolved   = visibleData.filter(i => (i.Status || '').toLowerCase() === 'resolved').length;
    const ratings    = visibleData.filter(i => i['Feedback Rating']).map(i => Number(i['Feedback Rating']) || 0);
    const avgRating  = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0;
    return { open, inProgress, resolved, avgRating, total: visibleData.length };
  }, [visibleData]);

  const filtered = useMemo(() => {
    let result = visibleData;
    if (activeStatusFilter === 'open')       result = result.filter(i => (i.Status || 'Open').toLowerCase() === 'open');
    if (activeStatusFilter === 'inprogress') result = result.filter(i => (i.Status || '').toLowerCase() === 'inprogress');
    if (activeStatusFilter === 'resolved')   result = result.filter(i => (i.Status || '').toLowerCase() === 'resolved');
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
    }
    return result;
  }, [visibleData, search, activeStatusFilter]);

  return (
    <div className="space-y-6 fade-in">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: 'open',       label: 'Open',        value: stats.open,       color: 'orange' },
          { key: 'inprogress', label: 'In Progress',  value: stats.inProgress, color: 'blue'   },
          { key: 'resolved',   label: 'Resolved',     value: stats.resolved,   color: 'green'  },
        ].map(({ key, label, value, color }) => (
          <div key={key} onClick={() => setActiveStatusFilter(activeStatusFilter === key ? null : key)}
            className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer transition-all ${activeStatusFilter === key ? `ring-2 ring-${color}-500` : 'hover:shadow-md'}`}>
            <p className="text-xs text-gray-600">{label}</p>
            <p className={`text-2xl font-bold text-${color}-600 mt-1`}>{value}</p>
          </div>
        ))}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-600">Avg. Rating</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.avgRating} ⭐</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Issues ({filtered.length})</h2>
            <div className="flex items-center gap-3">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search..." className="px-4 py-2 border border-gray-300 rounded-lg" />
              <ExportButton data={filtered} filename="Issues" />
              <button onClick={() => setShowAddModal(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Report Issue
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Tracking ID','Title','Status','Redressal Remark','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{row['Tracking ID']}</td>
                  <td className="px-4 py-3 text-sm"><span className="line-clamp-1">{row.Title || row.Description}</span></td>
                  <td className="px-4 py-3">
                    <span className={`status-badge status-${(row.Status || 'open').toLowerCase().replace(' ','')}`}>
                      {row.Status || 'Open'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm"><span className="line-clamp-1">{row['Redressal Remark']}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewRow(row)} className="text-blue-500 hover:text-blue-600 text-sm font-medium">View</button>
                      {isAdmin && (
                        <button onClick={() => setEditRow(row)} className="text-green-500 hover:text-green-600 text-sm font-medium">Edit</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewRow && <IssueViewModal row={viewRow} onClose={() => setViewRow(null)} />}

      {editRow && (
        <IssueModal row={editRow} onClose={() => setEditRow(null)}
          onSave={async (formData) => {
            try {
              await api.upsertRow('Issues', 'Tracking ID', {
                'Tracking ID': editRow['Tracking ID'],
                Status: formData.Status,
                'Redressal Remark': formData['Redressal Remark'],
              });
              await onRefresh();
              setEditRow(null);
              showToast('Updated successfully', 'success');
            } catch (e) { showToast('Failed to update: ' + String(e.message || e), 'error'); }
          }} />
      )}

      {showAddModal && (
        <AddIssueModal data={data} uploading={uploading} currentUser={currentUser} isAdmin={isAdmin}
          onClose={() => setShowAddModal(false)}
          onSave={async (issueData) => {
            try {
              setUploading(true);
              if (!isAdmin && currentUser) {
                const m = currentUser.match(/^T(\d+)-(\d+)$/i);
                if (m) { issueData.Tower = m[1]; issueData.Flat = m[2]; }
              }
              await maybeUploadField(issueData, 'Issues', 'Media URL', 'issue');
              await api.createRow('Issues', issueData);
              await onRefresh();
              setShowAddModal(false);
              showToast('Issue reported successfully', 'success');
            } catch (e) { showToast('Failed: ' + String(e), 'error'); }
            finally     { setUploading(false); }
          }} />
      )}
    </div>
  );
}

// ── View Modal ────────────────────────────────────────
function IssueViewModal({ row, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold">Issue Details — {row['Tracking ID']}</h3>
        </div>
        <div className="p-6 space-y-3">
          {Object.keys(row).map(col => (
            <div key={col}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{col}</label>
              {(col === 'Media URL' || col === 'Media' || col === 'Attachment') && row[col] ? (
                row[col].match(/\.(jpg|jpeg|png|gif|webp)$/i)
                  ? <img src={row[col]} alt="Media" className="max-w-full h-auto rounded-lg" />
                  : <a href={row[col]} target="_blank" rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Attachment
                    </a>
              ) : (
                <p className="text-gray-900">{row[col] || '-'}</p>
              )}
            </div>
          ))}
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Admin Edit Modal ──────────────────────────────────
function IssueModal({ row, onClose, onSave }) {
  const { useState } = React;
  const [formData, setFormData] = useState({ Status: row.Status || 'Open', 'Redressal Remark': row['Redressal Remark'] || '' });
  const [saving,   setSaving]   = useState(false);
  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold">Edit Issue — {row['Tracking ID']}</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select value={formData.Status} onChange={e => set('Status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option value="Open">Open</option>
              <option value="InProgress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Redressal Remark</label>
            <textarea value={formData['Redressal Remark']} onChange={e => set('Redressal Remark', e.target.value)}
              rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button onClick={async () => { setSaving(true); try { await onSave(formData); } catch (e) { showToast('Save failed: ' + e.message, 'error'); } finally { setSaving(false); }}}
            disabled={saving} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2">
            {saving && <div className="spinner" style={{width:'16px',height:'16px',borderWidth:'2px'}} />}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add New Issue Modal ───────────────────────────────
function AddIssueModal({ data, uploading, onClose, onSave, currentUser, isAdmin }) {
  const { useState, useMemo } = React;

  const nextTrackingId = useMemo(() => {
    if (!data || !data.length) return 1001;
    return Math.max(...data.map(d => Number(d['Tracking ID']) || 0)) + 1;
  }, [data]);

  const residentInfo = useMemo(() => {
    if (!isAdmin && currentUser) {
      const match = currentUser.match(/^T(\d+)-(\d+)$/i);
      if (match) return { tower: match[1], flat: match[2] };
    }
    return null;
  }, [currentUser, isAdmin]);

  const categories = ['Housekeeping','Plumbing','Water','Electricity','Lifts','Parking','Security','STP','Other'];

  const [formData, setFormData] = useState({
    'Tracking ID': nextTrackingId,
    'Date and Time Raised': new Date().toISOString().replace('T',' ').substring(0,19),
    Tower: residentInfo ? residentInfo.tower : '',
    Flat:  residentInfo ? residentInfo.flat  : '',
    Category: '',
    Issue: '',
    Description: '',
    'Media URL': '',
    Status: 'Open'
  });
  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold">Report New Issue</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">Tracking ID: <span className="font-bold">#{nextTrackingId}</span></p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tower *</label>
              <select value={formData.Tower} onChange={e => set('Tower', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-500"
                required disabled={!!residentInfo}>
                <option value="">Select Tower</option>
                {TOWERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Flat *</label>
              <select value={formData.Flat} onChange={e => set('Flat', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-500"
                required disabled={!!residentInfo || !formData.Tower}>
                <option value="">Select Flat</option>
                {formData.Tower && generateFlatNumbers(formData.Tower).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            <select value={formData.Category} onChange={e => set('Category', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Issue Title *</label>
            <input type="text" value={formData.Issue} onChange={e => set('Issue', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Brief title (e.g. Leaking Tap)" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea value={formData.Description} onChange={e => set('Description', e.target.value)}
              rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Please describe the issue in detail..." required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo/Video</label>
            <input type="file" accept="image/*,video/*" capture="environment"
              onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = () => set('Media URL', r.result); r.readAsDataURL(f); }}}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            {formData['Media URL'] && (
              <div className="mt-2">
                {formData['Media URL'].startsWith('data:image')
                  ? <img src={formData['Media URL']} alt="Preview" className="w-32 h-32 rounded-lg object-cover" />
                  : <p className="text-sm text-green-600">✓ Media attached</p>}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} disabled={uploading} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button onClick={() => onSave(formData)}
            disabled={uploading || !formData.Tower || !formData.Flat || !formData.Category || !formData.Issue || !formData.Description}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2">
            {uploading && <div className="spinner" style={{width:'16px',height:'16px',borderWidth:'2px'}} />}
            {uploading ? 'Submitting...' : 'Submit Issue'}
          </button>
        </div>
      </div>
    </div>
  );
}
