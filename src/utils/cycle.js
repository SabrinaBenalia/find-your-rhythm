// Cycle phase detection — sympto-thermal method
// Returns: 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | null

export function detectCyclePhase(dateStr, allEntries) {
  const sorted = Object.values(allEntries)
    .filter(e => e.period?.active)
    .map(e => e.date)
    .sort();

  if (!sorted.length) return null;

  const periodStarts = findPeriodStarts(sorted);
  const relevantStart = [...periodStarts].filter(d => d <= dateStr).pop();
  if (!relevantStart) return null;

  const cycleIdx = periodStarts.indexOf(relevantStart);
  const nextStart = periodStarts[cycleIdx + 1] || null;

  // Menstrual = actual logged period days, or predicted days within avg period length
  if (allEntries[dateStr]?.period?.active) return 'menstrual';
  const avgPeriodLength = estimatePeriodLength(periodStarts, allEntries);
  const dayInCycleEarly = Math.round(
    (new Date(dateStr + 'T12:00:00Z') - new Date(relevantStart + 'T12:00:00Z')) / 86400000
  ) + 1;
  if (!nextStart && !allEntries[dateStr] && dayInCycleEarly <= avgPeriodLength) return 'menstrual';

  // Cut off predictions beyond the estimated cycle length
  const cycleLength = estimateCycleLength(periodStarts);
  const dayInCycle = Math.round(
    (new Date(dateStr + 'T12:00:00Z') - new Date(relevantStart + 'T12:00:00Z')) / 86400000
  ) + 1;
  if (dayInCycle > cycleLength && !allEntries[dateStr]) return null;

  // Get all entries for this cycle
  const cycleEntries = Object.values(allEntries)
    .filter(e => e.date >= relevantStart && (!nextStart || e.date < nextStart))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Try to find actual summit day from data
  let summitDate = findSummitDay(cycleEntries);

  // If no summit found yet, predict it
  if (!summitDate) {
    const avgDay = getAverageSummitDayInCycle(periodStarts, allEntries);
    const d = new Date(relevantStart + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + avgDay - 1);
    summitDate = d.toISOString().split('T')[0];
  }

  const dateMs   = new Date(dateStr   + 'T12:00:00Z').getTime();
  const summitMs = new Date(summitDate + 'T12:00:00Z').getTime();
  const daysFromSummit = Math.round((dateMs - summitMs) / 86400000);

  if (daysFromSummit >= -2 && daysFromSummit <= 2) return 'ovulation';
  if (daysFromSummit < -2) return 'follicular';
  return 'luteal';
}

// ── Summit day detection ──────────────────────────────────────────────────────

export function findSummitDay(cycleEntries) {
  const lhDate      = findLHPeakDate(cycleEntries);
  const bbtDate     = findBBTShiftDate(cycleEntries);
  const cervixDate  = findLastCervixOpenDate(cycleEntries);

  // Require at least one signal
  if (!lhDate && !bbtDate && !cervixDate) return null;

  // Use earliest of the available signals (they should cluster around the same day)
  const candidates = [lhDate, bbtDate, cervixDate].filter(Boolean).sort();
  return candidates[0];
}

function findLHPeakDate(entries) {
  const lhEntries = entries.filter(e => e.body?.lhPeak > 0);
  if (!lhEntries.length) return null;
  return lhEntries.reduce((a, b) => (a.body.lhPeak >= b.body.lhPeak ? a : b)).date;
}

function findBBTShiftDate(entries) {
  const bbt = entries.filter(e => e.body?.temp);
  if (bbt.length < 9) return null;

  for (let i = 6; i <= bbt.length - 3; i++) {
    const lowTemps = bbt.slice(i - 6, i).map(e => e.body.temp);
    const avgLow   = lowTemps.reduce((a, b) => a + b, 0) / 6;
    const coverline = avgLow + 0.2;

    const t1 = bbt[i]?.body?.temp;
    const t2 = bbt[i + 1]?.body?.temp;
    const t3 = bbt[i + 2]?.body?.temp;

    if (t1 && t2 && t3 && t1 >= coverline && t2 >= coverline && t3 >= coverline) {
      // Summit day is the day before the thermal shift begins
      return bbt[i - 1].date;
    }
  }
  return null;
}

function findLastCervixOpenDate(entries) {
  const open = entries.filter(e => e.body?.cervixLevel === 'high / open / soft');
  if (!open.length) return null;
  return open[open.length - 1].date;
}

// ── All actual summit dates across all cycles ─────────────────────────────────

export function getSummitDates(allEntries) {
  const sorted = Object.values(allEntries)
    .filter(e => e.period?.active)
    .map(e => e.date)
    .sort();
  if (!sorted.length) return new Set();

  const periodStarts = findPeriodStarts(sorted);
  const summitDates = new Set();

  for (let i = 0; i < periodStarts.length; i++) {
    const start = periodStarts[i];
    const next  = periodStarts[i + 1] || null;
    const cycleEntries = Object.values(allEntries)
      .filter(e => e.date >= start && (!next || e.date < next))
      .sort((a, b) => a.date.localeCompare(b.date));
    const summit = findSummitDay(cycleEntries);
    if (summit) summitDates.add(summit);
  }

  return summitDates;
}

// ── Average summit day across past cycles ─────────────────────────────────────

function getAverageSummitDayInCycle(periodStarts, allEntries) {
  const summitDays = [];

  for (let i = 0; i < periodStarts.length - 1; i++) {
    const start = periodStarts[i];
    const next  = periodStarts[i + 1];
    const cycleEntries = Object.values(allEntries)
      .filter(e => e.date >= start && e.date < next)
      .sort((a, b) => a.date.localeCompare(b.date));

    const summitDate = findSummitDay(cycleEntries);
    if (summitDate) {
      const dayInCycle = Math.round(
        (new Date(summitDate + 'T12:00:00Z') - new Date(start + 'T12:00:00Z')) / 86400000
      ) + 1;
      summitDays.push(dayInCycle);
    }
  }

  if (!summitDays.length) return 9; // default before any data
  return Math.round(summitDays.reduce((a, b) => a + b, 0) / summitDays.length);
}

// ── Period start detection ────────────────────────────────────────────────────

export function findPeriodStarts(sortedPeriodDates) {
  if (!sortedPeriodDates.length) return [];
  const starts = [sortedPeriodDates[0]];
  for (let i = 1; i < sortedPeriodDates.length; i++) {
    const prev = new Date(sortedPeriodDates[i - 1] + 'T12:00:00Z');
    const curr = new Date(sortedPeriodDates[i]     + 'T12:00:00Z');
    if ((curr - prev) / 86400000 > 2) starts.push(sortedPeriodDates[i]);
  }
  return starts;
}

// ── Period length ─────────────────────────────────────────────────────────────

export function estimatePeriodLength(periodStarts, allEntries) {
  const lengths = [];
  for (let i = 0; i < periodStarts.length - 1; i++) {
    const start = periodStarts[i];
    const next  = periodStarts[i + 1];
    const periodDays = Object.values(allEntries)
      .filter(e => e.date >= start && e.date < next && e.period?.active)
      .map(e => e.date)
      .sort();
    // Count consecutive days from cycle start
    let count = 0;
    for (let j = 0; j < periodDays.length; j++) {
      const gap = j === 0 ? 0 : Math.round(
        (new Date(periodDays[j] + 'T12:00:00Z') - new Date(periodDays[j-1] + 'T12:00:00Z')) / 86400000
      );
      if (gap <= 1) count++;
      else break;
    }
    if (count > 0) lengths.push(count);
  }
  if (!lengths.length) return 4; // default
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
}

// ── Cycle length ──────────────────────────────────────────────────────────────

export function estimateCycleLength(periodStarts) {
  if (periodStarts.length < 2) return 23; // default
  const lengths = [];
  for (let i = 1; i < periodStarts.length; i++) {
    const a = new Date(periodStarts[i - 1] + 'T12:00:00Z');
    const b = new Date(periodStarts[i]     + 'T12:00:00Z');
    lengths.push(Math.floor((b - a) / 86400000));
  }
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
}

// ── Estimated ovulation for calendar marker ───────────────────────────────────

export function getEstimatedOvulation(periodStarts, allEntries) {
  if (!periodStarts.length) return null;
  const lastStart = periodStarts[periodStarts.length - 1];
  const avgSummitDay = getAverageSummitDayInCycle(periodStarts, allEntries || {});
  const d = new Date(lastStart + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + avgSummitDay - 1);
  return d.toISOString().split('T')[0];
}

// ── Cycle day for a given date ────────────────────────────────────────────────

export function getCycleDay(dateStr, allEntries) {
  const sorted = Object.values(allEntries)
    .filter(e => e.period?.active)
    .map(e => e.date)
    .sort();
  if (!sorted.length) return null;
  const periodStarts = findPeriodStarts(sorted);
  const relevantStart = [...periodStarts].filter(d => d <= dateStr).pop();
  if (!relevantStart) return null;
  return Math.round(
    (new Date(dateStr + 'T12:00:00Z') - new Date(relevantStart + 'T12:00:00Z')) / 86400000
  ) + 1;
}

// ── Colors & names ────────────────────────────────────────────────────────────

export function getCyclePhaseColor(phase) {
  return {
    menstrual:  '#c0392b',
    follicular: '#7b5ea7',
    ovulation:  '#ff69b4',
    luteal:     '#7b2d8b',
  }[phase] || 'transparent';
}

export function getCyclePhaseName(phase) {
  return {
    menstrual:  'Menstrual',
    follicular: 'Follicular',
    ovulation:  'Ovulation',
    luteal:     'Luteal',
  }[phase] || 'Unknown';
}

// ── Fasts ─────────────────────────────────────────────────────────────────────

// Groups consecutive fasting days into individual fasts with duration + phase.
export function extractFasts(cycleDays, allEntries) {
  const fastingDates = cycleDays
    .filter(e => e.fasting?.active)
    .map(e => e.date)
    .sort();

  if (!fastingDates.length) return [];

  // Group into consecutive runs
  const groups = [[fastingDates[0]]];
  for (let i = 1; i < fastingDates.length; i++) {
    const prev = new Date(fastingDates[i - 1] + 'T12:00:00Z');
    const curr = new Date(fastingDates[i] + 'T12:00:00Z');
    if ((curr - prev) / 86400000 <= 1) {
      groups[groups.length - 1].push(fastingDates[i]);
    } else {
      groups.push([fastingDates[i]]);
    }
  }

  return groups.map(days => {
    const startDate = days[0];
    const endDate = days[days.length - 1];
    const startEntry = allEntries[startDate];
    const endEntry = allEntries[endDate];
    const startTime = startEntry?.fasting?.startTime;
    const endTime = endEntry?.fasting?.endTime;

    let durationHours = null;
    if (startTime && endTime) {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const startMs = new Date(startDate + 'T00:00:00Z').getTime() + (sh * 60 + sm) * 60000;
      const endMs   = new Date(endDate   + 'T00:00:00Z').getTime() + (eh * 60 + em) * 60000;
      durationHours = Math.round(((endMs - startMs) / 3600000) * 10) / 10;
    } else {
      durationHours = days.length * 24;
    }

    const wholeDays = Math.floor(durationHours / 24);
    const remainingHours = Math.round(durationHours % 24);
    const durationStr = durationHours >= 24
      ? `${wholeDays}d ${remainingHours}h (${Math.round(durationHours)}h total)`
      : `${Math.round(durationHours)}h`;

    const phase = detectCyclePhase(startDate, allEntries);

    return { startDate, endDate, durationHours, durationStr, phase };
  });
}

// ── Insights ──────────────────────────────────────────────────────────────────

export function generateInsights(allEntries) {
  const entries = Object.values(allEntries).sort((a, b) => a.date.localeCompare(b.date));
  if (entries.length < 14) return [];

  const insights = [];
  const periodDates = entries.filter(e => e.period?.active).map(e => e.date);
  const starts = findPeriodStarts(periodDates);
  const cycleLength = estimateCycleLength(starts);

  if (starts.length >= 2) {
    insights.push(`Your average cycle is ${cycleLength} days.`);
  }

  const entriesMap = Object.fromEntries(entries.map(x => [x.date, x]));

  const lutealEntries     = entries.filter(e => detectCyclePhase(e.date, entriesMap) === 'luteal');
  const follicularEntries = entries.filter(e => detectCyclePhase(e.date, entriesMap) === 'follicular');

  if (lutealEntries.length >= 3 && follicularEntries.length >= 3) {
    const avgLutealMood     = avg(lutealEntries.map(e     => e.body?.mood).filter(v => v > 0));
    const avgFollicularMood = avg(follicularEntries.map(e => e.body?.mood).filter(v => v > 0));
    if (avgLutealMood && avgFollicularMood && avgLutealMood < avgFollicularMood - 1) {
      insights.push(`Your mood tends to be lower during the luteal phase (${avgLutealMood.toFixed(1)}/10) vs follicular (${avgFollicularMood.toFixed(1)}/10).`);
    }

    const avgLutealEnergy     = avg(lutealEntries.map(e     => e.body?.creativeEnergy).filter(v => v > 0));
    const avgFollicularEnergy = avg(follicularEntries.map(e => e.body?.creativeEnergy).filter(v => v > 0));
    if (avgLutealEnergy && avgFollicularEnergy && avgLutealEnergy < avgFollicularEnergy - 0.5) {
      insights.push(`Creative energy peaks in the follicular phase (${avgFollicularEnergy.toFixed(1)}/5) and dips in luteal (${avgLutealEnergy.toFixed(1)}/5).`);
    }
  }

  const fullMoonEntries = entries.filter(e => e.cosmos?.moonPhase >= 0.48 && e.cosmos?.moonPhase <= 0.52);
  if (fullMoonEntries.length >= 2) {
    const avgSleep = avg(fullMoonEntries.map(e => e.body?.sleep).filter(v => v > 0));
    if (avgSleep && avgSleep < 3) {
      insights.push(`Your sleep tends to be disrupted around full moons (avg ${avgSleep.toFixed(1)}/5).`);
    }
  }

  const symMap = {};
  entries.forEach(e => (e.tags?.symptoms || []).forEach(s => {
    symMap[s] = (symMap[s] || 0) + 1;
  }));
  const topSym = Object.entries(symMap).sort((a, b) => b[1] - a[1]).slice(0, 2);
  if (topSym.length) {
    insights.push(`Your most frequent symptoms: ${topSym.map(([k, v]) => `${k} (${v}×)`).join(', ')}.`);
  }

  return insights;
}

function avg(arr) {
  if (!arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
