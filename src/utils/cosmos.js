// Known eclipse dates (UTC) — a selection of significant eclipses 2020-2028
const ECLIPSE_DATES = new Set([
  '2020-06-21', '2020-07-05', '2020-11-30', '2020-12-14',
  '2021-05-26', '2021-06-10', '2021-11-19', '2021-12-04',
  '2022-04-30', '2022-05-16', '2022-10-25', '2022-11-08',
  '2023-04-20', '2023-05-05', '2023-10-14', '2023-10-28',
  '2024-03-25', '2024-04-08', '2024-09-17', '2024-10-02',
  '2025-03-14', '2025-03-29', '2025-09-07', '2025-09-21',
  '2026-02-17', '2026-03-03', '2026-08-12', '2026-08-28',
  '2027-02-06', '2027-08-02', '2027-08-17',
  '2028-01-12', '2028-01-26', '2028-07-06', '2028-07-22',
]);

// Reference new moon: 2000-01-06 18:14 UTC
const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z');
export const LUNAR_CYCLE = 29.53058770576;

export function getMoonPhase(dateStr) {
  const date = new Date(dateStr + 'T12:00:00Z');
  const diffMs = date - KNOWN_NEW_MOON;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const phase = ((diffDays % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;
  return phase; // 0 = new moon, ~14.7 = full moon
}

// Returns the exact UTC time (HH:MM) of a major phase event if one falls on this date, else null
export function getMoonPhaseEvent(dateStr) {
  const QUARTER = LUNAR_CYCLE / 4;
  const PHASES = [
    { name: 'New Moon',      emoji: '🌑', offset: 0 },
    { name: 'First Quarter', emoji: '🌓', offset: QUARTER },
    { name: 'Full Moon',     emoji: '🌕', offset: QUARTER * 2 },
    { name: 'Last Quarter',  emoji: '🌗', offset: QUARTER * 3 },
  ];

  // Days since reference new moon at midnight UTC of this date
  const midnight = new Date(dateStr + 'T00:00:00Z');
  const diffDays = (midnight - KNOWN_NEW_MOON) / (1000 * 60 * 60 * 24);
  const dayInCycle = ((diffDays % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;

  for (const phase of PHASES) {
    let daysUntil = phase.offset - dayInCycle;
    if (daysUntil < 0) daysUntil += LUNAR_CYCLE;
    if (daysUntil < 1.0) {
      const eventDate = new Date(midnight.getTime() + daysUntil * 24 * 60 * 60 * 1000);
      const time = eventDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/New_York',
      });
      const tz = eventDate.toLocaleDateString('en-US', { timeZoneName: 'short', timeZone: 'America/New_York' }).split(', ')[1] || 'ET';
      return {
        name: phase.name,
        emoji: phase.emoji,
        time: `${time} ${tz}`,
      };
    }
  }
  return null;
}

export function getMoonName(phase) {
  const p = phase / LUNAR_CYCLE;
  if (p < 0.0625) return 'New Moon';
  if (p < 0.1875) return 'Waxing Crescent';
  if (p < 0.3125) return 'First Quarter';
  if (p < 0.4375) return 'Waxing Gibbous';
  if (p < 0.5625) return 'Full Moon';
  if (p < 0.6875) return 'Waning Gibbous';
  if (p < 0.8125) return 'Last Quarter';
  if (p < 0.9375) return 'Waning Crescent';
  return 'New Moon';
}

export function getMoonIllumination(phase) {
  return Math.round((1 - Math.cos(2 * Math.PI * phase / LUNAR_CYCLE)) / 2 * 1000) / 10;
}

export function getMoonEmoji(phase) {
  const p = phase / LUNAR_CYCLE;
  const emojis = ['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘'];
  return emojis[Math.floor(p * 8) % 8];
}

export function isEclipse(dateStr) {
  return ECLIPSE_DATES.has(dateStr);
}

export function isFullMoon(phase) {
  return Math.abs(phase - LUNAR_CYCLE / 2) < 1.0;
}

export function isNewMoon(phase) {
  return phase < 1.0 || phase > LUNAR_CYCLE - 1.0;
}

export function getSeason(dateStr, hemisphere = 'north') {
  const date = new Date(dateStr + 'T12:00:00Z');
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const dayOfYear = getDayOfYear(date);

  // Northern hemisphere season boundaries (approximate)
  const northSeasons = [
    { name: 'Winter', start: 355 },
    { name: 'Spring', start: 80 },
    { name: 'Summer', start: 172 },
    { name: 'Autumn', start: 266 },
  ];

  let season;
  if (dayOfYear >= 355 || dayOfYear < 80) season = 'Winter';
  else if (dayOfYear < 172) season = 'Spring';
  else if (dayOfYear < 266) season = 'Summer';
  else season = 'Autumn';

  if (hemisphere === 'south') {
    const flip = { Winter: 'Summer', Summer: 'Winter', Spring: 'Autumn', Autumn: 'Spring' };
    season = flip[season];
  }

  return season;
}

export function getDaylightHours(dateStr, latitudeDeg) {
  const date = new Date(dateStr + 'T12:00:00Z');
  const dayOfYear = getDayOfYear(date);
  const lat = (latitudeDeg * Math.PI) / 180;

  // Solar declination
  const decl = (23.45 * Math.PI / 180) * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));

  const cosHourAngle = -Math.tan(lat) * Math.tan(decl);
  if (cosHourAngle >= 1) return 0; // polar night
  if (cosHourAngle <= -1) return 24; // midnight sun

  const hourAngle = Math.acos(cosHourAngle);
  return Math.round(((2 * hourAngle * 180) / (Math.PI * 15)) * 10) / 10;
}

export function getSolsticeEquinoxProximity(dateStr) {
  const date = new Date(dateStr + 'T12:00:00Z');
  const year = date.getUTCFullYear();
  const events = [
    new Date(`${year}-03-20T12:00:00Z`),
    new Date(`${year}-06-21T12:00:00Z`),
    new Date(`${year}-09-22T12:00:00Z`),
    new Date(`${year}-12-21T12:00:00Z`),
  ];
  const names = ['Spring Equinox', 'Summer Solstice', 'Autumn Equinox', 'Winter Solstice'];
  let closest = null;
  let minDiff = Infinity;
  events.forEach((ev, i) => {
    const diff = Math.abs(date - ev) / (1000 * 60 * 60 * 24);
    if (diff < minDiff) { minDiff = diff; closest = names[i]; }
  });
  return { event: closest, daysAway: Math.round(minDiff) };
}

function getDayOfYear(date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const diff = date - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// More accurate solstice/equinox dates per year (±1 day of real event)
const SOLAR_EVENTS_BY_YEAR = {
  2020: [{ d:'2020-03-20',n:'Spring Equinox',e:'🌱'},{d:'2020-06-20',n:'Summer Solstice',e:'☀️'},{d:'2020-09-22',n:'Autumn Equinox',e:'🍂'},{d:'2020-12-21',n:'Winter Solstice',e:'❄️'}],
  2021: [{ d:'2021-03-20',n:'Spring Equinox',e:'🌱'},{d:'2021-06-21',n:'Summer Solstice',e:'☀️'},{d:'2021-09-22',n:'Autumn Equinox',e:'🍂'},{d:'2021-12-21',n:'Winter Solstice',e:'❄️'}],
  2022: [{ d:'2022-03-20',n:'Spring Equinox',e:'🌱'},{d:'2022-06-21',n:'Summer Solstice',e:'☀️'},{d:'2022-09-23',n:'Autumn Equinox',e:'🍂'},{d:'2022-12-21',n:'Winter Solstice',e:'❄️'}],
  2023: [{ d:'2023-03-20',n:'Spring Equinox',e:'🌱'},{d:'2023-06-21',n:'Summer Solstice',e:'☀️'},{d:'2023-09-23',n:'Autumn Equinox',e:'🍂'},{d:'2023-12-22',n:'Winter Solstice',e:'❄️'}],
  2024: [{ d:'2024-03-20',n:'Spring Equinox',e:'🌱'},{d:'2024-06-20',n:'Summer Solstice',e:'☀️'},{d:'2024-09-22',n:'Autumn Equinox',e:'🍂'},{d:'2024-12-21',n:'Winter Solstice',e:'❄️'}],
  2025: [{ d:'2025-03-20',n:'Spring Equinox',e:'🌱'},{d:'2025-06-21',n:'Summer Solstice',e:'☀️'},{d:'2025-09-22',n:'Autumn Equinox',e:'🍂'},{d:'2025-12-21',n:'Winter Solstice',e:'❄️'}],
  2026: [{ d:'2026-03-20',n:'Spring Equinox',e:'🌱'},{d:'2026-06-21',n:'Summer Solstice',e:'☀️'},{d:'2026-09-23',n:'Autumn Equinox',e:'🍂'},{d:'2026-12-22',n:'Winter Solstice',e:'❄️'}],
  2027: [{ d:'2027-03-20',n:'Spring Equinox',e:'🌱'},{d:'2027-06-21',n:'Summer Solstice',e:'☀️'},{d:'2027-09-23',n:'Autumn Equinox',e:'🍂'},{d:'2027-12-22',n:'Winter Solstice',e:'❄️'}],
  2028: [{ d:'2028-03-20',n:'Spring Equinox',e:'🌱'},{d:'2028-06-20',n:'Summer Solstice',e:'☀️'},{d:'2028-09-22',n:'Autumn Equinox',e:'🍂'},{d:'2028-12-21',n:'Winter Solstice',e:'❄️'}],
};

export function getSolarEvent(dateStr) {
  const year = parseInt(dateStr.slice(0, 4));
  const events = SOLAR_EVENTS_BY_YEAR[year] || [];
  return events.find(ev => ev.d === dateStr) || null;
}

export function getCosmosForDate(dateStr, hemisphere = 'north', latitude = 45) {
  const phase = getMoonPhase(dateStr);
  return {
    moonPhase: Math.round(phase * 100) / 100,
    moonName: getMoonName(phase),
    season: getSeason(dateStr, hemisphere),
    daylightHours: getDaylightHours(dateStr, latitude),
    isEclipse: isEclipse(dateStr),
    isFullMoon: isFullMoon(phase),
    isNewMoon: isNewMoon(phase),
  };
}
