import { useState } from 'react';
import { CHANNELS } from '../data/defaults.js';

function newId() { return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function StaticCard({ ch }) {
  return (
    <div className="ch">
      <h3>{ch.name}<span className={`tag ${ch.kind}`}>{ch.tag}</span></h3>
      <p>{ch.note}</p>
    </div>
  );
}

function TrackCard({ ch, entries, onAdd, onEdit, onRemove }) {
  return (
    <div className="ch wide">
      <h3>{ch.name}<span className={`tag ${ch.kind}`}>{ch.tag}</span></h3>
      <p>{ch.note}</p>
      <div className="entries">
        {entries.length === 0 && <div className="entry-empty">Nothing tracked yet.</div>}
        {entries.map(e => (
          <div className="entry" key={e.id}>
            <div className="entry-body">
              <span className="entry-name">{e.name}</span>
              {e.description && <span className="entry-desc">{e.description}</span>}
            </div>
            <div className="entry-acts">
              <button className="iconbtn" onClick={() => onEdit(e)}>Edit</button>
              <button className="iconbtn del" onClick={() => onRemove(e.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>
      <button className="addlink" onClick={onAdd}><span className="plus">＋</span> Add</button>
    </div>
  );
}

function Group({ group, data, openForm, removeEntry }) {
  const trackItems = group.items.filter(i => i.track);
  const staticItems = group.items.filter(i => !i.track);
  return (
    <>
      <h2 className="sec">{group.heading}</h2>
      {trackItems.map(ch => (
        <TrackCard
          key={ch.name}
          ch={ch}
          entries={(data.social && data.social[ch.track]) || []}
          onAdd={() => openForm(ch.track, null)}
          onEdit={(e) => openForm(ch.track, e)}
          onRemove={(id) => removeEntry(ch.track, id)}
        />
      ))}
      {staticItems.length > 0 && (
        <div className="grid">
          {staticItems.map(ch => <StaticCard ch={ch} key={ch.name} />)}
        </div>
      )}
    </>
  );
}

export default function SocialTab({ data, updateData }) {
  const [form, setForm] = useState(null); // {track, id?, name, description}

  const openForm = (track, entry) => setForm(entry ? { track, ...entry } : { track, name: '', description: '' });

  const save = () => {
    if (!form.name.trim()) return;
    const { track } = form;
    const clean = { id: form.id, name: form.name.trim(), description: (form.description || '').trim() };
    updateData(prev => {
      const social = { reddit: [], discord: [], ...(prev.social || {}) };
      const list = social[track] || [];
      social[track] = clean.id
        ? list.map(e => e.id === clean.id ? clean : e)
        : [...list, { ...clean, id: newId() }];
      return { ...prev, social };
    });
    setForm(null);
  };

  const removeEntry = (track, id) => {
    if (!confirm('Remove this entry?')) return;
    updateData(prev => {
      const social = { reddit: [], discord: [], ...(prev.social || {}) };
      social[track] = (social[track] || []).filter(e => e.id !== id);
      return { ...prev, social };
    });
  };

  const label = form && form.track === 'reddit' ? 'subreddit' : 'server';

  return (
    <>
      <p className="lead">Where to post stickers, art, and game-dev content. Under Reddit and Discord, track the specific subreddits and servers you want to post in.</p>

      <Group group={CHANNELS.feedback} data={data} openForm={openForm} removeEntry={removeEntry} />
      <Group group={CHANNELS.reach} data={data} openForm={openForm} removeEntry={removeEntry} />

      {form && (
        <div className="overlay on" onClick={e => { if (e.target.classList.contains('overlay')) setForm(null); }}>
          <div className="formcard" role="dialog" aria-modal="true">
            <h3>{form.id ? `Edit ${label}` : `Add ${label}`}</h3>
            <div className="fld"><label>Name</label>
              <input type="text" value={form.name} autoFocus
                placeholder={form.track === 'reddit' ? 'e.g. r/stickers' : 'e.g. Indie Artists Guild'}
                onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="fld"><label>Description</label>
              <textarea value={form.description} placeholder="Why it fits, rules, invite link…"
                onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="formacts">
              <span />
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="ghost" onClick={() => setForm(null)}>Cancel</button>
                <button className="primary" onClick={save}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
