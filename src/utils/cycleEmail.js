import emailjs from '@emailjs/browser';
import { getMoonIllumination } from './cosmos';
import { getSettings } from './storage';
import { extractFasts, getCyclePhaseName, findSummitDay, findLHPeakDate, findBBTShiftDate, findLastCervixOpenDate, DEFAULT_PHASES } from './cycle';

const INTENSITY_LABELS = ['none', 'mild', 'moderate', 'strong', 'intense'];

export async function sendCycleEndEmail(completedCycleStart, newCycleStart, allEntries, userEmail, cycleNum) {
  const cycle = buildEmailSummary(completedCycleStart, newCycleStart, allEntries);
  if (!cycle) return;

  const numLabel = cycleNum ? `Cycle ${cycleNum}` : 'Cycle';
  const subject = `${numLabel} complete — ${cycle.length} days`;
  const body = formatEmailBody(cycle);

  await sendEmail(userEmail, subject, body);
}

function fmt12(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`;
}

function fmtDate(dateStr) {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'
  });
}

function buildSummitInfo(entries, cycleStart, cycleLength) {
  const lhDate     = findLHPeakDate(entries);
  const bbtDate    = findBBTShiftDate(entries);
  const cervixDate = findLastCervixOpenDate(entries);
  const summitDate = findSummitDay(entries);

  if (summitDate) {
    const summitDay = Math.round(
      (new Date(summitDate + 'T12:00:00Z') - new Date(cycleStart + 'T12:00:00Z')) / 86400000
    ) + 1;
    const signals = [
      lhDate     && `LH peak (${fmtDate(lhDate)})`,
      bbtDate    && `BBT shift (${fmtDate(bbtDate)})`,
      cervixDate && `last cervix open (${fmtDate(cervixDate)})`,
    ].filter(Boolean);
    return {
      date: summitDate,
      day: summitDay,
      detected: true,
      calculation: `Detected from: ${signals.join(', ')} → earliest signal = day ${summitDay}`,
    };
  }

  // Default: start of ovulation window (day 11)
  const summitDay = DEFAULT_PHASES.ovulationStart;
  const d = new Date(cycleStart + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + summitDay - 1);
  const predictedDate = d.toISOString().split('T')[0];
  return {
    date: predictedDate,
    day: summitDay,
    detected: false,
    calculation: `No LH / BBT / cervix data logged → default ovulation window days ${DEFAULT_PHASES.ovulationStart}–${DEFAULT_PHASES.ovulationEnd}`,
  };
}

function buildEmailSummary(start, next, allEntries) {
  const entries = Object.values(allEntries).filter(
    e => e.date >= start && e.date < next
  ).sort((a, b) => a.date.localeCompare(b.date));

  if (!entries.length) return null;

  const periodDays  = entries.filter(e => e.period?.active);
  const moodVals    = entries.map(e => e.body?.mood).filter(v => v != null);
  const energyVals  = entries.map(e => e.body?.creativeEnergy).filter(v => v != null);
  const sleepVals   = entries.map(e => e.body?.sleep).filter(v => v != null);
  const libidoVals  = entries.map(e => e.body?.libido).filter(v => v != null);
  const crampVals   = periodDays.map(e => e.period?.cramps).filter(v => v != null);
  const avg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : null;

  const fastingDays = entries.filter(e => e.fasting?.active).length;
  const fasts       = extractFasts(entries, allEntries);
  const sexCount    = entries.reduce((sum, e) => sum + (e.sex ?? 0), 0);

  const symCount = {};
  entries.forEach(e => (e.tags?.symptoms || []).forEach(s => {
    symCount[s] = (symCount[s] || 0) + 1;
  }));
  const topSymptoms = Object.entries(symCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([s, c]) => `${s} (${c}d)`);

  const herbCount = {};
  entries.forEach(e => (e.tags?.herbs || []).forEach(h => {
    herbCount[h] = (herbCount[h] || 0) + 1;
  }));
  const herbList = Object.entries(herbCount)
    .sort((a, b) => b[1] - a[1])
    .map(([h, c]) => `${h} (${c}d)`);

  const pmCount = {};
  entries.forEach(e => (e.plantMedicine || []).forEach(pm => {
    if (!pm.name) return;
    const key = pm.name.toLowerCase();
    if (!pmCount[key]) pmCount[key] = { name: pm.name, days: 0 };
    pmCount[key].days += 1;
  }));
  const plantMedicines = Object.values(pmCount).sort((a, b) => b.days - a.days);

  const cycleLength = Math.round(
    (new Date(next + 'T12:00:00Z') - new Date(start + 'T12:00:00Z')) / (1000 * 60 * 60 * 24)
  );

  const periodStartEntry  = periodDays[0];
  const startMoonPhase       = periodStartEntry?.cosmos?.moonPhase ?? null;
  const startMoonIllumination = startMoonPhase != null ? getMoonIllumination(startMoonPhase) : null;
  const startMoonName        = periodStartEntry?.cosmos?.moonName ?? null;
  const periodStartTime      = fmt12(periodStartEntry?.period?.startTime) ?? null;
  const periodStartWeekday   = new Date(start + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });

  const avgCramps      = avg(crampVals);
  const avgCrampsLabel = avgCramps != null
    ? `${avgCramps} / 4 (${INTENSITY_LABELS[Math.round(Number(avgCramps))] ?? ''})`
    : null;

  const summit = buildSummitInfo(entries, start, cycleLength);

  return {
    start,
    next,
    length: cycleLength,
    periodLength: periodDays.length,
    periodStartWeekday,
    periodStartTime,
    avgMood:   avg(moodVals),
    avgEnergy: avg(energyVals),
    avgSleep:  avg(sleepVals),
    avgLibido: avg(libidoVals),
    avgCrampsLabel,
    fastingDays,
    fasts,
    topSymptoms,
    herbList,
    plantMedicines,
    loggedDays: entries.length,
    startMoonIllumination,
    startMoonName,
    sexCount,
    summit,
  };
}

function val(v, suffix) {
  return v != null ? `${v}${suffix}` : '—';
}

function formatEmailBody(cycle) {
  const periodStartLine = cycle.periodStartTime
    ? `${cycle.periodStartWeekday} at ${cycle.periodStartTime}`
    : cycle.periodStartWeekday;

  const lines = [
    `Your cycle from ${cycle.start} to ${cycle.next} is complete.`,
    '',
    `— ${cycle.length} day cycle`,
    `— ${cycle.periodLength} day period, started ${periodStartLine}`,
    `— ${cycle.loggedDays} days logged`,
    `— Avg mood: ${val(cycle.avgMood, ' / 10')}`,
    `— Avg creative energy: ${val(cycle.avgEnergy, ' / 5')}`,
    `— Avg sleep: ${val(cycle.avgSleep, ' / 5')}`,
    `— Avg libido: ${val(cycle.avgLibido, ' / 5')}`,
    `— Avg cramps: ${cycle.avgCrampsLabel ?? '—'}`,
    `— Sex: ${cycle.sexCount > 0 ? `${cycle.sexCount}×` : '—'}`,
    `— Fasting days: ${cycle.fastingDays > 0 ? cycle.fastingDays : '—'}`,
  ];

  if (cycle.startMoonIllumination != null) {
    lines.push('');
    lines.push('MOON AT PERIOD START');
    lines.push(`  ${cycle.startMoonName} (${cycle.startMoonIllumination}% illumination)`);
  } else {
    lines.push('');
    lines.push('MOON AT PERIOD START');
    lines.push('  — (no cosmos data)');
  }

  lines.push('');
  if (cycle.fasts.length) {
    lines.push('FASTING');
    cycle.fasts.forEach((f, i) => {
      const range = f.startDate !== f.endDate ? `${f.startDate} → ${f.endDate}` : f.startDate;
      lines.push(`  ${i + 1}. ${range} · ${f.durationStr} · ${getCyclePhaseName(f.phase)} phase`);
    });
  } else {
    lines.push('FASTING');
    lines.push('  — none logged');
  }

  lines.push('');
  if (cycle.plantMedicines.length) {
    lines.push('PLANT MEDICINE');
    cycle.plantMedicines.forEach(pm => lines.push(`  — ${pm.name} (${pm.days}d)`));
  } else {
    lines.push('PLANT MEDICINE');
    lines.push('  — none logged');
  }

  lines.push('');
  if (cycle.herbList.length) {
    lines.push('HERBS & SUPPLEMENTS');
    lines.push(`  ${cycle.herbList.join(', ')}`);
  } else {
    lines.push('HERBS & SUPPLEMENTS');
    lines.push('  — none logged');
  }

  lines.push('');
  if (cycle.topSymptoms.length) {
    lines.push('TOP SYMPTOMS');
    lines.push(`  ${cycle.topSymptoms.join(', ')}`);
  } else {
    lines.push('TOP SYMPTOMS');
    lines.push('  — none logged');
  }

  lines.push('');
  lines.push(cycle.summit.detected ? 'SUMMIT DAY' : 'PREDICTED SUMMIT');
  lines.push(`  Day ${cycle.summit.day} · ${fmtDate(cycle.summit.date)}`);
  lines.push(`  ${cycle.summit.calculation}`);

  lines.push('');
  lines.push('Open Find Your Rhythm to view your full cycle log.');

  return lines.join('\n');
}

async function sendEmail(to, subject, body) {
  const { emailjsServiceId, emailjsTemplateId, emailjsPublicKey } = getSettings();
  if (!emailjsServiceId || !emailjsTemplateId || !emailjsPublicKey || !to) return;

  await emailjs.send(
    emailjsServiceId,
    emailjsTemplateId,
    { to_email: to, subject, message: body },
    { publicKey: emailjsPublicKey }
  );
}
