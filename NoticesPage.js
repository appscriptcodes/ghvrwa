/* ===================================================
   NoticesPage.js — Notices Page, View & Edit Modals
   Global Hillview Society Portal
   =================================================== */

function NoticesPage({ data, isAdmin, onRefresh }) {
  const { useState, useMemo } = React;

  const nextSerial = useMemo(() => {
    const ids = data.map(d => Number(d['Serial Number']) || 0);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }, [data]);

  const [search,       setSearch]       = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewRow,      setViewRow]      = useState(null);
  const [editRow,      setEditRow]      = useState(null);
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
            <h2 className="text-xl font-semibold text-gray-900">Notices ({filtered.length})</h2>
            <div className="flex items-center gap-3">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search..." className="px-4 py-2 border border-gray-300 rounded-lg" />
              <ExportButton data={filtered} filename="notices" />
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
                {['Date','Subject','Description','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{formatDateDisplay(row.Date)}</td>
                  <td className="px-4 py-3 text-sm font-medium">{row.Subject}</td>
                  <td className="px-4 py-3 text-sm"><span className="block max-w-xs truncate">{row.Description}</span></td>
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

      {viewRow && <NoticeViewModal row={viewRow} onClose={() => setViewRow(null)} />}

      {(showAddModal || editRow) && (
        <NoticeModal row={editRow} nextSerial={nextSerial} uploading={uploading}
          onClose={() => { setShowAddModal(false); setEditRow(null); }}
          onSave={async (formData) => {
            try {
              setUploading(true);
              await maybeUploadField(formData, 'Notices', 'Media', 'notice');
              if (editRow) await api.upsertRow('Notices', 'Serial Number', { ...editRow, ...formData });
              else         await api.createRow('Notices', formData);
              await onRefresh();
              setShowAddModal(false); setEditRow(null);
              showToast('Notice saved', 'success');
            } catch (e) { showToast('Failed: ' + String(e), 'error'); }
            finally     { setUploading(false); }
          }} />
      )}
    </div>
  );
}

function NoticeViewModal({ row, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold">Notice Details</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <p className="text-gray-900">{row.Date}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <p className="text-gray-900 font-medium">{row.Subject}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <p className="text-gray-900 whitespace-pre-wrap">{row.Description}</p>
          </div>
          {row.Media && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Attachment</label>
              {row.Media.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img src={row.Media} alt="Notice" className="max-w-full h-auto rounded-lg" />
              ) : (
                <a href={row.Media} target="_blank" rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Attachment
                </a>
              )}
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

function NoticeModal({ row, uploading, onClose, onSave, nextSerial }) {
  const { useState } = React;
  const [formData, setFormData] = useState(row || {
    'Serial Number': nextSerial,
    Date: new Date().toISOString().split('T')[0],
    Subject: '',
    Description: '',
    Media: ''
  });
  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold">{row ? 'Edit' : 'Add'} Notice</h3>
        </div>
        <div className="p-6 space-y-4">
          {!row && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">Auto Serial Number: <span className="font-bold">#{nextSerial}</span></p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input type="date" value={formData.Date} onChange={e => set('Date', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input type="text" value={formData.Subject} onChange={e => set('Subject', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea value={formData.Description} onChange={e => set('Description', e.target.value)}
              rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
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
