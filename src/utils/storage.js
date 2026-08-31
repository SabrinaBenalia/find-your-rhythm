export function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function localDateTimeStr(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const ENTRIES_KEY = 'fyr_entries';
const SETTINGS_KEY = 'fyr_settings';

export function getAllEntries() {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getEntry(date) {
  const entries = getAllEntries();
  return entries[date] || null;
}

export function saveEntry(entry) {
  const entries = getAllEntries();
  entries[entry.date] = entry;
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function deleteEntry(date) {
  const entries = getAllEntries();
  delete entries[date];
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

const FAST_KEY = 'fyr_current_fast';

export function getCurrentFast() {
  try {
    const raw = localStorage.getItem(FAST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function startCurrentFast(startedAt) {
  localStorage.setItem(FAST_KEY, JSON.stringify({ startedAt }));
}

export function clearCurrentFast() {
  localStorage.removeItem(FAST_KEY);
}

const DEFAULT_TAGS = {
  symptoms:   ['cramps', 'acne', 'nausea', 'irritability', 'anxiety', 'fatigue', 'bloating', 'headache', 'spotting', 'pms'],
  herbs:      ['vitex', 'raspberry leaf', 'nettle', 'mugwort', 'ashwagandha', 'maca', 'evening primrose'],
  activities: ['fasting', 'yoga', 'sauna', 'meditation', 'cold plunge', 'running', 'strength training'],
};

export { DEFAULT_TAGS };

function defaultSettings() {
  return {
    hemisphere: 'north',
    latitude: 45,
    tagLists: {
      symptoms:   [...DEFAULT_TAGS.symptoms],
      herbs:      [...DEFAULT_TAGS.herbs],
      activities: [...DEFAULT_TAGS.activities],
    },
  };
}

export function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    const s = JSON.parse(raw);
    // Migrate old customTags format
    if (!s.tagLists) {
      s.tagLists = {
        symptoms:   [...DEFAULT_TAGS.symptoms, ...(s.customTags?.symptoms || [])],
        herbs:      [...DEFAULT_TAGS.herbs,    ...(s.customTags?.herbs    || [])],
        activities: [...DEFAULT_TAGS.activities, ...(s.customTags?.activities || [])],
      };
      delete s.customTags;
    }
    return s;
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function importEntries(data) {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(data));
}

export function exportJSON() {
  const entries = getAllEntries();
  return JSON.stringify(entries, null, 2);
}

export function exportCSV() {
  const entries = getAllEntries();
  const rows = Object.values(entries).sort((a, b) => a.date.localeCompare(b.date));
  if (!rows.length) return '';

  const headers = [
    'date', 'period_active', 'flow', 'cramps', 'pms',
    'temp', 'temp_time', 'cervical_mucus_level', 'cervical_mucus_type', 'cervix_level', 'lh_peak', 'lh_time',
    'breast_pain', 'breast_size', 'nipple_change', 'libido', 'mood', 'creative_energy', 'sleep',
    'poop_count', 'poops',
    'fasting', 'fast_start_time', 'fast_end_time',
    'symptoms', 'herbs', 'activities', 'notes',
    'moon_phase', 'moon_name', 'season', 'daylight_hours'
  ];

  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

  const lines = rows.map(e => [
    e.date,
    e.period?.active ? 1 : 0,
    e.period?.flow ?? '',
    e.period?.cramps ?? '',
    e.period?.pms ? 1 : 0,
    e.body?.temp ?? '',
    e.body?.tempTime ?? '',
    e.body?.cervicalMucusLevel ?? '',
    e.body?.cervicalMucusType ?? '',
    e.body?.cervixLevel ?? '',
    e.body?.lhPeak ?? '',
    e.body?.lhTime ?? '',
    e.body?.breastPain ?? '',
    e.body?.breastSize ?? '',
    e.body?.nippleChange ?? '',
    e.body?.libido ?? '',
    e.body?.mood ?? '',
    e.body?.creativeEnergy ?? '',
    e.body?.sleep ?? '',
    e.poops?.length ?? 0,
    escape((e.poops || []).map(p => `${p.colour}/${p.size}/${p.density}`).join(' | ')),
    e.fasting?.active ? 1 : 0,
    e.fasting?.startTime ?? '',
    e.fasting?.endTime ?? '',
    escape((e.tags?.symptoms || []).join(', ')),
    escape((e.tags?.herbs || []).join(', ')),
    escape((e.tags?.activities || []).join(', ')),
    escape(e.notes ?? ''),
    e.cosmos?.moonPhase ?? '',
    escape(e.cosmos?.moonName ?? ''),
    escape(e.cosmos?.season ?? ''),
    e.cosmos?.daylightHours ?? ''
  ].join(','));

  return [headers.join(','), ...lines].join('\n');
}

export function createEmptyEntry(date, cosmos) {
  return {
    date,
    period: { active: false, flow: 0, cramps: 0, pms: false },
    body: {
      temp: null,
      tempTime: null,
      cervicalMucusLevel: '',
      cervicalMucusType: '',
      lhPeak: null,
      lhTime: null,
      cervixLevel: '',
      breastPain: null,
      breastSize: null,
      nippleChange: null,
      libido: null,
      mood: null,
      creativeEnergy: null,
      sleep: null,
    },
    poops: [],
    fasting: { active: false, startTime: null, endTime: null },
    tags: { symptoms: [], herbs: [], activities: [] },
    plantMedicine: [],
    notes: '',
    cosmos
  };
}
