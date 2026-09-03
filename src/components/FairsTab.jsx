import { useState } from 'react';

const STATUSES = ['want to apply', 'applied', 'accepted', 'confirmed', 'passed'];
const STATUS_CLASS = {
  'want to apply': 'd-want',
  'applied': 'd-applied',
  'accepted': 'd-accept',
  'confirmed': 'd-accept',
  'passed': 'd-pass',
};

const BLANK_FAIR = { name: '', dates: '', location: '', type: '', booth: '', deadline: '', status: 'want to apply', notes: '' };
const BLANK_ORG = { name: '', description: '' };

function newId(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

export default function FairsTab({ data, updateData }) {
  const fairs = data.fairs || [];
  const organizers = data.organizers || [];
  const [fairForm, setFairForm] = useState(null);
  const [orgForm, setOrgForm] = useState(null);

  // --- organizers ---
  const saveOrg = () => {
    if (!orgForm.name.trim()) return;
    const clean = { ...orgForm, name: orgForm.name.trim(), description: orgForm.description.trim() };
    updateData(prev => {
      const list = prev.organizers || [];
      if (clean.id) return { ...prev, organizers: list.map(o => o.id === clean.id ? clean : o) };
      return { ...prev, organizers: [...list, { ...clean, id: newId('org-') }] };
    });
    setOrgForm(null);
  };
  const removeOrg = (id) => {
    if (!confirm('Delete this organizer?')) return;
    updateData(prev => ({ ...prev, organizers: (prev.organizers || []).filter(o => o.id !== id) }));
  };

  // --- fairs / events ---
  const saveFair = () => {
    if (!fairForm.name.trim()) return;
    const clean = { ...fairForm, name: fairForm.name.trim() };
    updateData(prev => {
      const list = prev.fairs || [];
      if (clean.id) return { ...prev, fairs: list.map(f => f.id === clean.id ? clean : f) };
      return { ...prev, fairs: [...list, { ...clean, id: newId('fair-') }] };
    });
    setFairForm(null);
  };
  const removeFair = (id) => {
    if (!confirm('Delete this event?')) return;
    updateData(prev => ({ ...prev, fairs: (prev.fairs || []).filter(f => f.id !== id) }));
  };

  return (
    <>
      <p className="lead">LA-area fairs, markets, and conventions to table at — plus the organizers whose rosters we keep tabs on for when they announce something.</p>

      {/* Organizers */}
      <div className="subhead">
        <h2 className="sec">Organizers</h2>
        <button className="addbtn" onClick={() => setOrgForm({ ...BLANK_ORG })}><span className="plus">＋</span> Add</button>
      </div>
      <p className="subnote">Collectives &amp; galleries with artist rosters — they may not have an event right now, but watch for announcements.</p>
      <div className="grid">
        {organizers.length === 0 && <div className="none">No organizers yet — hit + Add.</div>}
        {organizers.map(o => (
          <div className="ch orgcard" key={o.id}>
            <h3>{o.name}
              <span className="cardacts">
                <button className="iconbtn" onClick={() => setOrgForm({ ...o })}>Edit</button>
                <button className="iconbtn del" onClick={() => removeOrg(o.id)}>✕</button>
              </span>
            </h3>
            <p>{o.description || '—'}</p>
          </div>
        ))}
      </div>

      {/* Events */}
      <div className="subhead">
        <h2 className="sec">Events</h2>
        <button className="addbtn" onClick={() => setFairForm({ ...BLANK_FAIR })}><span className="plus">＋</span> Add</button>
      </div>
      <div className="legend">
        {STATUSES.map(s => (
          <span className="pill" key={s}><span className={`dot ${STATUS_CLASS[s]}`}></span>{s}</span>
        ))}
      </div>
      <div className="tablecard">
        <div className="tscroll">
          <table>
            <thead>
              <tr>
                <th>Event</th><th className="mono">Dates</th><th>Location</th><th>Type</th>
                <th className="mono">Booth</th><th className="mono">Deadline</th><th>Status</th><th>Notes</th><th></th>
              </tr>
            </thead>
            <tbody>
              {fairs.length === 0 && (
                <tr><td colSpan={9}><div className="empty">
                  <div className="big">No events logged yet</div>
                  Hit <b>+ Add</b> to log one — name it even without all the details.
                </div></td></tr>
              )}
              {fairs.map(f => (
                <tr key={f.id}>
                  <td><b>{f.name}</b></td>
                  <td className="mono">{f.dates || '—'}</td>
                  <td>{f.location || '—'}</td>
                  <td>{f.type || '—'}</td>
                  <td className="mono">{f.booth || '—'}</td>
                  <td className="mono">{f.deadline || '—'}</td>
                  <td><span className="spill"><span className={`dot ${STATUS_CLASS[f.status] || 'd-want'}`}></span>{f.status || 'want to apply'}</span></td>
                  <td>{f.notes || '—'}</td>
                  <td className="rowacts">
                    <button className="iconbtn" onClick={() => setFairForm({ ...f })}>Edit</button>
                    <button className="iconbtn del" onClick={() => removeFair(f.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Organizer modal */}
      {orgForm && (
        <div className="overlay on" onClick={e => { if (e.target.classList.contains('overlay')) setOrgForm(null); }}>
          <div className="formcard" role="dialog" aria-modal="true">
            <h3>{orgForm.id ? 'Edit organizer' : 'Add organizer'}</h3>
            <div className="fld"><label>Name</label>
              <input type="text" value={orgForm.name} autoFocus placeholder="e.g. Takumi Valley"
                onChange={e => setOrgForm({ ...orgForm, name: e.target.value })} /></div>
            <div className="fld"><label>Description</label>
              <textarea value={orgForm.description} placeholder="Who they are, where they're based, what they run…"
                onChange={e => setOrgForm({ ...orgForm, description: e.target.value })} /></div>
            <div className="formacts">
              {orgForm.id
                ? <button className="iconbtn del" onClick={() => { removeOrg(orgForm.id); setOrgForm(null); }}>Delete</button>
                : <span />}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="ghost" onClick={() => setOrgForm(null)}>Cancel</button>
                <button className="primary" onClick={saveOrg}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event modal */}
      {fairForm && (
        <div className="overlay on" onClick={e => { if (e.target.classList.contains('overlay')) setFairForm(null); }}>
          <div className="formcard" role="dialog" aria-modal="true">
            <h3>{fairForm.id ? 'Edit event' : 'Add event'}</h3>
            <div className="fld"><label>Name</label>
              <input type="text" value={fairForm.name} autoFocus placeholder="e.g. Raz Fest 2026"
                onChange={e => setFairForm({ ...fairForm, name: e.target.value })} /></div>
            <div className="row2">
              <div className="fld"><label>Dates</label>
                <input type="text" value={fairForm.dates} placeholder="Sep 19–20"
                  onChange={e => setFairForm({ ...fairForm, dates: e.target.value })} /></div>
              <div className="fld"><label>Booth cost</label>
                <input type="text" value={fairForm.booth} placeholder="$500"
                  onChange={e => setFairForm({ ...fairForm, booth: e.target.value })} /></div>
            </div>
            <div className="row2">
              <div className="fld"><label>Location</label>
                <input type="text" value={fairForm.location} placeholder="Gallery Nucleus"
                  onChange={e => setFairForm({ ...fairForm, location: e.target.value })} /></div>
              <div className="fld"><label>Type</label>
                <input type="text" value={fairForm.type} placeholder="Craft market / con"
                  onChange={e => setFairForm({ ...fairForm, type: e.target.value })} /></div>
            </div>
            <div className="row2">
              <div className="fld"><label>App deadline</label>
                <input type="text" value={fairForm.deadline} placeholder="Oct 15"
                  onChange={e => setFairForm({ ...fairForm, deadline: e.target.value })} /></div>
              <div className="fld"><label>Status</label>
                <select value={fairForm.status} onChange={e => setFairForm({ ...fairForm, status: e.target.value })}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select></div>
            </div>
            <div className="fld"><label>Notes</label>
              <textarea value={fairForm.notes} placeholder="Hours, organizer, anything worth remembering…"
                onChange={e => setFairForm({ ...fairForm, notes: e.target.value })} /></div>
            <div className="formacts">
              {fairForm.id
                ? <button className="iconbtn del" onClick={() => { removeFair(fairForm.id); setFairForm(null); }}>Delete</button>
                : <span />}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="ghost" onClick={() => setFairForm(null)}>Cancel</button>
                <button className="primary" onClick={saveFair}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
