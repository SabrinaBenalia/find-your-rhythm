import emailjs from '@emailjs/browser';
import { getMoonIllumination } from './cosmos';
import { getSettings } from './storage';
import { extractFasts, getCyclePhaseName } from './cycle';

export async function sendCycleEndEmail(completedCycleStart, newCycleStart, allEntries, userEmail) {
  const cycle = buildEmailSummary(completedCycleStart, newCycleStart, allEntries);
  if (!cycle) return;

  const subject = `Cycle ${cycle.cycleNum} complete — ${cycle.length} days`;
  const body = formatEmailBody(cycle);

  await sendEmail(userEmail, subject, body);
}

function buildEmailSummary(start, next, allEntries) {
  const entries = Object.values(allEntries).filter(
    e => e.date >= start && e.date < next
  ).sort((a, b) => a.date.localeCompare(b.date));

  if (!entries.length) return null;

  const periodDays = entries.filter(e => e.period?.active);
  const moodVals   = entries.map(e => e.body?.mood).filter(Boolean);
  const energyVals = entries.map(e => e.body?.creativeEnergy).filter(Boolean);
  const avg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '—';

  const fastingDays = entries.filter(e => e.fasting?.active).length;
  const fasts = extractFasts(entries, allEntries);

  const symCount = {};
  entries.forEach(e => (e.tags?.symptoms || []).forEach(s => {
    symCount[s] = (symCount[s] || 0) + 1;
  }));
  const topSymptoms = Object.entries(symCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([s, c]) => `${s} (${c}d)`);

  const cycleLength = Math.round(
    (new Date(next + 'T12:00:00Z') - new Date(start + 'T12:00:00Z')) / (1000 * 60 * 60 * 24)
  );

  const periodStartEntry = periodDays[0];
  const startMoonPhase = periodStartEntry?.cosmos?.moonPhase ?? null;
  const startMoonIllumination = startMoonPhase != null ? getMoonIllumination(startMoonPhase) : null;
  const startMoonName = periodStartEntry?.cosmos?.moonName ?? null;

  return {
    start,
    next,
    length: cycleLength,
    periodLength: periodDays.length,
    avgMood: avg(moodVals),
    avgEnergy: avg(energyVals),
    fastingDays,
    fasts,
    topSymptoms,
    loggedDays: entries.length,
    startMoonIllumination,
    startMoonName,
  };
}

function formatEmailBody(cycle) {
  const moonLine = cycle.startMoonIllumination != null
    ? `— Moon at period start: ${cycle.startMoonName} (${cycle.startMoonIllumination}% illumination)`
    : '';
  return `
Your cycle from ${cycle.start} to ${cycle.next} is complete.

— ${cycle.length} day cycle
— ${cycle.periodLength} day period
— ${cycle.loggedDays} days logged
— Avg mood: ${cycle.avgMood} / 10
— Avg creative energy: ${cycle.avgEnergy} / 5
— Fasting days: ${cycle.fastingDays}
${cycle.fasts.length ? `\nFASTS\n${cycle.fasts.map((f, i) => `  ${i + 1}. ${f.startDate}${f.startDate !== f.endDate ? ` → ${f.endDate}` : ''} · ${f.durationStr} · ${getCyclePhaseName(f.phase)} phase`).join('\n')}` : ''}
${moonLine}
${cycle.topSymptoms.length ? `— Top symptoms: ${cycle.topSymptoms.join(', ')}` : ''}

Open Find Your Rhythm to view your full cycle log.
`.trim();
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
