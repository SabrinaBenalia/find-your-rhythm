import { useState, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { useEntries } from '../hooks/useEntries';
import { getSettings } from '../utils/storage';
import { findPeriodStarts, detectCyclePhase } from '../utils/cycle';
import { getMoonPhase, getMoonIllumination, getMoonName } from '../utils/cosmos';

const SYSTEM_PROMPT = `You are a menstrual cycle health assistant. Analyze the cycle tracking data and provide clear, specific, actionable insights.

Guidelines:
- Reference actual numbers from the data
- Use short labelled sections with bullet points
- Do not invent data not present in the summary
- End with 1–2 things worth tracking next cycle
- Add a brief note to consult a healthcare provider for medical concerns`;

const PHASE_ORDER = ['menstrual', 'follicular', 'ovulation', 'luteal'];
const PHASE_NAMES = { menstrual: 'Menstrual', follicular: 'Follicular', ovulation: 'Ovulation', luteal: 'Luteal' };

function avg(arr) {
  const v = arr.filter(x => x != null && x > 0);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}
function fmt(n, dec = 1) { return n != null ? n.toFixed(dec) : '—'; }

function buildCyclePrompt(cycleIdx, periodStarts, entries) {
  const start = periodStarts[cycleIdx];
  const next = periodStarts[cycleIdx + 1] || null;

  const cycleEntries = Object.values(entries)
    .filter(e => e.date >= start && (!next || e.date < next))
    .sort((a, b) => a.date.localeCompare(b.date));

  const cycleLength = next
    ? Math.round((new Date(next + 'T12:00:00Z') - new Date(start + 'T12:00:00Z')) / 86400000)
    : null;

  const periodDays = cycleEntries.filter(e => e.period?.active);
  const moonIllum = getMoonIllumination(getMoonPhase(start));
  const moonName = getMoonName(getMoonPhase(start));

  const phaseMetrics = {};
  PHASE_ORDER.forEach(p => { phaseMetrics[p] = { mood: [], energy: [], sleep: [], libido: [], cramps: [], flow: [] }; });

  cycleEntries.forEach(e => {
    const phase = detectCyclePhase(e.date, entries);
    if (!phase) return;
    if (e.body?.mood > 0) phaseMetrics[phase].mood.push(e.body.mood);
    if (e.body?.creativeEnergy > 0) phaseMetrics[phase].energy.push(e.body.creativeEnergy);
    if (e.body?.sleep > 0) phaseMetrics[phase].sleep.push(e.body.sleep);
    if (e.body?.libido > 0) phaseMetrics[phase].libido.push(e.body.libido);
    if (e.period?.cramps > 0) phaseMetrics[phase].cramps.push(e.period.cramps);
    if (e.period?.flow > 0) phaseMetrics[phase].flow.push(e.period.flow);
  });

  const phaseSection = PHASE_ORDER.map(p => {
    const m = phaseMetrics[p];
    if (!m.mood.length && !m.energy.length) return null;
    const parts = [
      `Mood: ${fmt(avg(m.mood))}/10`,
      `Energy: ${fmt(avg(m.energy))}/5`,
      `Sleep: ${fmt(avg(m.sleep))}/5`,
      `Libido: ${fmt(avg(m.libido))}/5`,
      m.flow.length ? `Flow: ${fmt(avg(m.flow))}/4` : null,
      m.cramps.length ? `Cramps: ${fmt(avg(m.cramps))}/4` : null,
    ].filter(Boolean);
    return `${PHASE_NAMES[p]}: ${parts.join(' · ')}`;
  }).filter(Boolean).join('\n');

  const symCount = {};
  cycleEntries.forEach(e => (e.tags?.symptoms || []).forEach(s => { symCount[s] = (symCount[s] || 0) + 1; }));
  const topSymptoms = Object.entries(symCount).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const bbtEntries = cycleEntries.filter(e => e.body?.temp);
  const lhEntries = cycleEntries.filter(e => e.body?.lhPeak > 0);
  const mucusTypes = [...new Set(cycleEntries.filter(e => e.body?.cervicalMucusType).map(e => e.body.cervicalMucusType))];

  const herbCount = {};
  cycleEntries.forEach(e => (e.tags?.herbs || []).forEach(h => { herbCount[h] = (herbCount[h] || 0) + 1; }));
  const herbs = Object.entries(herbCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return `Please provide insights for my cycle data.

CYCLE ${cycleIdx + 1} OVERVIEW
- Start: ${start} · Length: ${cycleLength ? `${cycleLength} days` : 'ongoing'}
- Period: ${periodDays.length} days · Days logged: ${cycleEntries.length}
- Moon at period start: ${moonName} (${moonIllum}% illumination)

AVERAGES BY PHASE
${phaseSection || 'Not enough phase data.'}

BODY SIGNALS
- BBT: ${bbtEntries.length ? `${Math.min(...bbtEntries.map(e => e.body.temp))}°C – ${Math.max(...bbtEntries.map(e => e.body.temp))}°C (${bbtEntries.length} readings)` : 'not logged'}
- Peak LH: ${lhEntries.length ? Math.max(...lhEntries.map(e => e.body.lhPeak)) : 'not logged'}
- Cervical mucus: ${mucusTypes.length ? mucusTypes.join(', ') : 'not logged'}

SYMPTOMS
${topSymptoms.length ? topSymptoms.map(([s, c]) => `- ${s}: ${c}d`).join('\n') : 'None logged'}

HERBS & SUPPLEMENTS
${herbs.length ? herbs.map(([h, c]) => `- ${h}: ${c}d`).join('\n') : 'None logged'}

Give insights on: hormonal patterns, mood/energy across phases, notable symptoms, and what to track next cycle.`;
}

function buildAllCyclesPrompt(periodStarts, entries) {
  const cycles = periodStarts.map((start, i) => {
    const next = periodStarts[i + 1] || null;
    const cycleLength = next
      ? Math.round((new Date(next + 'T12:00:00Z') - new Date(start + 'T12:00:00Z')) / 86400000)
      : null;
    const cycleEntries = Object.values(entries).filter(e => e.date >= start && (!next || e.date < next));
    const periodLength = cycleEntries.filter(e => e.period?.active).length;
    return {
      num: i + 1, start, cycleLength, periodLength,
      moonIllum: getMoonIllumination(getMoonPhase(start)),
      moonName: getMoonName(getMoonPhase(start)),
      logged: cycleEntries.length,
    };
  });

  const phaseMetrics = {};
  PHASE_ORDER.forEach(p => { phaseMetrics[p] = { mood: [], energy: [], sleep: [], libido: [] }; });
  Object.values(entries).forEach(e => {
    const phase = detectCyclePhase(e.date, entries);
    if (!phase) return;
    if (e.body?.mood > 0) phaseMetrics[phase].mood.push(e.body.mood);
    if (e.body?.creativeEnergy > 0) phaseMetrics[phase].energy.push(e.body.creativeEnergy);
    if (e.body?.sleep > 0) phaseMetrics[phase].sleep.push(e.body.sleep);
    if (e.body?.libido > 0) phaseMetrics[phase].libido.push(e.body.libido);
  });

  const symCount = {};
  Object.values(entries).forEach(e => (e.tags?.symptoms || []).forEach(s => { symCount[s] = (symCount[s] || 0) + 1; }));
  const topSymptoms = Object.entries(symCount).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const cycleLengths = cycles.filter(c => c.cycleLength).map(c => c.cycleLength);

  return `Please provide insights across all my logged cycles.

OVERVIEW (${cycles.length} cycles)
- Avg cycle length: ${cycleLengths.length ? fmt(avg(cycleLengths), 0) + ' days' : '—'}
- Avg period length: ${fmt(avg(cycles.map(c => c.periodLength)), 0)} days
- Total days logged: ${Object.keys(entries).length}

PER-CYCLE SUMMARY
${cycles.map(c => `Cycle ${c.num}: ${c.start} · ${c.cycleLength ? c.cycleLength + 'd' : 'ongoing'} · period ${c.periodLength}d · moon: ${c.moonName} (${c.moonIllum}%)`).join('\n')}

OVERALL AVERAGES BY PHASE
${PHASE_ORDER.map(p => {
    const m = phaseMetrics[p];
    if (!m.mood.length && !m.energy.length) return null;
    return `${PHASE_NAMES[p]}: Mood ${fmt(avg(m.mood))}/10 · Energy ${fmt(avg(m.energy))}/5 · Sleep ${fmt(avg(m.sleep))}/5 · Libido ${fmt(avg(m.libido))}/5`;
  }).filter(Boolean).join('\n')}

TOP SYMPTOMS
${topSymptoms.length ? topSymptoms.map(([s, c]) => `- ${s}: ${c}d total`).join('\n') : 'None logged'}

Give insights on: cycle regularity, phase patterns across cycles, symptom trends, moon phase patterns at period start, and what to focus on going forward.`;
}

export default function AIInsights() {
  const { entries } = useEntries();
  const [mode, setMode] = useState('cycle');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');

  const settings = getSettings();
  const apiKey = settings.anthropicApiKey || '';

  const allEntries = useMemo(() =>
    Object.values(entries).sort((a, b) => a.date.localeCompare(b.date)),
    [entries]
  );

  const periodStarts = useMemo(() => {
    const dates = allEntries.filter(e => e.period?.active).map(e => e.date);
    return findPeriodStarts(dates);
  }, [allEntries]);

  function switchMode(m) {
    setMode(m);
    setResponse('');
    setError('');
  }

  async function generate() {
    setLoading(true);
    setResponse('');
    setError('');

    const prompt = mode === 'cycle'
      ? buildCyclePrompt(selectedIdx, periodStarts, entries)
      : buildAllCyclesPrompt(periodStarts, entries);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1200,
          stream: true,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              setResponse(prev => prev + parsed.delta.text);
            }
          } catch { /* skip malformed SSE lines */ }
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to generate insights.');
    }

    setLoading(false);
  }

  if (!apiKey) {
    return (
      <div className="screen ai-insights-screen">
        <header className="screen-header">
          <h2>AI Insights</h2>
        </header>
        <div className="insights-setup">
          <Sparkles size={36} className="insights-setup-icon" />
          <p>Add your Anthropic API key in <strong>Settings → AI Insights</strong> to generate insights from your cycle data.</p>
          <p className="help-text">Your data is sent to Claude (Anthropic) for analysis and is not stored by this app.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen ai-insights-screen">
      <header className="screen-header">
        <h2>AI Insights</h2>
      </header>

      <div className="seg-control" style={{ margin: '0 16px 16px' }}>
        <button className={mode === 'cycle' ? 'active' : ''} onClick={() => switchMode('cycle')}>This cycle</button>
        <button className={mode === 'all' ? 'active' : ''} onClick={() => switchMode('all')}>All cycles</button>
      </div>

      {mode === 'cycle' && periodStarts.length > 1 && (
        <div style={{ padding: '0 16px 12px' }}>
          <select value={selectedIdx} onChange={e => { setSelectedIdx(Number(e.target.value)); setResponse(''); }}>
            {periodStarts.map((start, i) => (
              <option key={start} value={i}>Cycle {i + 1} · {start}</option>
            ))}
          </select>
        </div>
      )}

      {periodStarts.length === 0 ? (
        <div className="empty-state">
          <p>No period data yet. Log your first period on the Today screen.</p>
        </div>
      ) : (
        <>
          <div style={{ padding: '0 16px 16px' }}>
            <button className="generate-btn" onClick={generate} disabled={loading}>
              <Sparkles size={15} />
              {loading ? 'Generating…' : response ? 'Regenerate' : 'Generate insights'}
            </button>
          </div>

          {error && <p className="insights-error">{error}</p>}

          {response && (
            <div className="insights-response">{response}</div>
          )}

          {!response && !loading && (
            <p className="insights-hint">
              Claude will analyse your logged data and surface patterns across phases, symptoms, and moon cycles.
            </p>
          )}

          <p className="insights-disclaimer">
            Data sent to Anthropic · Always consult a healthcare provider for medical concerns
          </p>
        </>
      )}
    </div>
  );
}
