import { getMoonPhase, getMoonName, getMoonEmoji, getMoonIllumination } from './cosmos';
import { findSummitDay, extractFasts } from './cycle';

// Solar year starts ~March 20 each year
export function getSolarYearForDate(dateStr) {
  const year = parseInt(dateStr.slice(0, 4));
  return dateStr.slice(5) >= '03-20' ? year : year - 1;
}

export function getSolarYearLabel(startYear) {
  return `Spring ${startYear} → ${startYear + 1}`;
}

export function getSolarYearStart(startYear) {
  return `${startYear}-03-20`;
}

export function getSolarYearEnd(startYear) {
  return `${startYear + 1}-03-19`;
}

// Build list of cycles grouped by solar year from all entries
export function buildCyclesBySolarYear(allEntries) {
  const entries = Object.values(allEntries).sort((a, b) => a.date.localeCompare(b.date));
  const periodDates = entries.filter(e => e.period?.active).map(e => e.date).sort();

  if (!periodDates.length) return {};

  // Find period starts
  const starts = [periodDates[0]];
  for (let i = 1; i < periodDates.length; i++) {
    const prev = new Date(periodDates[i - 1] + 'T12:00:00Z');
    const curr = new Date(periodDates[i] + 'T12:00:00Z');
    if ((curr - prev) / (1000 * 60 * 60 * 24) > 2) starts.push(periodDates[i]);
  }

  // Build cycle objects
  const cycles = starts.map((start, i) => {
    const next = starts[i + 1] || null;
    return computeCycleSummary(start, next, allEntries, i + 1);
  });

  // Group by solar year
  const bySolarYear = {};
  cycles.forEach(cycle => {
    const sy = getSolarYearForDate(cycle.start);
    if (!bySolarYear[sy]) bySolarYear[sy] = [];
    bySolarYear[sy].push(cycle);
  });

  // Re-number within each solar year
  Object.values(bySolarYear).forEach(yearCycles => {
    yearCycles.forEach((c, i) => { c.cycleNum = i + 1; });
  });

  return bySolarYear;
}

function computeCycleSummary(cycleStart, nextCycleStart, allEntries, globalNum) {
  const startMs = new Date(cycleStart + 'T12:00:00Z').getTime();
  const endMs = nextCycleStart
    ? new Date(nextCycleStart + 'T12:00:00Z').getTime()
    : Date.now();

  const cycleLength = nextCycleStart
    ? Math.round((new Date(nextCycleStart + 'T12:00:00Z') - new Date(cycleStart + 'T12:00:00Z')) / (1000 * 60 * 60 * 24))
    : null;

  const cycleDays = Object.values(allEntries).filter(e =>
    e.date >= cycleStart && (!nextCycleStart || e.date < nextCycleStart)
  ).sort((a, b) => a.date.localeCompare(b.date));

  // Period length: consecutive period-active days from cycle start
  const periodActive = cycleDays
    .filter(e => e.period?.active)
    .map(e => e.date)
    .sort();

  let periodLength = 0;
  let periodLastDay = null;
  if (periodActive.length) {
    let prev = new Date(periodActive[0] + 'T12:00:00Z');
    periodLength = 1;
    periodLastDay = periodActive[0];
    for (let i = 1; i < periodActive.length; i++) {
      const curr = new Date(periodActive[i] + 'T12:00:00Z');
      const gap = (curr - prev) / (1000 * 60 * 60 * 24);
      if (gap <= 1.5) { periodLength++; periodLastDay = periodActive[i]; prev = curr; }
      else break;
    }
  }

  // Period start details
  const firstPeriodEntry = allEntries[cycleStart];
  const periodStartTime = firstPeriodEntry?.period?.startTime || null;
  const periodStartWeekday = new Date(cycleStart + 'T12:00:00Z')
    .toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });

  // Period end time (from last period day entry)
  const lastPeriodEntry = periodLastDay ? allEntries[periodLastDay] : null;
  const periodEndTime = lastPeriodEntry?.period?.endTime || null;
  const periodEndDate = periodLastDay;

  // Total duration in hours (if both times known)
  let periodDurationHours = null;
  if (periodStartTime && periodEndTime && periodLastDay) {
    const [sh, sm] = periodStartTime.split(':').map(Number);
    const [eh, em] = periodEndTime.split(':').map(Number);
    const startMs = new Date(cycleStart + 'T12:00:00Z').getTime() - 12*3600*1000 + (sh*60+sm)*60*1000;
    const endMs   = new Date(periodLastDay + 'T12:00:00Z').getTime() - 12*3600*1000 + (eh*60+em)*60*1000;
    const diff = (endMs - startMs) / (1000 * 60 * 60);
    if (diff > 0) periodDurationHours = Math.round(diff * 10) / 10;
  }

  const flowVals = cycleDays.filter(e => e.period?.active && e.period?.flow > 0).map(e => e.period.flow);
  const moodVals = cycleDays.map(e => e.body?.mood).filter(v => v != null);
  const energyVals = cycleDays.map(e => e.body?.creativeEnergy).filter(v => v != null);
  const sexCount = cycleDays.reduce((sum, e) => sum + (e.sex ?? 0), 0);

  const avg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : null;

  // Notable symptoms: appear on ≥25% of logged days (min 2)
  const symCount = {};
  cycleDays.forEach(e => (e.tags?.symptoms || []).forEach(s => {
    symCount[s] = (symCount[s] || 0) + 1;
  }));
  const threshold = Math.max(2, cycleDays.length * 0.25);
  const notableSymptoms = Object.entries(symCount)
    .filter(([, c]) => c >= threshold)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);

  // Actual summit day from data, or predicted from defaults
  const summitDay = findSummitDay(cycleDays);
  const summitDayNum = summitDay
    ? Math.round((new Date(summitDay + 'T12:00:00Z') - new Date(cycleStart + 'T12:00:00Z')) / 86400000) + 1
    : null;
  const predictedSummitDay = !summitDay
    ? (() => {
        const d = new Date(cycleStart + 'T12:00:00Z');
        d.setUTCDate(d.getUTCDate() + 10); // day 11
        return d.toISOString().split('T')[0];
      })()
    : null;

  // Ovulation estimate (fallback when no summit detected)
  const ovulationDay = cycleLength
    ? (() => {
        const d = new Date(cycleStart + 'T12:00:00Z');
        d.setUTCDate(d.getUTCDate() + Math.floor(cycleLength / 2) - 1);
        return d.toISOString().split('T')[0];
      })()
    : null;

  // Moon at period start
  const moonPhase = getMoonPhase(cycleStart);
  const moonName = getMoonName(moonPhase);
  const moonEmoji = getMoonEmoji(moonPhase);
  const moonIllumination = getMoonIllumination(moonPhase);

  return {
    start: cycleStart,
    next: nextCycleStart,
    cycleNum: globalNum,
    cycleLength,
    periodLength,
    periodEndDate,
    periodStartTime,
    periodEndTime,
    periodDurationHours,
    periodStartWeekday,
    summitDay,
    summitDayNum,
    predictedSummitDay,
    ovulationDay,
    avgFlow: avg(flowVals),
    avgMood: avg(moodVals),
    avgEnergy: avg(energyVals),
    sexCount,
    notableSymptoms,
    fasts: extractFasts(cycleDays, allEntries),
    moonAtStart: moonName,
    moonEmojiAtStart: moonEmoji,
    moonPhaseAtStart: Math.round(moonPhase * 10) / 10,
    moonIlluminationAtStart: moonIllumination,
    loggedDays: cycleDays.length,
    ongoing: !nextCycleStart,
  };
}
