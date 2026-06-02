/* ===================================================
   DocumentsPage.js — Documents Page & Modals
   Global Hillview Society Portal
   =================================================== */

function DocumentsPage({ data, isAdmin, onRefresh }) {
  const { useState, useMemo } = React;

  const nextSerial = useMemo(() => {
    const serials = data.map(d => Number(d['Serial Number']) || 0);
    return serials.length ? Math.max(...serials) + 1 : 1;
  }, [data]);

  const [search,       setSearch]       = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewRow,      setViewRow]      = useState(null);
  const [uploading,    setUploading]    = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
  }, [data, search]);

  return (
    <div className="space-y-6 fade-in">
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-semibold text-gray-900">Documents ({filtered.length})</h2>
            <div className="flex items-center gap-3">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search..." className="px-4 py-2 border border-gray-300 rounded-lg" />
              <ExportButton data={filtered} filename="Documents" />
              {isAdmin && (
                <button onClick={() => setShowAddModal(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Title','Date','Description','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{row.Title}</td>
                  <td className="px-4 py-3 text-sm">{formatDateDisplay(row.Date)}</td>
                  <td className="px-4 py-3 text-sm"><span className="line-clamp-1">{row.Description}</span></td>
                  <td className="px-4 py-3">
                    <button onClick={() => setViewRow(row)} className="text-blue-500 hover:text-blue-600 text-sm font-medium">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewRow && <DocumentViewModal row={viewRow} onClose={() => setViewRow(null)} />}

      {showAddModal && (
        <DocumentModal nextSerial={nextSerial} uploading={uploading}
          onClose={() => setShowAddModal(false)}
          onSave={async (formData) => {
            try {
              setUploading(true);
              await maybeUploadField(formData, 'Documents', 'Media', 'doc');
              await api.createRow('Documents', formData);
              await onRefresh();
              setShowAddModal(false);
              showToast('Document added', 'success');
            } catch (e) { showToast('Failed: ' + String(e), 'error'); }
            finally     { setUploading(false); }
          }} />
      )}
    </div>
  );
}

function DocumentViewModal({ row, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold">Document Details</h3>
        </div>
        <div className="p-6 space-y-3">
          {Object.keys(row).map(col => (
            <div key={col}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{col}</label>
              {col === 'Media' && row[col] ? (
                row[col].match(/\.(jpg|jpeg|png|gif)$/i)
                  ? <img src={row[col]} alt="Document" className="max-w-full h-auto rounded-lg" />
                  : <a href={row[col]} target="_blank" rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Attachment
                    </a>
              ) : <p className="text-gray-900">{row[col] || '-'}</p>}
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

function DocumentModal({ nextSerial, uploading, onClose, onSave }) {
  const { useState } = React;
  const [formData, setFormData] = useState({
    'Serial Number': nextSerial,
    Title: '',
    Date: new Date().toISOString().split('T')[0],
    Description: '',
    Media: ''
  });
  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold">Add Document</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">Auto Serial Number: <span className="font-bold">#{nextSerial}</span></p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input type="text" value={formData.Title} onChange={e => set('Title', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input type="date" value={formData.Date} onChange={e => set('Date', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea value={formData.Description} onChange={e => set('Description', e.target.value)}
              rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attach File</label>
            <input type="file" onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = () => set('Media', r.result); r.readAsDataURL(f); }}}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} disabled={uploading} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button onClick={() => onSave(formData)} disabled={uploading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2">
            {uploading && <div className="spinner" style={{width:'16px',height:'16px',borderWidth:'2px'}} />}
            {uploading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}


/* ===================================================
   TenantsPage.js — Tenants Page & Modals
   =================================================== */

function TenantsPage({ data, isAdmin, onRefresh }) {
  const { useState, useMemo } = React;

  const nextSerial = useMemo(() => {
    const ids = data.map(d => Number(d['Serial Number']) || 0);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }, [data]);

  const [search,       setSearch]       = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewRow,      setViewRow]      = useState(null);
  const [editRow,      setEditRow]      = useState(null);
  const [uploading,    setUploading]    = useState(false);

  const stats = useMemo(() => {
    const total      = data.length;
    const verified   = data.filter(t => (t['Police Verification'] || '').toLowerCase() === 'yes').length;
    return { total, verified, unverified: total - verified };
  }, [data]);

  const filtered = useMemo(() => {
    let result = data;
    if (activeFilter === 'verified')   result = result.filter(t => (t['Police Verification'] || '').toLowerCase() === 'yes');
    if (activeFilter === 'unverified') result = result.filter(t => (t['Police Verification'] || '').toLowerCase() !== 'yes');
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
    }
    return result;
  }, [data, search, activeFilter]);

  return (
    <div className="space-y-6 fade-in">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div onClick={() => setActiveFilter('all')}
          className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer transition-all ${activeFilter === 'all' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}>
          <p className="text-xs text-gray-600">Total Tenants</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.total}</p>
        </div>
        <div onClick={() => setActiveFilter(activeFilter === 'verified' ? 'all' : 'verified')}
          className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer transition-all ${activeFilter === 'verified' ? 'ring-2 ring-green-500' : 'hover:shadow-md'}`}>
          <p className="text-xs text-gray-600">Police Verified</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.verified}</p>
        </div>
        <div onClick={() => setActiveFilter(activeFilter === 'unverified' ? 'all' : 'unverified')}
          className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer transition-all ${activeFilter === 'unverified' ? 'ring-2 ring-orange-500' : 'hover:shadow-md'}`}>
          <p className="text-xs text-gray-600">Pending Verification</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{stats.unverified}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-semibold text-gray-900">Tenants ({filtered.length})</h2>
            <div className="flex items-center gap-3">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search..." className="px-4 py-2 border border-gray-300 rounded-lg" />
              <ExportButton data={filtered} filename="Tenants" />
              {isAdmin && (
                <button onClick={() => setShowAddModal(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Tenant
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Tenant Name','Owner Name','Tower','Flat','Mobile','Residing Since','Police Verification','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{row['Tenant Name']}</td>
                  <td className="px-4 py-3 text-sm">{row['Owner Name']}</td>
                  <td className="px-4 py-3 text-sm">{row.Tower}</td>
                  <td className="px-4 py-3 text-sm">{row.Flat}</td>
                  <td className="px-4 py-3 text-sm">{row.Mobile}</td>
                  <td className="px-4 py-3 text-sm">{formatDateDisplay(row['Residing Since'])}</td>
                  <td className="px-4 py-3">
                    <span className={`status-badge ${(row['Police Verification'] || '').toLowerCase() === 'yes' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {row['Police Verification'] || 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewRow(row)} className="text-blue-500 hover:text-blue-600 text-sm font-medium">View</button>
                      {isAdmin && <button onClick={() => setEditRow(row)} className="text-green-500 hover:text-green-600 text-sm font-medium">Edit</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewRow && <TenantViewModal row={viewRow} onClose={() => setViewRow(null)} />}

      {(showAddModal || editRow) && (
        <TenantModal row={editRow} nextSerial={nextSerial} uploading={uploading}
          onClose={() => { setShowAddModal(false); setEditRow(null); }}
          onSave={async (formData) => {
            try {
              setUploading(true);
              await maybeUploadField(formData, 'Tenants', 'Attachments', 'tenant');
              if (editRow) await api.upsertRow('Tenants', 'Serial Number', { ...editRow, ...formData });
              else         await api.createRow('Tenants', formData);
              await onRefresh();
              setShowAddModal(false); setEditRow(null);
              showToast('Tenant saved successfully', 'success');
            } catch (e) { showToast('Failed: ' + String(e), 'error'); }
            finally     { setUploading(false); }
          }} />
      )}
    </div>
  );
}

function TenantViewModal({ row, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold">Tenant Details</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Tenant Name', row['Tenant Name']],['Owner Name', row['Owner Name']],
              ['Tower', row.Tower],['Flat', row.Flat],
              ['Mobile', row.Mobile],['Aadhar', row.Aadhar || '-'],
              ['Residing Since', row['Residing Since']],
            ].map(([label, value]) => (
              <div key={label}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <p className="text-gray-900">{value}</p>
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Police Verification</label>
              <span className={`status-badge ${(row['Police Verification'] || '').toLowerCase() === 'yes' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {row['Police Verification'] || 'No'}
              </span>
            </div>
          </div>
          {row.Attachments && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
              {row.Attachments.match(/\.(jpg|jpeg|png|gif)$/i)
                ? <img src={row.Attachments} alt="Attachment" className="max-w-full h-auto rounded-lg" />
                : <a href={row.Attachments} target="_blank" rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Attachment
                  </a>}
            </div>
          )}
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Close</button>
        </div>
      </div>
    </div>
  );
}

function TenantModal({ row, uploading, onClose, onSave, nextSerial }) {
  const { useState } = React;
  const [formData, setFormData] = useState(row || {
    'Serial Number': nextSerial, 'Tenant Name': '', 'Owner Name': '',
    Tower: '', Flat: '', Mobile: '', Aadhar: '',
    'Residing Since': '', 'Police Verification': 'No', Attachments: ''
  });
  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold">{row ? 'Edit' : 'Add'} Tenant</h3>
        </div>
        <div className="p-6 space-y-4">
          {!row && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">Auto Serial Number: <span className="font-bold">#{nextSerial}</span></p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tenant Name *</label>
              <input type="text" value={formData['Tenant Name']} onChange={e => set('Tenant Name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name *</label>
              <input type="text" value={formData['Owner Name']} onChange={e => set('Owner Name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tower *</label>
              <select value={formData.Tower} onChange={e => set('Tower', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                <option value="">Select Tower</option>
                {TOWERS.map(t => <option key={t} value={t}>Tower {t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Flat *</label>
              <select value={formData.Flat} onChange={e => set('Flat', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" required disabled={!formData.Tower}>
                <option value="">Select Flat</option>
                {formData.Tower && generateFlatNumbers(formData.Tower).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobile *</label>
              <input type="tel" value={formData.Mobile} onChange={e => set('Mobile', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" maxLength="10" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Aadhar Number</label>
              <input type="text" value={formData.Aadhar} onChange={e => set('Aadhar', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" maxLength="12" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Residing Since *</label>
              <input type="date" value={formData['Residing Since']} onChange={e => set('Residing Since', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Police Verification</label>
              <select value={formData['Police Verification']} onChange={e => set('Police Verification', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option>No</option><option>Yes</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Attachments (Aadhar / Police Verification)</label>
              <input type="file" accept="image/*,application/pdf"
                onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = () => set('Attachments', r.result); r.readAsDataURL(f); }}}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              {formData.Attachments && (
                formData.Attachments.startsWith('data:image') || formData.Attachments.match(/\.(jpg|jpeg|png|gif)$/i)
                  ? <img src={formData.Attachments} alt="Preview" className="mt-3 max-w-xs h-auto rounded-lg border" />
                  : <p className="text-sm text-gray-600 mt-2">📎 File attached</p>
              )}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} disabled={uploading} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button onClick={() => onSave(formData)}
            disabled={uploading || !formData['Tenant Name'] || !formData['Owner Name'] || !formData.Tower || !formData.Flat || !formData.Mobile || !formData['Residing Since']}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2">
            {uploading && <div className="spinner" style={{width:'16px',height:'16px',borderWidth:'2px'}} />}
            {uploading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
