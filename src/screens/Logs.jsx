import { useState, useMemo } from 'react';
import { useEntries } from '../hooks/useEntries';
import { buildCyclesBySolarYear, getSolarYearLabel } from '../utils/solarYear';
import { getCyclePhaseName } from '../utils/cycle';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FLOW_LABEL   = ['', 'light', 'medium', 'heavy', 'very heavy'];
const MOOD_LABEL   = ['devastated', 'miserable', 'low', 'down', 'neutral', 'okay', 'good', 'great', 'joyful', 'euphoric'];
const ENERGY_LABEL = ['blocked', 'scattered', 'flowing', 'inspired', 'electric'];

function moodWord(val)   { return val != null ? MOOD_LABEL[Math.min(Math.round(val) - 1, 9)]   : null; }
function energyWord(val) { return val != null ? ENERGY_LABEL[Math.min(Math.round(val) - 1, 4)] : null; }

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Bar({ value, max = 4, color = 'var(--purple)' }) {
  if (value == null) return <span className="log-na">—</span>;
  return (
    <span className="log-bar-wrap">
      <span className="log-bar" style={{ width: `${(value / max) * 100}%`, background: color }} />
      <span className="log-bar-val">{value.toFixed(1)}</span>
    </span>
  );
}

function fmt12(timeStr) {
  if (!timeStr) return '—';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function CycleDetail({ cycle }) {
  return (
    <div className="cycle-detail">

      {/* Period timing block */}
      <div className="detail-block">
        <span className="detail-block-title">Period</span>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Start date</span>
            <span className="detail-value">{fmt(cycle.start)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Weekday</span>
            <span className="detail-value">{cycle.periodStartWeekday}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Start time</span>
            <span className="detail-value">{fmt12(cycle.periodStartTime)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">End time</span>
            <span className="detail-value">{fmt12(cycle.periodEndTime)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Length</span>
            <span className="detail-value">{cycle.periodLength ? `${cycle.periodLength} days` : '—'}</span>
          </div>
          {cycle.periodDurationHours && (
            <div className="detail-item">
              <span className="detail-label">Duration</span>
              <span className="detail-value">{cycle.periodDurationHours}h total</span>
            </div>
          )}
          <div className="detail-item">
            <span className="detail-label">Moon at start</span>
            <span className="detail-value">{cycle.moonEmojiAtStart} {cycle.moonAtStart} · {cycle.moonIlluminationAtStart}%</span>
          </div>
        </div>
      </div>

      {/* Cycle block */}
      <div className="detail-block">
        <span className="detail-block-title">Cycle</span>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Cycle length</span>
            <span className="detail-value">{cycle.cycleLength ? `${cycle.cycleLength} days` : cycle.ongoing ? 'ongoing' : '—'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">{cycle.summitDay ? '🏔️ Summit day' : 'Est. ovulation'}</span>
            <span className="detail-value">{fmt(cycle.summitDay || cycle.ovulationDay)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Days logged</span>
            <span className="detail-value">{cycle.loggedDays}</span>
          </div>
          {cycle.sexCount > 0 && (
            <div className="detail-item">
              <span className="detail-label">Sex</span>
              <span className="detail-value">{cycle.sexCount}×</span>
            </div>
          )}
        </div>
      </div>

      <div className="detail-block">
        <span className="detail-block-title">Averages</span>
        <div className="detail-metrics">
          <div className="metric-row">
            <span className="metric-label">Avg flow</span>
            <Bar value={cycle.avgFlow} max={4} color="var(--rose)" />
            {cycle.avgFlow != null && <span className="metric-word">{FLOW_LABEL[Math.round(cycle.avgFlow)]}</span>}
          </div>
          <div className="metric-row">
            <span className="metric-label">Avg mood</span>
            <Bar value={cycle.avgMood} max={10} color="var(--purple-mid)" />
            {cycle.avgMood != null && <span className="metric-word">{moodWord(cycle.avgMood)}</span>}
          </div>
          <div className="metric-row">
            <span className="metric-label">Avg energy</span>
            <Bar value={cycle.avgEnergy} max={5} color="var(--green)" />
            {cycle.avgEnergy != null && <span className="metric-word">{energyWord(cycle.avgEnergy)}</span>}
          </div>
        </div>
      </div>

      {cycle.notableSymptoms.length > 0 && (
        <div className="detail-symptoms">
          <span className="detail-label">Notable symptoms</span>
          <div className="sym-pills">
            {cycle.notableSymptoms.map(s => (
              <span key={s} className="sym-pill">{s}</span>
            ))}
          </div>
        </div>
      )}

      {cycle.fasts?.length > 0 && (
        <div className="detail-block">
          <span className="detail-block-title">Fasts</span>
          <div className="detail-grid">
            {cycle.fasts.map((f, i) => (
              <div key={i} className="detail-item" style={{ gridColumn: 'span 2' }}>
                <span className="detail-label">{fmt(f.startDate)}{f.startDate !== f.endDate ? ` → ${fmt(f.endDate)}` : ''}</span>
                <span className="detail-value">{f.durationStr} · {getCyclePhaseName(f.phase)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CycleRow({ cycle }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`cycle-row ${open ? 'open' : ''}`}>
      <button className="cycle-header" onClick={() => setOpen(o => !o)}>
        <div className="cycle-title">
          <span className="cycle-num">Cycle {cycle.cycleNum}</span>
          <span className="cycle-date">{fmt(cycle.start)}{cycle.next ? ` → ${fmt(cycle.next)}` : ' → now'}</span>
        </div>
        <div className="cycle-meta">
          {cycle.cycleLength && <span className="cycle-len">{cycle.cycleLength}d</span>}
          {cycle.ongoing && <span className="cycle-ongoing">ongoing</span>}
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>
      {open && <CycleDetail cycle={cycle} />}
    </div>
  );
}

function SolarYearSection({ year, cycles }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="solar-year-section">
      <button className="solar-year-header" onClick={() => setOpen(o => !o)}>
        <span className="solar-year-label">🌱 {getSolarYearLabel(year)}</span>
        <span className="solar-year-count">{cycles.length} cycle{cycles.length !== 1 ? 's' : ''} {open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="cycles-list">
          {cycles.map(c => <CycleRow key={c.start} cycle={c} />)}
        </div>
      )}
    </div>
  );
}

export default function Logs() {
  const { entries } = useEntries();

  const bySolarYear = useMemo(() => buildCyclesBySolarYear(entries), [entries]);
  const sortedYears = Object.keys(bySolarYear).map(Number).sort((a, b) => b - a);

  return (
    <div className="screen logs-screen">
      <header className="screen-header">
        <h2>Cycle Logs</h2>
        <p className="subtitle">Organized by solar year · starts Spring Equinox</p>
      </header>

      {sortedYears.length === 0 ? (
        <div className="empty-state">
          <p>No period data yet. Log your first period on the Today screen.</p>
        </div>
      ) : (
        <div className="logs-body">
          {sortedYears.map(y => (
            <SolarYearSection key={y} year={y} cycles={bySolarYear[y]} />
          ))}
        </div>
      )}
    </div>
  );
}
