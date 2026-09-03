import { useState } from 'react';

const COLORS = [
  { name: 'Pink', hex: '#E23E6D' }, { name: 'Teal', hex: '#0E9E86' }, { name: 'Amber', hex: '#D68A12' },
  { name: 'Blue', hex: '#2C6ED6' }, { name: 'Purple', hex: '#8B5CF6' }, { name: 'Green', hex: '#1B9E5A' },
  { name: 'Coral', hex: '#F26D5B' }, { name: 'Slate', hex: '#64748B' },
];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const LANE_TOP = 26, LANE_H = 21;

const pad = n => String(n).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
function parseISO(s) { const [y, m, d] = s.split('-').map(Number); const dt = new Date(y, m - 1, d); dt.setHours(0, 0, 0, 0); return dt; }
const dayDiff = (a, b) => Math.round((a - b) / 86400000);
function fmtRange(s, e) {
  const a = parseISO(s), b = parseISO(e), mo = x => MONTHS[x.getMonth()].slice(0, 3);
  if (s === e) return mo(a) + ' ' + a.getDate() + ', ' + a.getFullYear();
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) return mo(a) + ' ' + a.getDate() + '–' + b.getDate() + ', ' + a.getFullYear();
  if (a.getFullYear() === b.getFullYear()) return mo(a) + ' ' + a.getDate() + ' – ' + mo(b) + ' ' + b.getDate() + ', ' + a.getFullYear();
  return mo(a) + ' ' + a.getDate() + ', ' + a.getFullYear() + ' – ' + mo(b) + ' ' + b.getDate() + ', ' + b.getFullYear();
}
function newId(p) { return (p || 'e') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

export default function CalendarTab({ data, updateData }) {
  const events = data.events || [];
  const weekly = data.weekly || [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [viewY, setViewY] = useState(today.getFullYear());
  const [viewM, setViewM] = useState(today.getMonth());
  const [form, setForm] = useState(null);
  const [tip, setTip] = useState(null); // {ev, x, y}
  const [weeklyAdding, setWeeklyAdding] = useState(false);
  const [weeklyText, setWeeklyText] = useState('');

  const prevM = () => { let m = viewM - 1, y = viewY; if (m < 0) { m = 11; y--; } setViewM(m); setViewY(y); };
  const nextM = () => { let m = viewM + 1, y = viewY; if (m > 11) { m = 0; y++; } setViewM(m); setViewY(y); };
  const goToday = () => { setViewY(today.getFullYear()); setViewM(today.getMonth()); };

  const putEvent = (ev) => updateData(prev => {
    const list = prev.events || [];
    if (ev.id) return { ...prev, events: list.map(e => e.id === ev.id ? ev : e) };
    return { ...prev, events: [...list, { ...ev, id: newId('e') }] };
  });
  const removeEvent = (id) => updateData(prev => ({ ...prev, events: (prev.events || []).filter(e => e.id !== id) }));

  const addWeekly = () => {
    const n = weeklyText.trim();
    if (n) updateData(prev => ({ ...prev, weekly: [...(prev.weekly || []), { id: newId('w'), name: n }] }));
    setWeeklyText(''); setWeeklyAdding(false);
  };
  const removeWeekly = (id) => updateData(prev => ({ ...prev, weekly: (prev.weekly || []).filter(w => w.id !== id) }));

  const openAdd = (presetDate) => {
    const start = presetDate || iso(new Date(viewY, viewM, Math.min(today.getDate(), new Date(viewY, viewM + 1, 0).getDate())));
    setForm({ name: '', description: '', start, end: start, color: COLORS[0].hex });
  };
  const openEdit = (ev) => setForm({ ...ev });
  const closeForm = () => setForm(null);
  const saveForm = () => {
    if (!form.name.trim() || !form.start) return;
    let { start, end } = form; end = end || start;
    if (end < start) { const t = start; start = end; end = t; }
    putEvent({ ...form, name: form.name.trim(), description: (form.description || '').trim(), start, end });
    closeForm();
  };

  // Build weeks
  const firstWeekday = new Date(viewY, viewM, 1).getDay();
  const total = new Date(viewY, viewM + 1, 0).getDate();
  const nWeeks = Math.ceil((firstWeekday + total) / 7);
  const gridStart = new Date(viewY, viewM, 1 - firstWeekday); gridStart.setHours(0, 0, 0, 0);
  const evs = events.map(e => ({ ...e, s: parseISO(e.start), e2: parseISO(e.end) }));

  const weeks = [];
  for (let w = 0; w < nWeeks; w++) {
    const wkStart = new Date(gridStart); wkStart.setDate(gridStart.getDate() + w * 7);
    const wkEnd = new Date(wkStart); wkEnd.setDate(wkStart.getDate() + 6);
    const days = [];
    for (let d = 0; d < 7; d++) { const day = new Date(wkStart); day.setDate(wkStart.getDate() + d); days.push(day); }
    const inWeek = evs.filter(e => e.s <= wkEnd && e.e2 >= wkStart).sort((a, b) => a.s - b.s || b.e2 - a.e2);
    const lanes = []; const bars = []; let maxLane = -1;
    inWeek.forEach(e => {
      const c0 = Math.max(0, dayDiff(e.s, wkStart));
      const c1 = Math.min(6, dayDiff(e.e2, wkStart));
      let lane = 0;
      while (true) { const occ = lanes[lane] || (lanes[lane] = []); if (occ.every(seg => c1 < seg.c0 || c0 > seg.c1)) { occ.push({ c0, c1 }); break; } lane++; }
      maxLane = Math.max(maxLane, lane);
      bars.push({ e, c0, c1, lane, cl: e.s < wkStart, cr: e.e2 > wkEnd });
    });
    weeks.push({ days, bars, maxLane });
  }

  const monStart = new Date(viewY, viewM, 1), monEnd = new Date(viewY, viewM + 1, 0);
  monStart.setHours(0, 0, 0, 0); monEnd.setHours(0, 0, 0, 0);
  const monthList = events.filter(e => parseISO(e.start) <= monEnd && parseISO(e.end) >= monStart).sort((a, b) => a.start.localeCompare(b.start));
  const upcoming = events.filter(e => parseISO(e.end) >= monStart).sort((a, b) => a.start.localeCompare(b.start))[0];

  const tipStyle = tip ? { left: Math.min(tip.x + 14, (typeof window !== 'undefined' ? window.innerWidth : 1000) - 260) + 'px', top: (tip.y + 14) + 'px' } : {};

  return (
    <>
      <p className="lead">Block out art fairs, game jams, and challenges over their real dates. Click <b>+ Add event</b> or any day to drop one in. Hover a bar for details.</p>

      <div className="weekly">
        <b>Always-on weekly:</b>
        {weekly.map(w => (
          <span className="chip removable" key={w.id}>{w.name}
            <button className="chipx" onClick={() => removeWeekly(w.id)} aria-label={`Remove ${w.name}`}>×</button>
          </span>
        ))}
        {weeklyAdding ? (
          <input className="weeklyinput" autoFocus value={weeklyText} placeholder="e.g. #ScreenshotSaturday"
            onChange={e => setWeeklyText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addWeekly(); if (e.key === 'Escape') { setWeeklyText(''); setWeeklyAdding(false); } }}
            onBlur={addWeekly} />
        ) : (
          <button className="chip addchip" onClick={() => setWeeklyAdding(true)}><span className="plus">＋</span> Add</button>
        )}
        {weekly.length === 0 && !weeklyAdding && <span className="weekly-empty">add your recurring posts</span>}
      </div>

      <div className="calbar">
        <button className="navbtn" onClick={prevM} aria-label="Previous month">‹</button>
        <button className="navbtn" onClick={nextM} aria-label="Next month">›</button>
        <span className="caltitle">{MONTHS[viewM]} {viewY}</span>
        <button className="ghost" onClick={goToday}>Today</button>
        <span className="spacer" />
        <button className="addbtn" onClick={() => openAdd()}><span className="plus">＋</span> Add event</button>
      </div>

      <div className="calscroll">
        <div className="cal">
          <div className="weekhead"><div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div></div>
          {weeks.map((week, wi) => (
            <div className="week" key={wi} style={{ minHeight: Math.max(72, LANE_TOP + (week.maxLane + 1) * LANE_H + 8) + 'px' }}>
              {week.days.map((day, di) => {
                const other = day.getMonth() !== viewM;
                const isToday = day.getTime() === today.getTime();
                return (
                  <div className={'daycell' + (other ? ' other' : '') + (isToday ? ' today' : '')} key={di}
                    onClick={() => openAdd(iso(day))}>
                    <span className="dnum">{day.getDate()}</span>
                  </div>
                );
              })}
              {week.bars.map((b, bi) => (
                <div key={bi}
                  className={'bar' + (b.cl ? ' cl' : '') + (b.cr ? ' cr' : '')}
                  style={{
                    left: `calc(${b.c0 / 7 * 100}% + 3px)`,
                    width: `calc(${(b.c1 - b.c0 + 1) / 7 * 100}% - 6px)`,
                    top: (LANE_TOP + b.lane * LANE_H) + 'px',
                    background: b.e.color || '#64748B',
                  }}
                  onMouseEnter={ev => setTip({ ev: b.e, x: ev.clientX, y: ev.clientY })}
                  onMouseMove={ev => setTip(t => t ? { ...t, x: ev.clientX, y: ev.clientY } : t)}
                  onMouseLeave={() => setTip(null)}
                  onClick={ev => { ev.stopPropagation(); openEdit(b.e); }}>
                  {(b.cl ? '‹ ' : '') + b.e.name}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {tip && (
        <div className="caltip on" style={tipStyle}>
          <div className="tt"><span className="swdot" style={{ background: tip.ev.color || '#64748B' }}></span>{tip.ev.name}</div>
          <div className="td">{fmtRange(tip.ev.start, tip.ev.end)}</div>
          {tip.ev.description && <div className="tdesc">{tip.ev.description}</div>}
        </div>
      )}

      <details className="collap" open>
        <summary><span className="caret">▸</span> Events this month <span className="cnt">{monthList.length}</span></summary>
        <div className="elist">
          {monthList.length === 0 && (
            <div className="none">
              {upcoming
                ? <>Nothing in {MONTHS[viewM]}. Next up: <b>{upcoming.name}</b> — {fmtRange(upcoming.start, upcoming.end)}.</>
                : <>No events yet. Click <b>+ Add event</b> or any day to add one.</>}
            </div>
          )}
          {monthList.map(e => (
            <div className="erow" key={e.id}>
              <span className="swdot" style={{ background: e.color || '#64748B' }}></span>
              <div className="body">
                <div className="en">{e.name}</div>
                <div className="ed">{fmtRange(e.start, e.end)}</div>
                {e.description && <div className="edesc">{e.description}</div>}
              </div>
              <div className="acts">
                <button className="iconbtn" onClick={() => openEdit(e)}>Edit</button>
                <button className="iconbtn del" onClick={() => { if (confirm('Delete this event?')) removeEvent(e.id); }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </details>

      <div className="note"><b>Heads up:</b> game-jam dates shift every year — confirm the current year before you lock one in. The art challenges pre-loaded here are starter defaults; edit or delete any of them.</div>

      {form && (
        <div className="overlay on" onClick={e => { if (e.target.classList.contains('overlay')) closeForm(); }}>
          <div className="formcard" role="dialog" aria-modal="true">
            <h3>{form.id ? 'Edit event' : 'Add event'}</h3>
            <div className="fld"><label>Name</label>
              <input type="text" value={form.name} autoFocus placeholder="e.g. GMTK Game Jam"
                onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="fld"><label>Description</label>
              <textarea value={form.description} placeholder="What it is, why it matters, links…"
                onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="row2">
              <div className="fld"><label>Start date</label>
                <input type="date" value={form.start}
                  onChange={e => { const start = e.target.value; setForm(f => ({ ...f, start, end: (!f.end || f.end < start) ? start : f.end })); }} /></div>
              <div className="fld"><label>End date</label>
                <input type="date" value={form.end}
                  onChange={e => setForm({ ...form, end: e.target.value })} /></div>
            </div>
            <div className="fld"><label>Color</label>
              <div className="swatches">
                {COLORS.map(c => (
                  <button key={c.hex} type="button" className="swatch" title={c.name} aria-label={c.name}
                    aria-pressed={form.color === c.hex} style={{ background: c.hex }}
                    onClick={() => setForm({ ...form, color: c.hex })} />
                ))}
              </div></div>
            <div className="formacts">
              {form.id
                ? <button className="iconbtn del" onClick={() => { if (confirm('Delete this event?')) { removeEvent(form.id); closeForm(); } }}>Delete</button>
                : <span />}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="ghost" onClick={closeForm}>Cancel</button>
                <button className="primary" onClick={saveForm}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
