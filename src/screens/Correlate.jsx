import { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine, ReferenceArea
} from 'recharts';
import { useEntries } from '../hooks/useEntries';
import { getSettings } from '../utils/storage';
import {
  detectCyclePhase, getCyclePhaseName, getCyclePhaseColor,
  getCycleDay, findPeriodStarts, estimateCycleLength, getSummitDates
} from '../utils/cycle';
import { getMoonIllumination, getMoonPhase } from '../utils/cosmos';

const METRICS = [
  { key: 'body.mood',                 label: 'Mood',                   max: 10   },
  { key: 'body.sleep',                label: 'Sleep',                  max: 5    },
  { key: 'body.creativeEnergy',       label: 'Creative Energy',        max: 5    },
  { key: 'body.libido',               label: 'Libido',                 max: 5    },
  { key: 'body.breastPain',           label: 'Breast Tenderness',      max: 4    },
  { key: 'body.breastSize',           label: 'Breast Size',            max: 4    },
  { key: 'body.nippleChange',         label: 'Nipple Change',          max: 4    },
  { key: 'body.lhPeak',               label: 'LH Reading',             max: null },
  { key: 'body.temp',                 label: 'BBT (°C)',                max: null },
  { key: 'period.flow',               label: 'Flow',                   max: 4    },
  { key: 'period.cramps',             label: 'Cramps',                 max: 4    },
  { key: 'fasting.active',            label: 'Fasting',                max: 1    },
  { key: 'poops.length',              label: 'Poop count',             max: null },
  { key: 'poops.size',                label: 'Poop size',              max: 5    },
  { key: 'cosmos.moonIllumination',   label: 'Moon Illumination (%)',  max: 100  },
];

const ALL_TAG_CATS = ['symptoms', 'herbs', 'activities'];
const PHASE_ORDER  = ['menstrual', 'follicular', 'ovulation', 'luteal'];
const MOON_LABELS  = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

const TOOLTIP = { background: '#1e1333', border: '1px solid #4a2f9e', borderRadius: 8, color: '#f0e6ff' };

const POOP_SIZE_MAP = { small: 1, pebble: 2, medium: 3, large: 4, 'extra large': 5 };

function getVal(entry, key) {
  if (key === 'poops.length') return entry.poops?.length ?? null;
  if (key === 'fasting.active') return entry.fasting?.active ? 1 : null;
  if (key === 'cosmos.moonIllumination') {
    return getMoonIllumination(getMoonPhase(entry.date));
  }
  if (key === 'poops.size') {
    const vals = (entry.poops || []).map(p => POOP_SIZE_MAP[p.size]).filter(v => v != null);
    return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : null;
  }
  const v = key.split('.').reduce((o, k) => o?.[k], entry);
  return v != null && v !== '' ? Number(v) : null;
}
function avg(arr) {
  const vals = arr.filter(v => v != null);
  return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : null;
}

// ── Phase view ────────────────────────────────────────────────────────────────
function PhaseView({ allEntries, entries, metric, metricMeta, mode, tagCategory, selectedTag, setTagCategory, setSelectedTag, allTagsInCat, tagSearch, setTagSearch }) {
  const yDomain = metricMeta.max ? [0, metricMeta.max] : ['auto', 'auto'];

  const phaseData = useMemo(() => PHASE_ORDER.map(phase => {
    const pe = allEntries.filter(e => detectCyclePhase(e.date, entries) === phase);
    if (mode === 'all') {
      return { phase: getCyclePhaseName(phase), value: avg(pe.map(e => getVal(e, metric))), color: getCyclePhaseColor(phase) };
    }
    const w  = pe.filter(e =>  (e.tags?.[tagCategory] || []).includes(selectedTag));
    const wo = pe.filter(e => !(e.tags?.[tagCategory] || []).includes(selectedTag));
    return { phase: getCyclePhaseName(phase), [`with ${selectedTag}`]: avg(w.map(e => getVal(e, metric))), without: avg(wo.map(e => getVal(e, metric))), color: getCyclePhaseColor(phase) };
  }), [allEntries, metric, mode, tagCategory, selectedTag, entries]);

  const moonData = useMemo(() => {
    const bins = MOON_LABELS.map(label => ({ label, all: [], with: [], without: [] }));
    allEntries.forEach(e => {
      const bin = Math.min(Math.floor((e.cosmos?.moonPhase ?? 0) * 8), 7);
      const val = getVal(e, metric);
      if (val == null) return;
      bins[bin].all.push(val);
      if (mode === 'tag' && selectedTag) {
        if ((e.tags?.[tagCategory] || []).includes(selectedTag)) bins[bin].with.push(val);
        else bins[bin].without.push(val);
      }
    });
    return bins.map(b => ({
      label: b.label,
      ...(mode === 'all' ? { value: avg(b.all) } : { [`with ${selectedTag}`]: avg(b.with), without: avg(b.without) }),
    }));
  }, [allEntries, metric, mode, tagCategory, selectedTag]);

  return (
    <>
      {mode === 'tag' && (
        <div style={{ padding: '0 16px 12px' }}>
          <div className="control-row" style={{ marginBottom: 8 }}>
            <label>Category</label>
            <div className="seg-control">
              {ALL_TAG_CATS.map(c => (
                <button key={c} className={tagCategory === c ? 'active' : ''}
                  onClick={() => { setTagCategory(c); setSelectedTag(''); setTagSearch(''); }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <input
            className="tag-search-input"
            placeholder={`Search ${tagCategory}…`}
            value={tagSearch}
            onChange={e => setTagSearch(e.target.value)}
          />
          <div className="tag-scroll">
            {allTagsInCat.filter(t => t.includes(tagSearch.toLowerCase())).map(t => (
              <button key={t} className={`tag-pill ${selectedTag === t ? 'active' : ''}`} onClick={() => setSelectedTag(t)}>{t}</button>
            ))}
            {allTagsInCat.length === 0 && <span className="empty-hint">No {tagCategory} logged yet</span>}
          </div>
        </div>
      )}

      {mode === 'tag' && !selectedTag ? (
        <div className="empty-state"><p>Select a tag to see patterns.</p></div>
      ) : (
        <>
          <div className="chart-section">
            <h3>{metricMeta.label} by cycle phase</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={phaseData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,140,255,0.1)" />
                <XAxis dataKey="phase" tick={{ fill: '#a09cbf', fontSize: 11 }} />
                <YAxis tick={{ fill: '#a09cbf', fontSize: 10 }} domain={yDomain} />
                <Tooltip contentStyle={TOOLTIP} />
                {mode === 'all' ? (
                  <Bar dataKey="value" name={metricMeta.label} radius={[3,3,0,0]}>
                    {phaseData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                ) : (
                  <>
                    <Legend wrapperStyle={{ color: '#c5a8f0', fontSize: 12 }} />
                    <Bar dataKey={`with ${selectedTag}`} fill="#9b7ec8" opacity={0.9} radius={[3,3,0,0]} />
                    <Bar dataKey="without" fill="#3d2680" opacity={0.7} radius={[3,3,0,0]} />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-section">
            <h3>{metricMeta.label} by moon phase</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={moonData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,140,255,0.1)" />
                <XAxis dataKey="label" tick={{ fill: '#a09cbf', fontSize: 14 }} />
                <YAxis tick={{ fill: '#a09cbf', fontSize: 10 }} domain={yDomain} />
                <Tooltip contentStyle={TOOLTIP} />
                {mode === 'all' ? (
                  <Bar dataKey="value" name={metricMeta.label} fill="#9b7ec8" radius={[3,3,0,0]} />
                ) : (
                  <>
                    <Legend wrapperStyle={{ color: '#c5a8f0', fontSize: 12 }} />
                    <Bar dataKey={`with ${selectedTag}`} fill="#e91e8c" opacity={0.8} radius={[3,3,0,0]} />
                    <Bar dataKey="without" fill="#5c4a7f" opacity={0.7} radius={[3,3,0,0]} />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </>
  );
}

// ── Cycle day view ────────────────────────────────────────────────────────────
function CycleDayView({ allEntries, entries, metric, metricMeta }) {
  const cycleLength = useMemo(() => {
    const periodDates = allEntries.filter(e => e.period?.active).map(e => e.date);
    return estimateCycleLength(findPeriodStarts(periodDates));
  }, [allEntries]);

  const data = useMemo(() => {
    const byDay = {};
    allEntries.forEach(e => {
      const day = getCycleDay(e.date, entries);
      if (!day || day < 1 || day > cycleLength) return;
      const val = getVal(e, metric);
      if (val == null) return;
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(val);
    });
    return Array.from({ length: cycleLength }, (_, i) => {
      const day = i + 1;
      return { day, value: avg(byDay[day] || []) };
    });
  }, [allEntries, entries, metric, cycleLength]);

  // Phase background regions
  const phaseRegions = useMemo(() => {
    const regions = [];
    let prev = null;
    data.forEach(({ day }) => {
      const fakeDate = '2026-01-' + String(day).padStart(2, '0');
      // Use a synthetic entry map to detect phase by cycle day
      const syntheticEntries = { '2026-01-01': { date: '2026-01-01', period: { active: true } } };
      const phase = day <= 4 ? 'menstrual' : day <= 13 ? 'follicular' : day <= 18 ? 'ovulation' : 'luteal';
      if (!prev || prev.phase !== phase) {
        if (prev) prev.x2 = day;
        prev = { phase, x1: day, x2: cycleLength + 1 };
        regions.push(prev);
      }
    });
    return regions;
  }, [data, cycleLength]);

  const yDomain = metricMeta.max ? [0, metricMeta.max] : ['auto', 'auto'];

  return (
    <div className="chart-section">
      <h3>{metricMeta.label} across cycle days</h3>
      <p className="chart-subtitle">Averaged across all logged cycles · day 1 = period start</p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,140,255,0.1)" />
          {phaseRegions.map((r, i) => (
            <ReferenceArea key={i} x1={r.x1} x2={r.x2}
              fill={getCyclePhaseColor(r.phase)} fillOpacity={0.12} />
          ))}
          <XAxis dataKey="day" tick={{ fill: '#a09cbf', fontSize: 10 }} label={{ value: 'Cycle day', position: 'insideBottom', offset: -2, fill: '#a09cbf', fontSize: 10 }} />
          <YAxis tick={{ fill: '#a09cbf', fontSize: 10 }} domain={yDomain} />
          <Tooltip contentStyle={TOOLTIP} formatter={(v) => [v, metricMeta.label]} labelFormatter={d => `Day ${d}`} />
          <Line type="monotone" dataKey="value" stroke="#9b7ec8" strokeWidth={2} dot={{ r: 3, fill: '#9b7ec8' }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
      <div className="phase-legend-row">
        {['menstrual','follicular','ovulation','luteal'].map(p => (
          <span key={p} className="phase-legend-chip" style={{ background: getCyclePhaseColor(p) + '33', borderColor: getCyclePhaseColor(p) }}>
            {getCyclePhaseName(p)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── BBT view ──────────────────────────────────────────────────────────────────
function BBTView({ allEntries, entries }) {
  const summitDates = useMemo(() => getSummitDates(entries), [entries]);

  // Build cycle list
  const cycles = useMemo(() => {
    const periodDates = allEntries.filter(e => e.period?.active).map(e => e.date);
    const starts = findPeriodStarts(periodDates);
    return starts.map((start, i) => ({
      start,
      end: starts[i + 1] || null,
      label: `Cycle ${i + 1} · ${start.slice(5)}${starts[i+1] ? ' → ' + starts[i+1].slice(5) : ' → now'}`,
    }));
  }, [allEntries]);

  const [selectedCycle, setSelectedCycle] = useState(0);

  const cycle = cycles[selectedCycle] || cycles[cycles.length - 1];

  const cycleEntries = useMemo(() => {
    if (!cycle) return allEntries;
    return allEntries.filter(e => e.date >= cycle.start && (!cycle.end || e.date < cycle.end));
  }, [allEntries, cycle]);

  const data = useMemo(() =>
    cycleEntries
      .filter(e => e.body?.temp)
      .map(e => ({ date: e.date.slice(5), fullDate: e.date, temp: e.body.temp, lh: e.body.lhPeak || null })),
    [cycleEntries]
  );

  // Summit dates for this cycle only
  const cycleSummits = useMemo(() => {
    const set = new Set();
    const summit = getSummitDates(Object.fromEntries(cycleEntries.map(e => [e.date, e])));
    summit.forEach(d => set.add(d));
    return set;
  }, [cycleEntries]);

  // Coverline: avg of pre-summit temps in this cycle + 0.2
  const coverline = useMemo(() => {
    const bbt = cycleEntries.filter(e => e.body?.temp).sort((a, b) => a.date.localeCompare(b.date));
    const summitDate = [...cycleSummits][0];
    const preSummit = summitDate ? bbt.filter(e => e.date < summitDate) : bbt;
    if (preSummit.length < 3) return null;
    // Use last 6 pre-summit temps as low phase
    const lowTemps = preSummit.slice(-6).map(e => e.body.temp);
    return +(avg(lowTemps) + 0.2).toFixed(2);
  }, [cycleEntries, cycleSummits]);

  const yMin = data.length ? Math.floor((Math.min(...data.map(d => d.temp)) - 0.1) * 10) / 10 : 36;
  const yMax = data.length ? Math.ceil((Math.max(...data.map(d => d.temp))  + 0.1) * 10) / 10 : 37.5;

  return (
    <>
      {/* Cycle selector */}
      {cycles.length > 0 && (
        <div className="control-row" style={{ padding: '0 16px 12px' }}>
          <label>Cycle</label>
          <select value={selectedCycle} onChange={e => setSelectedCycle(Number(e.target.value))}>
            {cycles.map((c, i) => <option key={i} value={i}>{c.label}</option>)}
          </select>
        </div>
      )}

      <div className="chart-section">
        <h3>Basal Body Temperature</h3>
        {coverline && <p className="chart-subtitle">Coverline {coverline}°C · gold line = summit day</p>}
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,140,255,0.1)" />
            <XAxis dataKey="date" tick={{ fill: '#a09cbf', fontSize: 9 }} interval={Math.max(0, Math.floor(data.length / 6))} />
            <YAxis tick={{ fill: '#a09cbf', fontSize: 10 }} domain={[yMin, yMax]} tickFormatter={v => v.toFixed(1)} />
            <Tooltip contentStyle={TOOLTIP} formatter={(v, n) => [`${v}°C`, 'BBT']} />
            {coverline && (
              <ReferenceLine y={coverline} stroke="#ff69b4" strokeDasharray="4 3" strokeWidth={1.5}
                label={{ value: `${coverline}°C`, fill: '#ff69b4', fontSize: 9, position: 'insideTopRight' }} />
            )}
            {[...cycleSummits].map(date => (
              <ReferenceLine key={date} x={date.slice(5)} stroke="#ffd700" strokeDasharray="3 3" strokeWidth={1.5} />
            ))}
            <Line type="monotone" dataKey="temp" stroke="#9b7ec8" strokeWidth={2} dot={{ r: 2.5, fill: '#9b7ec8' }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {data.some(d => d.lh) && (
        <div className="chart-section">
          <h3>LH Readings</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,140,255,0.1)" />
              <XAxis dataKey="date" tick={{ fill: '#a09cbf', fontSize: 9 }} interval={Math.max(0, Math.floor(data.length / 6))} />
              <YAxis tick={{ fill: '#a09cbf', fontSize: 10 }} />
              <Tooltip contentStyle={TOOLTIP} formatter={v => [`${v}`, 'LH']} />
              {[...cycleSummits].map(date => (
                <ReferenceLine key={date} x={date.slice(5)} stroke="#ffd700" strokeDasharray="3 3" strokeWidth={1.5} />
              ))}
              <Line type="monotone" dataKey="lh" stroke="#ff69b4" strokeWidth={2} dot={{ r: 2.5, fill: '#ff69b4' }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
}

// ── Period start moon view ────────────────────────────────────────────────────
function PeriodMoonView({ allEntries, entries }) {
  const data = useMemo(() => {
    const periodDates = allEntries.filter(e => e.period?.active).map(e => e.date);
    const starts = findPeriodStarts(periodDates);
    return starts.map((date, i) => {
      const entry = entries[date];
      const moonName = entry?.cosmos?.moonName ?? '';
      const illumination = getMoonIllumination(getMoonPhase(date));
      return { cycle: `C${i + 1}`, date, illumination, moonName };
    });
  }, [allEntries, entries]);

  if (data.length === 0) return (
    <div className="empty-state"><p>No period starts logged yet.</p></div>
  );

  const avgIllumination = Math.round(data.reduce((s, d) => s + d.illumination, 0) / data.length);

  return (
    <div className="chart-section">
      <h3>Moon at period start</h3>
      <p className="chart-subtitle">Illumination on day 1 of each period · 0% = New Moon · 100% = Full Moon</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,140,255,0.1)" />
          <XAxis dataKey="cycle" tick={{ fill: '#a09cbf', fontSize: 11 }} />
          <YAxis tick={{ fill: '#a09cbf', fontSize: 10 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
          <Tooltip
            contentStyle={TOOLTIP}
            formatter={(v, _n, props) => [`${v}% · ${props.payload.moonName}`, 'Illumination']}
            labelFormatter={(_l, payload) => payload[0]?.payload?.date ?? ''}
          />
          <ReferenceLine y={avgIllumination} stroke="#e91e8c" strokeDasharray="4 3" strokeWidth={1.5}
            label={{ value: `avg ${avgIllumination}%`, fill: '#e91e8c', fontSize: 9, position: 'insideTopRight' }} />
          <Bar dataKey="illumination" radius={[3, 3, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={`hsl(270, 55%, ${25 + d.illumination * 0.35}%)`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {data.length > 1 && (
        <p className="chart-subtitle" style={{ textAlign: 'center', marginTop: 8 }}>
          Average: {avgIllumination}% · {avgIllumination < 25 ? 'tends near New Moon 🌑' : avgIllumination > 75 ? 'tends near Full Moon 🌕' : 'mid-cycle moon 🌓'}
        </p>
      )}
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function Correlate() {
  const { entries } = useEntries();
  const [view, setView]   = useState('phase');   // 'phase' | 'cycleday' | 'bbt'
  const [mode, setMode]   = useState('all');      // 'all' | 'tag'
  const [metric, setMetric] = useState('body.creativeEnergy');
  const [tagCategory, setTagCategory] = useState('symptoms');
  const [selectedTag, setSelectedTag] = useState('');
  const [tagSearch, setTagSearch] = useState('');

  const allEntries = useMemo(() =>
    Object.values(entries).sort((a, b) => a.date.localeCompare(b.date)),
    [entries]
  );

  const allTagsInCat = useMemo(() => {
    const settings = getSettings();
    const set = new Set(settings.tagLists?.[tagCategory] || []);
    allEntries.forEach(e => (e.tags?.[tagCategory] || []).forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [allEntries, tagCategory]);

  const metricMeta = METRICS.find(m => m.key === metric) || METRICS[0];

  return (
    <div className="screen correlate-screen">
      <header className="screen-header">
        <h2>Patterns</h2>
      </header>

      {/* View tabs */}
      <div className="seg-control" style={{ margin: '0 16px 16px' }}>
        <button className={view === 'phase'    ? 'active' : ''} onClick={() => setView('phase')}>Phase</button>
        <button className={view === 'cycleday' ? 'active' : ''} onClick={() => setView('cycleday')}>Cycle day</button>
        <button className={view === 'bbt'      ? 'active' : ''} onClick={() => setView('bbt')}>BBT</button>
        <button className={view === 'moon'     ? 'active' : ''} onClick={() => setView('moon')}>Period moon</button>
      </div>

      {/* Metric + mode pickers — not shown on BBT or moon view */}
      {view !== 'bbt' && view !== 'moon' && (
        <div style={{ padding: '0 16px 12px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={metric} onChange={e => setMetric(e.target.value)}>
            {METRICS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
          {view === 'phase' && (
            <div className="seg-control" style={{ margin: 0 }}>
              <button className={mode === 'all' ? 'active' : ''} onClick={() => setMode('all')}>All days</button>
              <button className={mode === 'tag' ? 'active' : ''} onClick={() => setMode('tag')}>By tag</button>
            </div>
          )}
        </div>
      )}

      {allEntries.length === 0 ? (
        <div className="empty-state"><p>No data yet. Start logging on the Today screen.</p></div>
      ) : view === 'phase' ? (
        <PhaseView {...{ allEntries, entries, metric, metricMeta, mode, tagCategory, selectedTag, setTagCategory, setSelectedTag, allTagsInCat, tagSearch, setTagSearch }} />
      ) : view === 'cycleday' ? (
        <CycleDayView {...{ allEntries, entries, metric, metricMeta }} />
      ) : view === 'bbt' ? (
        <BBTView {...{ allEntries, entries }} />
      ) : (
        <PeriodMoonView {...{ allEntries, entries }} />
      )}
    </div>
  );
}
