import { useRef, useEffect } from 'react';
import { useEntries } from '../hooks/useEntries';
import { getSettings } from '../utils/storage';
import { getCosmosForDate, getMoonPhase, LUNAR_CYCLE } from '../utils/cosmos';
import { detectCyclePhase, getCyclePhaseColor, findPeriodStarts, estimateCycleLength } from '../utils/cycle';

const LUNAR_DAYS = LUNAR_CYCLE;

function polarToXY(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function LunarWheel() {
  const canvasRef = useRef(null);
  const { entries } = useEntries();
  const settings = getSettings();

  const allEntries = Object.values(entries).sort((a, b) => a.date.localeCompare(b.date));
  const periodDates = allEntries.filter(e => e.period?.active).map(e => e.date).sort();
  const starts = findPeriodStarts(periodDates);
  const cycleLen = estimateCycleLength(starts);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = Math.min(window.innerWidth - 32, 360);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const cx = size / 2;
    const cy = size / 2;
    const R = size / 2 - 10;

    ctx.clearRect(0, 0, size, size);

    // --- Outer ring: Lunar cycle (29.53 days) ---
    const lunarColors = [
      '#1a0a2e', '#2d1b5e', '#3d2680', '#4a2f9e',
      '#7b5ea7', '#9b7ec8', '#bfa3e8', '#f0e6ff',
      '#e8d5ff', '#c5a8f0', '#9b7ec8', '#7b5ea7',
      '#4a2f9e', '#3d2680', '#2d1b5e',
    ];

    for (let day = 0; day < LUNAR_DAYS; day++) {
      const startAngle = ((day / LUNAR_DAYS) * 360 - 90) * (Math.PI / 180);
      const endAngle = (((day + 1) / LUNAR_DAYS) * 360 - 90) * (Math.PI / 180);
      const t = day / LUNAR_DAYS;
      // Fade: dark at 0, bright at 0.5 (full moon), dark again
      const brightness = Math.sin(t * Math.PI);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, startAngle, endAngle);
      ctx.closePath();
      const alpha = 0.3 + brightness * 0.5;
      ctx.fillStyle = `rgba(180, 140, 255, ${alpha})`;
      ctx.fill();
    }

    // Outer ring border
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(180,140,255,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // --- Middle ring: Menstrual cycle phases ---
    const innerR = R * 0.62;
    const outerR2 = R * 0.88;
    const phases = [
      { name: 'menstrual', days: 5, color: '#c2185b' },
      { name: 'follicular', days: 9, color: '#7b5ea7' },
      { name: 'ovulation', days: 3, color: '#e91e8c' },
      { name: 'luteal', days: cycleLen - 17, color: '#5c4a7f' },
    ];

    let cumDays = 0;
    phases.forEach(p => {
      const startAngle = ((cumDays / cycleLen) * 360 - 90) * (Math.PI / 180);
      const endAngle = (((cumDays + p.days) / cycleLen) * 360 - 90) * (Math.PI / 180);
      ctx.beginPath();
      ctx.arc(cx, cy, outerR2, startAngle, endAngle);
      ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = p.color + 'cc';
      ctx.fill();
      cumDays += p.days;
    });

    // --- Inner circle: today's moon + dots for logged days ---
    ctx.beginPath();
    ctx.arc(cx, cy, innerR - 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#1a0d2e';
    ctx.fill();

    // Plot logged entries as dots on the lunar wheel
    const last60 = allEntries.slice(-60);
    last60.forEach(e => {
      const cosmos = getCosmosForDate(e.date, settings.hemisphere, settings.latitude);
      const moonAngle = (cosmos.moonPhase / LUNAR_DAYS) * 360;
      const dotR = innerR * 0.7;
      const pos = polarToXY(cx, cy, dotR, moonAngle);
      const phase = detectCyclePhase(e.date, entries);
      const color = getCyclePhaseColor(phase) || '#9b7ec8';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Today marker
    const todayStr = new Date().toISOString().split('T')[0];
    const todayPhase = getMoonPhase(todayStr);
    const todayAngle = (todayPhase / LUNAR_DAYS) * 360;
    const todayPos = polarToXY(cx, cy, innerR * 0.85, todayAngle);
    ctx.beginPath();
    ctx.arc(todayPos.x, todayPos.y, 7, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(todayPos.x, todayPos.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#e91e8c';
    ctx.fill();

    // Center moon symbol
    ctx.font = `${innerR * 0.45}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('☽', cx, cy);

    // Phase labels around middle ring
    cumDays = 0;
    ctx.font = `bold ${size * 0.03}px sans-serif`;
    ctx.fillStyle = '#f0e6ff';
    phases.forEach(p => {
      const midAngle = ((cumDays + p.days / 2) / cycleLen) * 360;
      const labelPos = polarToXY(cx, cy, (innerR + outerR2) / 2, midAngle);
      ctx.save();
      ctx.translate(labelPos.x, labelPos.y);
      ctx.rotate(((midAngle - 90) * Math.PI) / 180);
      ctx.fillText(p.name.slice(0, 3).toUpperCase(), 0, 0);
      ctx.restore();
      cumDays += p.days;
    });

  }, [entries, cycleLen]);

  return (
    <div className="screen wheel-screen">
      <header className="screen-header">
        <h2>Lunar Wheel</h2>
        <p className="subtitle">Your menstrual cycle overlaid on the lunar cycle</p>
      </header>

      <div className="wheel-container">
        <canvas ref={canvasRef} className="lunar-canvas" />
      </div>

      <div className="wheel-legend">
        <div className="legend-row">
          <span className="legend-ring outer" /> Lunar cycle (29.5 days)
        </div>
        <div className="legend-row">
          <span className="legend-ring middle" /> Menstrual phases
        </div>
        <div className="legend-row">
          <span className="dot-today" /> Today
        </div>
        <div className="legend-row">
          <span className="dot-entry" /> Logged days (last 60)
        </div>
      </div>
    </div>
  );
}
