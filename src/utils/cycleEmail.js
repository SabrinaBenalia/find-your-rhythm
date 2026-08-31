import emailjs from '@emailjs/browser';
import { getMoonIllumination } from './cosmos';
import { getSettings } from './storage';
import { extractFasts, getCyclePhaseName } from './cycle';

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

function buildEmailSummary(start, next, allEntries) {
  const entries = Object.values(allEntries).filter(
    e => e.date >= start && e.date < next
  ).sort((a, b) => a.date.localeCompare(b.date));

  if (!entries.length) return null;

  const periodDays = entries.filter(e => e.period?.active);
  const moodVals   = entries.map(e => e.body?.mood).filter(v => v != null);
  const energyVals = entries.map(e => e.body?.creativeEnergy).filter(v => v != null);
  const crampVals  = periodDays.map(e => e.period?.cramps).filter(v => v != null);
  const avg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : null;

  const fastingDays = entries.filter(e => e.fasting?.active).length;
  const fasts = extractFasts(entries, allEntries);
  const sexCount = entries.reduce((sum, e) => sum + (e.sex ?? 0), 0);

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

  // Collect plant medicines with total use count
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

  const periodStartEntry = periodDays[0];
  const startMoonPhase = periodStartEntry?.cosmos?.moonPhase ?? null;
  const startMoonIllumination = startMoonPhase != null ? getMoonIllumination(startMoonPhase) : null;
  const startMoonName = periodStartEntry?.cosmos?.moonName ?? null;
  const periodStartTime = fmt12(periodStartEntry?.period?.startTime) ?? null;
  const periodStartWeekday = new Date(start + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });

  const avgCramps = avg(crampVals);
  const avgCrampsLabel = avgCramps != null
    ? `${avgCramps} / 4 (${INTENSITY_LABELS[Math.round(Number(avgCramps))] ?? ''})`
    : null;

  return {
    start,
    next,
    length: cycleLength,
    periodLength: periodDays.length,
    periodStartWeekday,
    periodStartTime,
    avgMood: avg(moodVals),
    avgEnergy: avg(energyVals),
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
  };
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
    cycle.avgMood    != null ? `— Avg mood: ${cycle.avgMood} / 10`              : null,
    cycle.avgEnergy  != null ? `— Avg creative energy: ${cycle.avgEnergy} / 5` : null,
    cycle.avgCrampsLabel     ? `— Avg cramps: ${cycle.avgCrampsLabel}`          : null,
    cycle.sexCount > 0       ? `— Sex: ${cycle.sexCount}×`                     : null,
  ].filter(l => l !== null);

  if (cycle.startMoonIllumination != null) {
    lines.push('');
    lines.push('MOON AT PERIOD START');
    lines.push(`  ${cycle.startMoonName} (${cycle.startMoonIllumination}% illumination)`);
  }

  if (cycle.fasts.length) {
    lines.push('');
    lines.push('FASTING');
    cycle.fasts.forEach((f, i) => {
      const range = f.startDate !== f.endDate ? `${f.startDate} → ${f.endDate}` : f.startDate;
      lines.push(`  ${i + 1}. ${range} · ${f.durationStr} · ${getCyclePhaseName(f.phase)} phase`);
    });
  }

  if (cycle.plantMedicines.length) {
    lines.push('');
    lines.push('PLANT MEDICINE');
    cycle.plantMedicines.forEach(pm => {
      lines.push(`  — ${pm.name} (${pm.days}d)`);
    });
  }

  if (cycle.herbList.length) {
    lines.push('');
    lines.push('HERBS & SUPPLEMENTS');
    lines.push(`  ${cycle.herbList.join(', ')}`);
  }

  if (cycle.topSymptoms.length) {
    lines.push('');
    lines.push('TOP SYMPTOMS');
    lines.push(`  ${cycle.topSymptoms.join(', ')}`);
  }

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
