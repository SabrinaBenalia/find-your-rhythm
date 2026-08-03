import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEntries } from '../hooks/useEntries';
import { getSettings, localDateStr } from '../utils/storage';
import { getCosmosForDate, getMoonPhaseEvent, isEclipse, getSolarEvent } from '../utils/cosmos';
import { detectCyclePhase, getCyclePhaseColor, findPeriodStarts, estimateCycleLength, getEstimatedOvulation, getSummitDates } from '../utils/cycle';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function getMoonEvent(dateStr) {
  if (isEclipse(dateStr)) return { emoji: '⚡', label: 'Eclipse' };
  const event = getMoonPhaseEvent(dateStr);
  if (event) return { emoji: event.emoji, label: event.name };
  return null;
}

function formatMonth(year, month) {
  return new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}

export default function Calendar() {
  const { entries } = useEntries();
  const navigate = useNavigate();
  const settings = getSettings();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay(); // 0=Sun
  const daysInMonth = lastDay.getDate();

  // Ovulation estimate
  const periodDates = Object.values(entries).filter(e => e.period?.active).map(e => e.date).sort();
  const starts = findPeriodStarts(periodDates);
  const cycleLength = estimateCycleLength(starts);
  const ovulationDate = getEstimatedOvulation(starts, entries);
  const summitDates = getSummitDates(entries);
  const nextPeriodDate = (() => {
    if (!starts.length) return null;
    const lastStart = starts[starts.length - 1];
    const d = new Date(lastStart + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + cycleLength);
    return d.toISOString().split('T')[0];
  })();

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  function dateStr(day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const today = localDateStr();

  const cells = [];
  // Empty cells before first day
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="screen calendar-screen">
      <header className="cal-header">
        <button onClick={prevMonth} className="icon-btn"><ChevronLeft size={22} /></button>
        <h2>{formatMonth(year, month)}</h2>
        <button onClick={nextMonth} className="icon-btn"><ChevronRight size={22} /></button>
      </header>

      <div className="cal-legend">
        {['menstrual', 'follicular', 'ovulation', 'luteal'].map(p => (
          <span key={p} className="legend-item">
            <span className="legend-dot" style={{ background: getCyclePhaseColor(p) }} />
            {p}
          </span>
        ))}
      </div>

      <div className="cal-dow">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <span key={d}>{d}</span>)}
      </div>

      <div className="cal-grid">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="cal-cell empty" />;
          const ds = dateStr(day);
          const entry = entries[ds];
          const phase = detectCyclePhase(ds, entries);
          const cosmos = getCosmosForDate(ds, settings.hemisphere, settings.latitude);
          const isSummitDay = summitDates.has(ds);
          const isOvDay = ds === ovulationDate && !isSummitDay;
          const isNextPeriod = ds === nextPeriodDate;
          const isToday = ds === today;
          const hasPeriod = entry?.period?.active;
          const hasPlantMedicine = entry?.plantMedicine?.length > 0;
          const hasFasting = entry?.fasting?.active;
          const moonEvent = getMoonEvent(ds);
          const solarEvent = getSolarEvent(ds);

          return (
            <button
              key={ds}
              className={`cal-cell ${isToday ? 'today' : ''} ${hasPeriod ? 'has-period' : ''} ${isOvDay ? 'ovulation-day' : ''} ${solarEvent ? 'solar-event-day' : ''}`}
              style={phase ? { '--phase-color': getCyclePhaseColor(phase) } : {}}
              onClick={() => navigate('/', { state: { date: ds } })}
            >
              <div className="cal-day-num">{day}</div>
              {phase && <div className="cal-phase-bar" style={{ background: getCyclePhaseColor(phase) }} />}
              {entry && <div className="cal-dot" />}
              <div className="cal-icons">
                {solarEvent && <span className="cal-solar" title={solarEvent.n}>{solarEvent.e}</span>}
                {moonEvent && !solarEvent && <span className="cal-moon" title={moonEvent.label}>{moonEvent.emoji}</span>}
                {hasPlantMedicine && <span className="cal-plant" title="Plant medicine">🌿</span>}
                {hasFasting && <span className="cal-plant" title="Fasting">🌀</span>}
              </div>
              {isSummitDay && <span className="summit-marker" title="Summit day">🏔️</span>}
              {isOvDay && <span className="ov-marker" title="Estimated ovulation">◎</span>}
              {isNextPeriod && <span className="next-period-dot" title="Estimated next period" />}
            </button>
          );
        })}
      </div>

      <div className="cal-footer">
        <div className="moon-legend">
          {[['🌑','New'],['🌓','First Qtr'],['🌕','Full'],['🌗','Last Qtr'],['⚡','Eclipse']].map(([e,l]) => (
            <span key={l} className="moon-legend-item">{e} {l}</span>
          ))}
        </div>
        <div className="moon-legend">
          {[['🌱','Equinox'],['☀️','Solstice'],['🍂','Equinox'],['❄️','Solstice']].map(([e,l],i) => (
            <span key={i} className="moon-legend-item">{e} {l}</span>
          ))}
        </div>
        <div className="moon-legend">
          <span className="moon-legend-item">🌿 Plant medicine</span>
          <span className="moon-legend-item">🌀 Fasting</span>
        </div>
        <div className="ov-info-row">
          {ovulationDate && <span className="ov-info">◎ Est. ovulation {ovulationDate}</span>}
          {cycleLength && <span className="ov-info">Avg cycle {cycleLength}d</span>}
        </div>
      </div>
    </div>
  );
}
