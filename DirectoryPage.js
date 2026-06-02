/* ===================================================
   DirectoryPage.js — Staff Directory Page & Modal
   Global Hillview Society Portal
   =================================================== */

function DirectoryPage({ data, isAdmin, onRefresh }) {
  const { useState, useMemo } = React;

  const nextSerial = useMemo(() => {
    const ids = data.map(d => Number(d['Serial']) || 0);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }, [data]);

  const [search,          setSearch]          = useState('');
  const [activeFilter,    setActiveFilter]    = useState('all');
  const [activeDeptFilter,setActiveDeptFilter]= useState(null);
  const [showAddModal,    setShowAddModal]    = useState(false);
  const [editRow,         setEditRow]         = useState(null);
  const [uploading,       setUploading]       = useState(false);

  const filtered = useMemo(() => {
    let result = data;
    if (activeDeptFilter) {
      result = result.filter(r => (r.Department || r.Designation || 'Other') === activeDeptFilter);
    }
    if (activeFilter === 'active')   result = result.filter(r => (r.Active || '').toLowerCase() === 'yes');
    if (activeFilter === 'inactive') result = result.filter(r => ['no','non-active'].includes((r.Active || '').toLowerCase()));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
    }
    return result;
  }, [data, search, activeFilter, activeDeptFilter]);

  const deptStats = useMemo(() => {
    const stats = {};
    data.forEach(r => {
      const dept = r.Department || r.Designation || 'Other';
      if (!stats[dept]) stats[dept] = 0;
      if ((r.Active || '').toLowerCase() === 'yes') stats[dept]++;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [data]);

  return (
    <div className="space-y-6 fade-in">
      {/* Status Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          {['all', 'active', 'inactive'].map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`filter-btn px-4 py-2 rounded-lg font-medium ${activeFilter === f ? 'active' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {f === 'all' ? `All (${data.length})` : f === 'active' ? 'Active' : 'Non-Active'}
            </button>
          ))}
        </div>
      </div>

      {/* Department Cards */}
      {deptStats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {deptStats.map(([dept, count]) => (
            <div key={dept} onClick={() => setActiveDeptFilter(activeDeptFilter === dept ? null : dept)}
              className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer transition-all ${activeDeptFilter === dept ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}>
              <p className="text-xs text-gray-600 truncate" title={dept}>{dept}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-semibold text-gray-900">Directory ({filtered.length})</h2>
            <div className="flex items-center gap-3">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search..." className="px-4 py-2 border border-gray-300 rounded-lg" />
              <ExportButton data={filtered} filename="directory" />
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
                {['Photo','Name','Department','Gender','Shift','Joined On','Manager','Active'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
                {isAdmin && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {row.Photo
                      ? <img src={driveDirectLink(row.Photo, 80)} alt="Photo"
                          className="w-10 h-10 rounded-full object-cover bg-gray-100" referrerPolicy="no-referrer"
                          onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex'; }} />
                      : null}
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs"
                      style={{ display: row.Photo ? 'none' : 'flex' }}>
                      {(row.Name || row['Employee Name'] || 'N')[0]}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{row.Name || row['Employee Name']}</td>
                  <td className="px-4 py-3 text-sm">{row.Department || row.Designation}</td>
                  <td className="px-4 py-3 text-sm">{row.Gender}</td>
                  <td className="px-4 py-3 text-sm">{row.Shift}</td>
                  <td className="px-4 py-3 text-sm">{formatDateDisplay(row['Joined On'])}</td>
                  <td className="px-4 py-3 text-sm">{row.Manager}</td>
                  <td className="px-4 py-3">
                    <span className={`status-badge ${(row.Active || '').toLowerCase() === 'yes' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {row.Active || 'No'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <button onClick={() => setEditRow(row)} className="text-blue-500 hover:text-blue-600 text-sm font-medium">Edit</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(showAddModal || editRow) && (
        <DirectoryModal row={editRow} nextSerial={nextSerial} uploading={uploading}
          onClose={() => { setShowAddModal(false); setEditRow(null); }}
          onSave={async (data) => {
            try {
              setUploading(true);
              await maybeUploadField(data, 'Directory', 'Photo', 'photo');
              if (editRow) await api.upsertRow('Directory', 'Serial', { ...editRow, ...data });
              else         await api.createRow('Directory', data);
              await onRefresh();
              setShowAddModal(false); setEditRow(null);
              showToast('Saved successfully', 'success');
            } catch (e) { showToast('Failed: ' + String(e), 'error'); }
            finally     { setUploading(false); }
          }} />
      )}
    </div>
  );
}

function DirectoryModal({ row, uploading, onClose, onSave, nextSerial }) {
  const { useState } = React;
  const [formData, setFormData] = useState(row || {
    Name: '', Department: '', Gender: '', Shift: '', 'Joined On': '', Manager: '', Active: 'Yes', Photo: ''
  });
  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  // Date conversion helpers for the date picker
  const toPickerValue = (val) => {
    if (!val) return '';
    if (typeof val === 'string' && val.match(/^\d{1,2}-[A-Za-z]{3}-\d{4}$/)) {
      const [d, mStr, y] = val.split('-');
      const months = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};
      return `${y}-${months[mStr] || '01'}-${d.padStart(2,'0')}`;
    }
    if (typeof val === 'string' && val.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const [d, m, y] = val.split('-'); return `${y}-${m}-${d}`;
    }
    try { return new Date(val).toISOString().split('T')[0]; } catch { return ''; }
  };

  const fromPickerValue = (val) => {
    if (!val) return '';
    const [y, m, d] = val.split('-');
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${d}-${monthNames[parseInt(m) - 1]}-${y}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold">{row ? 'Edit' : 'Add'} Employee</h3>
        </div>
        <div className="p-6 space-y-4">
          {!row && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">Auto Serial Number: <span className="font-bold">#{nextSerial}</span></p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input type="text" value={formData.Name || formData['Employee Name'] || ''} onChange={e => set('Name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <input type="text" value={formData.Department || formData.Designation || ''} onChange={e => set('Department', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <select value={formData.Gender || ''} onChange={e => set('Gender', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">Select</option>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shift</label>
              <select value={formData.Shift || ''} onChange={e => set('Shift', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">Select</option><option>Day</option><option>Night</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Joined On</label>
              <input type="date" value={toPickerValue(formData['Joined On'])}
                onChange={e => set('Joined On', fromPickerValue(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Manager</label>
              <input type="text" value={formData.Manager || ''} onChange={e => set('Manager', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            {row && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resigned On</label>
                <input type="date" value={formData['Resigned On'] || ''} onChange={e => set('Resigned On', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Active</label>
              <select value={formData.Active || 'Yes'} onChange={e => set('Active', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option>Yes</option><option>No</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
              <input type="file" accept="image/*"
                onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = () => set('Photo', r.result); r.readAsDataURL(f); }}}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              {formData.Photo && <img src={formData.Photo} alt="Preview" className="mt-2 w-20 h-20 rounded-lg object-cover" />}
            </div>
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
