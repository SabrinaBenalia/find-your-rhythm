import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useEntries } from '../hooks/useEntries';
import { getSettings, getCurrentFast, startCurrentFast, clearCurrentFast, localDateStr, localDateTimeStr, saveEntry } from '../utils/storage';
import { sendCycleEndEmail } from '../utils/cycleEmail';
import { getCosmosForDate, getMoonEmoji, getMoonPhaseEvent, isEclipse, getSolarEvent, getMoonIllumination, getMoonPhase } from '../utils/cosmos';
import { autoBackup } from '../utils/drive';
import { exportJSON, exportCSV } from '../utils/storage';
import { detectCyclePhase, getCyclePhaseName } from '../utils/cycle';
import SliderField from '../components/SliderField';
import TagPill from '../components/TagPill';
import { Check, Plus } from 'lucide-react';

const MUCUS_LEVEL_OPTIONS = ['', 'dry', 'humid', 'normal', 'abundant'];
const MUCUS_TYPE_OPTIONS = ['', 'sticky', 'creamy', 'transparent', 'stringy (egg white)', 'lumpy'];
const CERVIX_OPTIONS = ['', 'low / closed / tonic (nose tip)', 'high / open / soft', 'very low / very closed / very hard'];
const POOP_COLOUR_OPTIONS = ['', 'light', 'normal', 'dark'];
const POOP_SIZE_OPTIONS = ['', 'small', 'pebble', 'medium', 'large', 'extra large'];
const POOP_DENSITY_OPTIONS = ['', 'diarrhea', 'soft', 'normal', 'dense', 'rock'];
const FLOW_LABELS = ['none', 'light', 'medium', 'heavy', 'very heavy'];
const INTENSITY_LABELS = ['none', 'mild', 'moderate', 'strong', 'intense'];
const BREAST_SIZE_LABELS = ['small / saggy', 'normal', 'noticeably fuller', 'large / plump'];
const NIPPLE_LABELS = ['shrivelled', 'normal', 'slightly swollen', 'swollen'];
const MOOD_LABELS = ['–', 'low', 'okay', 'good', 'great'];
const SLEEP_LABELS = ['poor', 'okay', 'normal', 'good', 'great'];
const MOOD_10_LABELS = ['devastated', 'miserable', 'low', 'down', 'neutral', 'okay', 'good', 'great', 'joyful', 'euphoric'];
const LIBIDO_LABELS = ['none', 'low', 'mild', 'moderate', 'high'];
const CREATIVITY_LABELS = ['blocked', 'scattered', 'flowing', 'inspired', 'electric'];

function today() {
  return localDateStr();
}

export default function Today() {
  const location = useLocation();
  const { entries, save, remove, getOrCreate } = useEntries();
  const [dateStr, setDateStr] = useState(() => location.state?.date || today());
  const [entry, setEntry] = useState(null);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(false);
  const [customTagInput, setCustomTagInput] = useState({ symptoms: '', herbs: '', activities: '' });
  const [currentFast, setCurrentFast] = useState(() => getCurrentFast());
  const [fastStartInput, setFastStartInput] = useState(() => localDateTimeStr());
  const [now, setNow] = useState(() => new Date());
  const settings = getSettings();

  useEffect(() => {
    if (!currentFast) return;
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, [currentFast]);

  useEffect(() => {
    if (location.state?.date) setDateStr(location.state.date);
  }, [location.state]);

  useEffect(() => {
    setEntry(getOrCreate(dateStr));
    setSaved(false);
  }, [dateStr, entries]);

  if (!entry) return null;

  const cosmos = entry.cosmos;
  const phase = detectCyclePhase(dateStr, entries);
  const moonEmoji = getMoonEmoji(cosmos.moonPhase);
  const moonEvent = getMoonPhaseEvent(dateStr);
  const eclipse = isEclipse(dateStr);
  const solarEvent = getSolarEvent(dateStr);

  const prevDay = (() => {
    const d = new Date(dateStr + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().split('T')[0];
  })();
  const isFirstPeriodDay = entry.period.active && !entries[prevDay]?.period?.active;

  function update(path, value) {
    const parts = path.split('.');
    setEntry(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  }

  function handleStartFast() {
    startCurrentFast(fastStartInput);
    setCurrentFast({ startedAt: fastStartInput });
    update('fasting.active', true);
    update('fasting.startTime', fastStartInput.slice(11, 16));
  }

  function handleBreakFast() {
    const endTime = new Date().toTimeString().slice(0, 5);
    const startDateStr = localDateStr(new Date(currentFast.startedAt));
    const endDateStr = today();

    // Retroactively mark every day between fast start and end as fasting.
    // Use saveEntry directly (not the hook's save) to avoid triggering a
    // React re-render that would reset the current entry's unsaved state.
    let d = new Date(startDateStr + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + 1); // start day already marked when fast began
    const endD = new Date(endDateStr + 'T12:00:00Z');
    while (d < endD) {
      const ds = d.toISOString().split('T')[0];
      const existing = entries[ds] || getOrCreate(ds);
      saveEntry({ ...existing, fasting: { ...existing.fasting, active: true } });
      d.setUTCDate(d.getUTCDate() + 1);
    }

    clearCurrentFast();
    setCurrentFast(null);
    update('fasting.active', true);
    update('fasting.endTime', endTime);
  }

  function getFastDuration() {
    if (!currentFast) return null;
    const start = new Date(currentFast.startedAt);
    const diffMs = now - start;
    if (diffMs < 0) return '0h 0m';
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }

  function toggleTag(category, tag) {
    setEntry(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const arr = next.tags[category];
      const idx = arr.indexOf(tag);
      if (idx === -1) arr.push(tag);
      else arr.splice(idx, 1);
      return next;
    });
  }

  function addCustomTag(category) {
    const val = customTagInput[category].trim().toLowerCase();
    if (!val) return;
    toggleTag(category, val);
    setCustomTagInput(p => ({ ...p, [category]: '' }));
  }

  function handleSave() {
    // If this is the first day of a new period, the previous cycle just ended — send email
    const isNewCycleStart = entry.period.active && !entries[prevDay]?.period?.active;
    if (isNewCycleStart) {
      const allPeriodDates = Object.values(entries)
        .filter(e => e.period?.active)
        .map(e => e.date)
        .sort();
      if (allPeriodDates.length > 0) {
        // Find the start of the previous cycle
        const prevCycleStarts = [];
        const sorted = [...allPeriodDates];
        if (sorted.length) prevCycleStarts.push(sorted[0]);
        for (let i = 1; i < sorted.length; i++) {
          const gap = (new Date(sorted[i] + 'T12:00:00Z') - new Date(sorted[i-1] + 'T12:00:00Z')) / 86400000;
          if (gap > 2) prevCycleStarts.push(sorted[i]);
        }
        const prevCycleStart = prevCycleStarts[prevCycleStarts.length - 1];
        if (prevCycleStart) {
          const userEmail = getSettings().email || '';
          sendCycleEndEmail(prevCycleStart, dateStr, entries, userEmail);
        }
      }
    }
    save(entry);
    setSaved(true);
    setToast(true);
    setTimeout(() => setSaved(false), 2000);
    setTimeout(() => setToast(false), 2000);
    autoBackup(exportJSON(), exportCSV());
  }

  const allSymptoms   = settings.tagLists?.symptoms   || [];
  const allHerbs      = settings.tagLists?.herbs      || [];
  const allActivities = settings.tagLists?.activities || [];

  function addPlantMedicine() {
    setEntry(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next.plantMedicine) next.plantMedicine = [];
      next.plantMedicine.push({ name: '', quantity: '' });
      return next;
    });
  }

  function updatePlantMedicine(index, field, value) {
    setEntry(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.plantMedicine[index][field] = value;
      return next;
    });
  }

  function removePlantMedicine(index) {
    setEntry(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.plantMedicine.splice(index, 1);
      return next;
    });
  }

  function addPoop() {
    setEntry(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next.poops) next.poops = [];
      next.poops.push({ colour: '', size: '', density: '' });
      return next;
    });
  }

  function updatePoop(index, field, value) {
    setEntry(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.poops[index][field] = value;
      return next;
    });
  }

  function removePoop(index) {
    setEntry(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.poops.splice(index, 1);
      return next;
    });
  }

  return (
    <div className="screen today-screen">
      {toast && <div className="save-toast">Entry saved ✓</div>}
      <header className="today-header">
        <div className="today-hero">
          <div className="moon-display">
            <span className="moon-big">{moonEmoji}</span>
            <div className="cosmos-info">
              <span className="moon-name">{cosmos.moonName} · {getMoonIllumination(getMoonPhase(dateStr))}%</span>
              <span className="season-tag">{cosmos.season} · {cosmos.daylightHours}h light</span>
              {moonEvent && (
                <span className="moon-event">{moonEvent.emoji} {moonEvent.name} · {moonEvent.time}</span>
              )}
              {eclipse && (
                <span className="moon-event eclipse">⚡ Eclipse</span>
              )}
              {solarEvent && (
                <span className="moon-event solar">{solarEvent.e} {solarEvent.n.includes('Equinox') ? 'Equinox' : 'Solstice'}</span>
              )}
            </div>
          </div>
          {phase && (
            <div className={`phase-badge phase-${phase}`}>
              {getCyclePhaseName(phase)}
            </div>
          )}
        </div>

        <div className="date-nav">
          <button onClick={() => {
            const d = new Date(dateStr + 'T12:00:00Z');
            d.setUTCDate(d.getUTCDate() - 1);
            setDateStr(d.toISOString().split('T')[0]);
          }}>‹</button>
          <input
            type="date"
            value={dateStr}
            max={today()}
            onChange={e => setDateStr(e.target.value)}
            className="date-input"
          />
          <button
            onClick={() => {
              const d = new Date(dateStr + 'T12:00:00Z');
              d.setUTCDate(d.getUTCDate() + 1);
              const next = d.toISOString().split('T')[0];
              if (next <= today()) setDateStr(next);
            }}
            disabled={dateStr >= today()}
          >›</button>
        </div>
      </header>

      <div className="form-sections">
        {/* Period section */}
        <section className="form-section">
          <h2 className="section-title">Period</h2>
          <div className="toggle-row">
            <span className="toggle-main-label">Flow Today</span>
            <label className="toggle">
              <input
                type="checkbox"
                checked={entry.period.active}
                onChange={e => update('period.active', e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
          {entry.period.active && (
            <>
              {isFirstPeriodDay && (
                <div className="time-field">
                  <label>Period Start
                    <span className="period-weekday">{new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })}</span>
                  </label>
                  <input
                    type="time"
                    value={entry.period.startTime || ''}
                    onChange={e => update('period.startTime', e.target.value)}
                    className="time-input"
                  />
                </div>
              )}
              <div className="time-field">
                <label className="time-label-soft">Period End</label>
                <input
                  type="time"
                  value={entry.period.endTime || ''}
                  onChange={e => update('period.endTime', e.target.value)}
                  className="time-input"
                />
              </div>
              <SliderField
                label="Flow" value={entry.period.flow}
                onChange={v => update('period.flow', v)}
                labels={FLOW_LABELS}
              />
              <SliderField
                label="Cramps" value={entry.period.cramps}
                onChange={v => update('period.cramps', v)}
                labels={INTENSITY_LABELS}
              />
            </>
          )}
        </section>

        {/* Fasting */}
        <section className="form-section">
          <h2 className="section-title">Fasting</h2>
          {currentFast ? (
            <>
              <div className="fast-active-display">
                <span className="fast-duration">{getFastDuration()}</span>
                <span className="fast-duration-sub">currently fasting</span>
              </div>
              <div className="fast-start-info">
                Started {new Date(currentFast.startedAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {currentFast.startedAt.slice(11, 16)}
              </div>
              <button type="button" className="fast-break-btn" onClick={handleBreakFast}>
                Break fast
              </button>
            </>
          ) : (
            <>
              <div className="select-row">
                <label>Started at</label>
                <input
                  type="datetime-local"
                  value={fastStartInput}
                  onChange={e => setFastStartInput(e.target.value)}
                  className="time-input-sm"
                  style={{ width: 'auto' }}
                />
              </div>
              <button type="button" className="fast-start-btn" onClick={handleStartFast}>
                Start fast
              </button>
            </>
          )}
        </section>

        {/* Body section */}
        <section className="form-section">
          <h2 className="section-title">Body</h2>
          <div className="temp-field">
            <label>BBT (°C)</label>
            <div className="reading-inputs">
              <input
                type="number"
                step="0.01"
                min="35"
                max="40"
                placeholder="36.50"
                value={entry.body.temp ?? ''}
                onChange={e => update('body.temp', e.target.value ? Number(e.target.value) : null)}
                className="temp-input"
              />
              <input
                type="time"
                value={entry.body.tempTime ?? ''}
                onChange={e => update('body.tempTime', e.target.value || null)}
                className="time-input-sm"
              />
            </div>
          </div>
          <div className="field-stack">
            <label>Cervical Mucus</label>
            <div className="mucus-selects">
              <div className="mucus-select-group">
                <span className="mucus-sublabel">Level</span>
                <select value={entry.body.cervicalMucusLevel} onChange={e => update('body.cervicalMucusLevel', e.target.value)}>
                  {MUCUS_LEVEL_OPTIONS.map(o => <option key={o} value={o}>{o || '—'}</option>)}
                </select>
              </div>
              <div className="mucus-select-group">
                <span className="mucus-sublabel">Type</span>
                <select value={entry.body.cervicalMucusType} onChange={e => update('body.cervicalMucusType', e.target.value)}>
                  {MUCUS_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o || '—'}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="field-stack">
            <label>Cervix Position</label>
            <select value={entry.body.cervixLevel} onChange={e => update('body.cervixLevel', e.target.value)}>
              {CERVIX_OPTIONS.map(o => <option key={o} value={o}>{o || '—'}</option>)}
            </select>
          </div>
          <div className="temp-field">
            <label>LH Reading</label>
            <div className="reading-inputs">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="—"
                value={entry.body.lhPeak ?? ''}
                onChange={e => update('body.lhPeak', e.target.value ? Number(e.target.value) : null)}
                className="temp-input"
              />
              <input
                type="time"
                value={entry.body.lhTime ?? ''}
                onChange={e => update('body.lhTime', e.target.value || null)}
                className="time-input-sm"
              />
            </div>
          </div>
          <SliderField label="Breast tenderness" value={entry.body.breastPain} onChange={v => update('body.breastPain', v)} labels={INTENSITY_LABELS} />
          <SliderField label="Breast size" value={entry.body.breastSize} onChange={v => update('body.breastSize', v)} labels={BREAST_SIZE_LABELS} />
          <SliderField label="Nipple change" value={entry.body.nippleChange} onChange={v => update('body.nippleChange', v)} labels={NIPPLE_LABELS} />
          <SliderField label="Libido" value={entry.body.libido} onChange={v => update('body.libido', v)} labels={LIBIDO_LABELS} min={1} max={5} />
          <SliderField label="Mood" value={entry.body.mood} onChange={v => update('body.mood', v)} labels={MOOD_10_LABELS} min={1} max={10} />
          <SliderField label="Creative energy" value={entry.body.creativeEnergy} onChange={v => update('body.creativeEnergy', v)} labels={CREATIVITY_LABELS} min={1} max={5} />
          <SliderField label="Sleep quality" value={entry.body.sleep} onChange={v => update('body.sleep', v)} labels={SLEEP_LABELS} min={1} max={5} />
        </section>

        <section className="form-section">
          <h2 className="section-title">Poop {(entry.poops?.length > 0) && <span className="poop-count">× {entry.poops.length}</span>}</h2>
          {(entry.poops || []).map((p, i) => (
            <div key={i} className="poop-entry">
              <div className="poop-entry-header">
                <span className="poop-entry-num">#{i + 1}</span>
                <button className="pm-remove-btn" type="button" onClick={() => removePoop(i)}>×</button>
              </div>
              <div className="poop-selects">
                <div className="poop-select-group">
                  <span className="mucus-sublabel">Colour</span>
                  <select value={p.colour} onChange={e => updatePoop(i, 'colour', e.target.value)}>
                    {POOP_COLOUR_OPTIONS.map(o => <option key={o} value={o}>{o || '—'}</option>)}
                  </select>
                </div>
                <div className="poop-select-group">
                  <span className="mucus-sublabel">Size</span>
                  <select value={p.size} onChange={e => updatePoop(i, 'size', e.target.value)}>
                    {POOP_SIZE_OPTIONS.map(o => <option key={o} value={o}>{o || '—'}</option>)}
                  </select>
                </div>
                <div className="poop-select-group">
                  <span className="mucus-sublabel">Density</span>
                  <select value={p.density} onChange={e => updatePoop(i, 'density', e.target.value)}>
                    {POOP_DENSITY_OPTIONS.map(o => <option key={o} value={o}>{o || '—'}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
          <button className="pm-add-btn" type="button" onClick={addPoop}>
            <Plus size={15} /> Log poop
          </button>
        </section>

        {/* Tags */}
        <section className="form-section">
          <h2 className="section-title">Symptoms</h2>
          {allSymptoms.length === 0
            ? <p className="empty-hint">Add symptoms in Settings → Manage Tags</p>
            : <select className="tag-dropdown" value="" onChange={e => { if (e.target.value) toggleTag('symptoms', e.target.value); }}>
                <option value="">Add symptom…</option>
                {allSymptoms.filter(t => !entry.tags.symptoms.includes(t)).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
          }
          {entry.tags.symptoms.length > 0 && (
            <div className="tag-grid">
              {entry.tags.symptoms.map(t => (
                <TagPill key={t} label={t} active onRemove={() => toggleTag('symptoms', t)} />
              ))}
            </div>
          )}
        </section>

        <section className="form-section">
          <h2 className="section-title">Herbs & Supplements</h2>
          {allHerbs.length === 0
            ? <p className="empty-hint">Add herbs in Settings → Manage Tags</p>
            : <select className="tag-dropdown" value="" onChange={e => { if (e.target.value) toggleTag('herbs', e.target.value); }}>
                <option value="">Add herb or supplement…</option>
                {allHerbs.filter(t => !entry.tags.herbs.includes(t)).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
          }
          {entry.tags.herbs.length > 0 && (
            <div className="tag-grid">
              {entry.tags.herbs.map(t => (
                <TagPill key={t} label={t} active onRemove={() => toggleTag('herbs', t)} />
              ))}
            </div>
          )}
        </section>

        <section className="form-section">
          <h2 className="section-title">Activities</h2>
          {allActivities.length === 0
            ? <p className="empty-hint">Add activities in Settings → Manage Tags</p>
            : <select className="tag-dropdown" value="" onChange={e => { if (e.target.value) toggleTag('activities', e.target.value); }}>
                <option value="">Add activity…</option>
                {allActivities.filter(t => !entry.tags.activities.includes(t)).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
          }
          {entry.tags.activities.length > 0 && (
            <div className="tag-grid">
              {entry.tags.activities.map(t => (
                <TagPill key={t} label={t} active onRemove={() => toggleTag('activities', t)} />
              ))}
            </div>
          )}
        </section>

        {/* Plant Medicine */}
        <section className="form-section">
          <h2 className="section-title">Plant Medicine</h2>
          {(entry.plantMedicine || []).map((pm, i) => (
            <div key={i} className="plant-medicine-row">
              <input
                className="pm-name-input"
                placeholder="Name (e.g. St. John's Wort)"
                value={pm.name}
                onChange={e => updatePlantMedicine(i, 'name', e.target.value)}
              />
              <input
                className="pm-qty-input"
                placeholder="Qty (e.g. 2 drops)"
                value={pm.quantity}
                onChange={e => updatePlantMedicine(i, 'quantity', e.target.value)}
              />
              <button className="pm-remove-btn" onClick={() => removePlantMedicine(i)} type="button">×</button>
            </div>
          ))}
          <button className="pm-add-btn" onClick={addPlantMedicine} type="button">
            <Plus size={15} /> Add plant medicine
          </button>
        </section>

        {/* Notes */}
        <section className="form-section">
          <h2 className="section-title">Notes</h2>
          <textarea
            className="notes-area"
            placeholder="How are you feeling today…"
            value={entry.notes}
            onChange={e => update('notes', e.target.value)}
            rows={4}
          />
        </section>
      </div>

      {entries[dateStr] && (
        <div style={{ padding: '0 16px 24px' }}>
          <button
            className="delete-entry-btn"
            onClick={() => {
              if (window.confirm('Delete this entry? This cannot be undone.')) {
                remove(dateStr);
                setEntry(getOrCreate(dateStr));
              }
            }}
          >
            Delete entry
          </button>
        </div>
      )}

      <div className="save-bar">
        <button className={`save-btn ${saved ? 'saved' : ''}`} onClick={handleSave}>
          {saved ? <><Check size={18} /> Saved</> : 'Save entry'}
        </button>
      </div>
    </div>
  );
}
