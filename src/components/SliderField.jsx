export default function SliderField({ label, value, onChange, min = 0, max = 4, step = 1, labels }) {
  const pct = ((value - min) / (max - min)) * 100;
  const currentLabel = labels ? labels[value - min] : null;
  const manyLabels = labels && labels.length > 5;
  const showLabelBar = labels && !manyLabels;

  return (
    <div className="slider-field">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">{value}</span>
      </div>
      <div className="slider-track-wrap">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ '--pct': `${pct}%` }}
        />
        {showLabelBar && (
          <div className="slider-labels">
            {labels.map((l, i) => <span key={i}>{l}</span>)}
          </div>
        )}
        {manyLabels && currentLabel && (
          <span className="slider-word-label">{currentLabel}</span>
        )}
      </div>
    </div>
  );
}
