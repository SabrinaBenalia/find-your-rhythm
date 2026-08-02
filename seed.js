// Run this in the browser console on localhost:5173
// It seeds one full cycle: July 12 → August 3, 2026

const entries = {
  "2026-07-12": {
    date: "2026-07-12",
    period: { active: true, flow: 4, cramps: 4, pms: true },
    body: {
      temp: 36.28, tempTime: "07:15",
      cervicalMucusLevel: "dry", cervicalMucusType: "sticky",
      lhPeak: null, lhTime: null,
      cervixLevel: "low / closed / tonic (nose tip)",
      breastPain: 3, breastSize: 2, nippleChange: 2,
      libido: 1, mood: 3, creativeEnergy: 1, sleep: 2
    },
    poops: [{ colour: "normal", size: "medium", density: "soft" }],
    fasting: { active: false, startTime: null, endTime: null },
    tags: { symptoms: ["cramps", "fatigue", "bloating"], herbs: ["raspberry leaf"], activities: [] },
    plantMedicine: [{ name: "Vitex", quantity: "20 drops" }],
    notes: "First day. Really heavy, staying in bed most of the day.",
    cosmos: { moonPhase: 0.52, moonName: "Waning Gibbous", season: "Summer", daylightHours: 16.1 }
  },
  "2026-07-13": {
    date: "2026-07-13",
    period: { active: true, flow: 4, cramps: 4, pms: false },
    body: {
      temp: 36.25, tempTime: "07:10",
      cervicalMucusLevel: "dry", cervicalMucusType: "sticky",
      lhPeak: null, lhTime: null,
      cervixLevel: "low / closed / tonic (nose tip)",
      breastPain: 2, breastSize: 2, nippleChange: 2,
      libido: 1, mood: 3, creativeEnergy: 1, sleep: 2
    },
    poops: [{ colour: "dark", size: "medium", density: "soft" }],
    fasting: { active: false, startTime: null, endTime: null },
    tags: { symptoms: ["cramps", "fatigue", "headache"], herbs: ["raspberry leaf"], activities: [] },
    plantMedicine: [{ name: "Vitex", quantity: "20 drops" }],
    notes: "Still very heavy. Headache all day.",
    cosmos: { moonPhase: 0.44, moonName: "Waning Gibbous", season: "Summer", daylightHours: 16.0 }
  },
  "2026-07-14": {
    date: "2026-07-14",
    period: { active: true, flow: 3, cramps: 3, pms: false },
    body: {
      temp: 36.31, tempTime: "07:20",
      cervicalMucusLevel: "dry", cervicalMucusType: "sticky",
      lhPeak: null, lhTime: null,
      cervixLevel: "low / closed / tonic (nose tip)",
      breastPain: 2, breastSize: 1, nippleChange: 1,
      libido: 1, mood: 4, creativeEnergy: 2, sleep: 3
    },
    poops: [{ colour: "normal", size: "medium", density: "normal" }],
    fasting: { active: false, startTime: null, endTime: null },
    tags: { symptoms: ["cramps", "fatigue"], herbs: ["raspberry leaf"], activities: ["yoga"] },
    plantMedicine: [{ name: "Vitex", quantity: "20 drops" }],
    notes: "Getting a bit better. Did some gentle yoga.",
    cosmos: { moonPhase: 0.37, moonName: "Last Quarter", season: "Summer", daylightHours: 15.9 }
  },
  "2026-07-15": {
    date: "2026-07-15",
    period: { active: true, flow: 2, cramps: 2, pms: false },
    body: {
      temp: 36.33, tempTime: "07:05",
      cervicalMucusLevel: "dry", cervicalMucusType: "sticky",
      lhPeak: null, lhTime: null,
      cervixLevel: "low / closed / tonic (nose tip)",
      breastPain: 1, breastSize: 1, nippleChange: 1,
      libido: 2, mood: 5, creativeEnergy: 2, sleep: 3
    },
    poops: [
      { colour: "normal", size: "medium", density: "normal" },
      { colour: "light", size: "small", density: "soft" }
    ],
    fasting: { active: false, startTime: null, endTime: null },
    tags: { symptoms: ["fatigue"], herbs: ["raspberry leaf", "nettle"], activities: ["walk"] },
    plantMedicine: [{ name: "Vitex", quantity: "20 drops" }],
    notes: "Lighter today. Went for a short walk.",
    cosmos: { moonPhase: 0.30, moonName: "Last Quarter", season: "Summer", daylightHours: 15.8 }
  },
  "2026-07-16": {
    date: "2026-07-16",
    period: { active: true, flow: 1, cramps: 1, pms: false },
    body: {
      temp: 36.35, tempTime: "07:30",
      cervicalMucusLevel: "dry", cervicalMucusType: "sticky",
      lhPeak: null, lhTime: null,
      cervixLevel: "low / closed / tonic (nose tip)",
      breastPain: 0, breastSize: 1, nippleChange: 1,
      libido: 2, mood: 5, creativeEnergy: 3, sleep: 4
    },
    poops: [{ colour: "normal", size: "medium", density: "normal" }],
    fasting: { active: false, startTime: null, endTime: null },
    tags: { symptoms: ["spotting"], herbs: ["raspberry leaf", "nettle"], activities: ["walk"] },
    plantMedicine: [{ name: "Vitex", quantity: "20 drops" }],
    notes: "Almost done. Feeling much better.",
    cosmos: { moonPhase: 0.24, moonName: "Waning Crescent", season: "Summer", daylightHours: 15.7 }
  },
  "2026-07-17": {
    date: "2026-07-17",
    period: { active: true, flow: 1, cramps: 0, pms: false },
    body: {
      temp: 36.38, tempTime: "07:15",
      cervicalMucusLevel: "dry", cervicalMucusType: "sticky",
      lhPeak: null, lhTime: null,
      cervixLevel: "low / closed / tonic (nose tip)",
      breastPain: 0, breastSize: 1, nippleChange: 1,
      libido: 2, mood: 6, creativeEnergy: 3, sleep: 4
    },
    poops: [{ colour: "normal", size: "medium", density: "normal" }],
    fasting: { active: false, startTime: null, endTime: null },
    tags: { symptoms: [], herbs: ["raspberry leaf"], activities: ["yoga"] },
    plantMedicine: [{ name: "Vitex", quantity: "20 drops" }],
    notes: "Last day, just spotting. Energy coming back.",
    cosmos: { moonPhase: 0.18, moonName: "Waning Crescent", season: "Summer", daylightHours: 15.6 }
  },
  "2026-07-18": {
    date: "2026-07-18",
    period: { active: false, flow: 0, cramps: 0, pms: false },
    body: {
      temp: 36.40, tempTime: "07:10",
      cervicalMucusLevel: "humid", cervicalMucusType: "sticky",
      lhPeak: 8.2, lhTime: "09:00",
      cervixLevel: "low / closed / tonic (nose tip)",
      breastPain: 0, breastSize: 1, nippleChange: 1,
      libido: 3, mood: 6, creativeEnergy: 3, sleep: 4
    },
    poops: [{ colour: "normal", size: "medium", density: "normal" }],
    fasting: { active: true, startTime: "19:00", endTime: null },
    tags: { symptoms: [], herbs: ["nettle", "maca"], activities: ["yoga", "meditation"] },
    plantMedicine: [{ name: "Vitex", quantity: "20 drops" }],
    notes: "Period done. Starting to feel like myself again. Starting a fast tonight.",
    cosmos: { moonPhase: 0.12, moonName: "Waning Crescent", season: "Summer", daylightHours: 15.5 }
  },
  "2026-07-19": {
    date: "2026-07-19",
    period: { active: false, flow: 0, cramps: 0, pms: false },
    body: {
      temp: 36.42, tempTime: "07:05",
      cervicalMucusLevel: "humid", cervicalMucusType: "creamy",
      lhPeak: 9.1, lhTime: "09:00",
      cervixLevel: "low / closed / tonic (nose tip)",
      breastPain: 0, breastSize: 1, nippleChange: 1,
      libido: 3, mood: 7, creativeEnergy: 3, sleep: 4
    },
    poops: [{ colour: "normal", size: "medium", density: "normal" }],
    fasting: { active: true, startTime: null, endTime: "11:00" },
    tags: { symptoms: [], herbs: ["nettle", "maca"], activities: ["walk", "meditation"] },
    plantMedicine: [{ name: "Vitex", quantity: "20 drops" }],
    notes: "Broke fast at 11am. Felt clear headed all morning.",
    cosmos: { moonPhase: 0.06, moonName: "Waning Crescent", season: "Summer", daylightHours: 15.4 }
  },
  "2026-07-20": {
    date: "2026-07-20",
    period: { active: false, flow: 0, cramps: 0, pms: false },
    body: {
      temp: 36.39, tempTime: "07:20",
      cervicalMucusLevel: "normal", cervicalMucusType: "creamy",
      lhPeak: 10.4, lhTime: "09:00",
      cervixLevel: "low / closed / tonic (nose tip)",
      breastPain: 0, breastSize: 1, nippleChange: 1,
      libido: 3, mood: 7, creativeEnergy: 4, sleep: 4
    },
    poops: [{ colour: "normal", size: "medium", density: "normal" }],
    fasting: { active: false, startTime: null, endTime: null },
    tags: { symptoms: [], herbs: ["nettle", "maca"], activities: ["running"] },
    plantMedicine: [{ name: "Vitex", quantity: "20 drops" }],
    notes: "New moon today. Good run this morning.",
    cosmos: { moonPhase: 0.01, moonName: "New Moon", season: "Summer", daylightHours: 15.3 }
  },
  "2026-07-21": {
    date: "2026-07-21",
    period: { active: false, flow: 0, cramps: 0, pms: false },
    body: {
      temp: 36.41, tempTime: "07:15",
      cervicalMucusLevel: "normal", cervicalMucusType: "creamy",
      lhPeak: 11.0, lhTime: "09:00",
      cervixLevel: "low / closed / tonic (nose tip)",
      breastPain: 0, breastSize: 1, nippleChange: 1,
      libido: 4, mood: 7, creativeEnergy: 4, sleep: 4
    },
    poops: [
      { colour: "normal", size: "medium", density: "normal" },
      { colour: "normal", size: "small", density: "normal" }
    ],
    fasting: { active: false, startTime: null, endTime: null },
    tags: { symptoms: [], herbs: ["maca", "evening primrose"], activities: ["yoga", "meditation"] },
    plantMedicine: [{ name: "Vitex", quantity: "20 drops" }, { name: "Evening primrose oil", quantity: "2 capsules" }],
    notes: "Feeling really creative and motivated.",
    cosmos: { moonPhase: 0.05, moonName: "Waxing Crescent", season: "Summer", daylightHours: 15.2 }
  },
  "2026-07-22": {
    date: "2026-07-22",
    period: { active: false, flow: 0, cramps: 0, pms: false },
    body: {
      temp: 36.43, tempTime: "07:00",
      cervicalMucusLevel: "normal", cervicalMucusType: "transparent",
      lhPeak: 12.3, lhTime: "09:00",
      cervixLevel: "low / closed / tonic (nose tip)",
      breastPain: 0, breastSize: 1, nippleChange: 1,
      libido: 4, mood: 8, creativeEnergy: 4, sleep: 5
    },
    poops: [{ colour: "normal", size: "large", density: "normal" }],
    fasting: { active: false, startTime: null, endTime: null },
    tags: { symptoms: [], herbs: ["maca", "evening primrose"], activities: ["running", "strength training"] },
    plantMedicine: [{ name: "Vitex", quantity: "20 drops" }, { name: "Evening primrose oil", quantity: "2 capsules" }],
    notes: "Best sleep in a while. Full of energy.",
    cosmos: { moonPhase: 0.11, moonName: "Waxing Crescent", season: "Summer", daylightHours: 15.1 }
  },
  "2026-07-23": {
    date: "2026-07-23",
    period: { active: false, flow: 0, cramps: 0, pms: false },
    body: {
      temp: 36.45, tempTime: "07:10",
      cervicalMucusLevel: "normal", cervicalMucusType: "transparent",
      lhPeak: 14.7, lhTime: "09:00",
      cervixLevel: "low / closed / tonic (nose tip)",
      breastPain: 0, breastSize: 1, nippleChange: 1,
      libido: 4, mood: 8, creativeEnergy: 5, sleep: 5
    },
    poops: [{ colour: "normal", size: "medium", density: "normal" }],
    fasting: { active: false, startTime: null, endTime: null },
    tags: { symptoms: [], herbs: ["maca", "evening primrose"], activities: ["yoga", "meditation", "walk"] },
    plantMedicine: [{ name: "Vitex", quantity: "20 drops" }, { name: "Evening primrose oil", quantity: "2 capsules" }],
    notes: "LH starting to rise. Feel electric today.",
    cosmos: { moonPhase: 0.18, moonName: "Waxing Crescent", season: "Summer", daylightHours: 15.0 }
  },
  "2026-07-24": {
    date: "2026-07-24",
    period: { active: false, flow: 0, cramps: 0, pms: false },
    body: {
      temp: 36.44, tempTime: "07:05",
      cervicalMucusLevel: "abundant", cervicalMucusType: "transparent",
      lhPeak: 22.1, lhTime: "09:00",
      cervixLevel: "high / open / soft",
      breastPain: 0, breastSize: 2, nippleChange: 2,
      libido: 5, mood: 9, creativeEnergy: 5, sleep: 5
    },
    poops: [{ colour: "normal", size: "medium", density: "normal" }],
    fasting: { active: false, startTime: null, endTime: null },
    tags: { symptoms: [], herbs: ["maca", "evening primrose"], activities: ["strength training", "sauna"] },
    plantMedicine: [{ name: "Vitex", quantity: "20 drops" }, { name: "Evening primrose oil", quantity: "2 capsules" }],
    notes: "LH surging. Feel invincible. Cervix is high and soft.",
    cosmos: { moonPhase: 0.25, moonName: "First Quarter", season: "Summer", daylightHours: 14.9 }
  },
  "2026-07-25": {
    date: "2026-07-25",
    period: { active: false, flow: 0, cramps: 0, pms: false },
    body: {
      temp: 36.42, tempTime: "07:00",
      cervicalMucusLevel: "abundant", cervicalMucusType: "stringy (egg white)",
      lhPeak: 48.3, lhTime: "09:00",
      cervixLevel: "high / open / soft",
      breastPain: 0, breastSize: 2, nippleChange: 2,
      libido: 5, mood: 9, creativeEnergy: 5, sleep: 4
    },
    poops: [{ colour: "light", size: "medium", density: "soft" }],
    fasting: { active: false, startTime: null, endTime: null },
    tags: { symptoms: [], herbs: ["maca", "evening primrose"], activities: ["yoga", "meditation"] },
    plantMedicine: [{ name: "Vitex", quantity: "20 drops" }, { name: "Evening primrose oil", quantity: "2 capsules" }],
    notes: "LH PEAK. Egg white mucus. This is it.",
    cosmos: { moonPhase: 0.32, moonName: "Waxing Gibbous", season: "Summer", daylightHours: 14.8 }
  },
  "2026-07-26": {
    date: "2026-07-26",
    period: { active: false, flow: 0, cramps: 0, pms: false },
    body: {
      temp: 36.78, tempTime: "07:05",
      cervicalMucusLevel: "abundant", cervicalMucusType: "stringy (egg white)",
      lhPeak: 31.2, lhTime: "09:00",
      cervixLevel: "high / open / soft",
      breastPain: 1, breastSize: 2, nippleChange: 2,
      libido: 5, mood: 8, creativeEnergy: 5, sleep: 4
    },
    poops: [{ colour: "normal", size: "medium", density: "normal" }],
    fasting: { active: false, startTime: null, endTime: null },
    tags: { symptoms: [], herbs: ["maca", "evening primrose"], activities: ["walk", "cold plunge"] },
    plantMedicine: [{ name: "Vitex", quantity: "20 drops" }],
    notes: "BBT rose overnight — confirmed ovulation. LH dropping.",
    cosmos: { moonPhase: 0.39, moonName: "Waxing Gibbous", season: "Summer", daylightHours: 14.7 }
  },
  "2026-07-27": {
    date: "2026-07-27",
    period: { active: false, flow: 0, cramps: 0, pms: false },
    body: {
      temp: 36.81, tempTime: "07:10",
      cervicalMucusLevel: "normal", cervicalMucusType: "creamy",
      lhPeak: 18.4, lhTime: "09:00",
      cervixLevel: "low / closed / tonic (nose tip)",
      breastPain: 1, breastSize: 2, nippleChange: 2,
      libido: 4, mood: 8, creativeEnergy: 4, sleep: 4
    },
    poops: [{ colour: "normal", size: "medium", density: "normal" }],
    fasting: { active: false, startTime: null, endTime: null },
    tags: { symptoms: [], herbs: ["ashwagandha"], activities: ["strength training"] },
    plantMedicine: [{ name: "Vitex", quantity: "20 drops" }],
    notes: "Into luteal now. BBT still high.",
    cosmos: { moonPhase: 0.46, moonName: "Waxing Gibbous", season: "Summer", daylightHours: 14.6 }
  },
  "2026-07-28": {
    date: "2026-07-28",
    period: { active: false, flow: 0, cramps: 0, pms: false },
    body: {
      temp: 36.79, tempTime: "07:15",
      cervicalMucusLevel: "humid", cervicalMucusType: "creamy",
      lhPeak: 11.2, lhTime: "09:00",
      cervixLevel: "low / closed / tonic (nose tip)",
      breastPain: 2, breastSize: 3, nippleChange: 2,
      libido: 3, mood: 7, creativeEnergy: 4, sleep: 4
    },
    poops: [
      { colour: "normal", size: "medium", density: "normal" },
      { colour: "normal", size: "pebble", density: "dense" }
    ],
    fasting: { active: false, startTime: null, endTime: null },
    tags: { symptoms: [], herbs: ["ashwagandha"], activities: ["yoga", "meditation"] },
    plantMedicine: [{ name: "Vitex", quantity: "20 drops" }],
    notes: "Settling into luteal. Breasts a bit tender.",
    cosmos: { moonPhase: 0.52, moonName: "Waxing Gibbous", season: "Summer", daylightHours: 14.5 }
  },
  "2026-07-29": {
    date: "2026-07-29",
    period: { active: false, flow: 0, cramps: 0, pms: false },
    body: {
      temp: 36.82, tempTime: "07:00",
      cervicalMucusLevel: "humid", cervicalMucusType: "sticky",
      lhPeak: null, lhTime: null,
      cervixLevel: "low / closed / tonic (nose tip)",
      breastPain: 2, breastSize: 3, nippleChange: 3,
      libido: 3, mood: 7, creativeEnergy: 3, sleep: 3
    },
    poops: [{ colour: "normal", size: "medium", density: "dense" }],
    fasting: { active: true, startTime: "19:30", endTime: null },
    tags: { symptoms: ["bloating"], herbs: ["ashwagandha", "vitex"], activities: ["walk"] },
    plantMedicine: [{ name: "Vitex", quantity: "20 drops" }],
    notes: "Starting to feel the luteal shift. Starting a short fast.",
    cosmos: { moonPhase: 0.59, moonName: "Full Moon", season: "Summer", daylightHours: 14.4 }
  },
  "2026-07-30": {
    date: "2026-07-30",
    period: { active: false, flow: 0, cramps: 0, pms: false },
    body: {
      temp: 36.85, tempTime: "07:05",
      cervicalMucusLevel: "dry", cervicalMucusType: "sticky",
      lhPeak: null, lhTime: null,
      cervixLevel: "low / closed / tonic (nose tip)",
      breastPain: 3, breastSize: 3, nippleChange: 3,
      libido: 2, mood: 6, creativeEnergy: 3, sleep: 3
    },
    poops: [{ colour: "dark", size: "pebble", density: "dense" }],
    fasting: { active: true, startTime: null, endTime: "11:30" },
    tags: { symptoms: ["bloating", "fatigue"], herbs: ["ashwagandha", "vitex"], activities: ["meditation"] },
    plantMedicine: [{ name: "Vitex", quantity: "20 drops" }],
    notes: "Full moon last night. Slept badly. Broke fast at 11:30.",
    cosmos: { moonPhase: 0.65, moonName: "Full Moon", season: "Summer", daylightHours: 14.3 }
  },
  "2026-07-31": {
    date: "2026-07-31",
    period: { active: false, flow: 0, cramps: 0, pms: false },
    body: {
      temp: 36.83, tempTime: "07:20",
      cervicalMucusLevel: "dry", cervicalMucusType: "sticky",
      lhPeak: null, lhTime: null,
      cervixLevel: "low / closed / tonic (nose tip)",
      breastPain: 3, breastSize: 3, nippleChange: 3,
      libido: 2, mood: 5, creativeEnergy: 2, sleep: 3
    },
    poops: [{ colour: "dark", size: "small", density: "rock" }],
    fasting: { active: false, startTime: null, endTime: null },
    tags: { symptoms: ["bloating", "fatigue", "headache"], herbs: ["ashwagandha"], activities: [] },
    plantMedicine: [{ name: "Vitex", quantity: "20 drops" }],
    notes: "Headache and heavy energy. Very introverted today.",
    cosmos: { moonPhase: 0.71, moonName: "Waning Gibbous", season: "Summer", daylightHours: 14.2 }
  },
  "2026-08-01": {
    date: "2026-08-01",
    period: { active: false, flow: 0, cramps: 0, pms: true },
    body: {
      temp: 36.80, tempTime: "07:15",
      cervicalMucusLevel: "dry", cervicalMucusType: "sticky",
      lhPeak: null, lhTime: null,
      cervixLevel: "low / closed / tonic (nose tip)",
      breastPain: 4, breastSize: 4, nippleChange: 4,
      libido: 1, mood: 4, creativeEnergy: 2, sleep: 2
    },
    poops: [{ colour: "dark", size: "pebble", density: "dense" }],
    fasting: { active: false, startTime: null, endTime: null },
    tags: { symptoms: ["pms", "bloating", "irritability", "anxiety"], herbs: ["ashwagandha"], activities: [] },
    plantMedicine: [{ name: "Vitex", quantity: "20 drops" }],
    notes: "PMS in full force. Breasts really sore. Anxious and irritable.",
    cosmos: { moonPhase: 0.76, moonName: "Waning Gibbous", season: "Summer", daylightHours: 14.1 }
  },
  "2026-08-02": {
    date: "2026-08-02",
    period: { active: false, flow: 0, cramps: 0, pms: true },
    body: {
      temp: 36.77, tempTime: "07:10",
      cervicalMucusLevel: "dry", cervicalMucusType: "sticky",
      lhPeak: null, lhTime: null,
      cervixLevel: "low / closed / tonic (nose tip)",
      breastPain: 4, breastSize: 4, nippleChange: 4,
      libido: 1, mood: 3, creativeEnergy: 1, sleep: 2
    },
    poops: [{ colour: "normal", size: "pebble", density: "dense" }],
    fasting: { active: false, startTime: null, endTime: null },
    tags: { symptoms: ["pms", "cramps", "bloating", "irritability", "fatigue"], herbs: ["raspberry leaf", "ashwagandha"], activities: [] },
    plantMedicine: [{ name: "Vitex", quantity: "20 drops" }],
    notes: "Cramping starting. Period due tomorrow. Exhausted.",
    cosmos: { moonPhase: 0.81, moonName: "Waning Gibbous", season: "Summer", daylightHours: 14.0 }
  },
  "2026-08-03": {
    date: "2026-08-03",
    period: { active: true, flow: 3, cramps: 3, pms: false },
    body: {
      temp: 36.29, tempTime: "07:00",
      cervicalMucusLevel: "dry", cervicalMucusType: "sticky",
      lhPeak: null, lhTime: null,
      cervixLevel: "low / closed / tonic (nose tip)",
      breastPain: 2, breastSize: 2, nippleChange: 2,
      libido: 1, mood: 4, creativeEnergy: 1, sleep: 3
    },
    poops: [{ colour: "dark", size: "medium", density: "soft" }],
    fasting: { active: false, startTime: null, endTime: null },
    tags: { symptoms: ["cramps", "fatigue", "bloating"], herbs: ["raspberry leaf"], activities: [] },
    plantMedicine: [{ name: "Vitex", quantity: "20 drops" }],
    notes: "New cycle begins. BBT dropped overnight. Here we go again.",
    cosmos: { moonPhase: 0.86, moonName: "Waning Gibbous", season: "Summer", daylightHours: 13.9 }
  }
};

localStorage.setItem('fyr_entries', JSON.stringify(entries));
console.log('✓ Seeded', Object.keys(entries).length, 'entries. Refresh the page.');
