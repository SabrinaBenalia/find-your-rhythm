export default function SliderField({ label, value, onChange, min = 0, max = 4, step = 1, labels }) {
  const isSet = value !== null && value !== undefined;
  const displayValue = isSet ? value : min;
  const pct = ((displayValue - min) / (max - min)) * 100;
  const currentLabel = labels ? labels[displayValue - min] : null;
  const manyLabels = labels && labels.length > 5;
  const showLabelBar = labels && !manyLabels;

  return (
    <div className={`slider-field${!isSet ? ' slider-unset' : ''}`}>
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">
          {isSet ? value : '—'}
          {isSet && (
            <button className="slider-clear" type="button" onClick={() => onChange(null)}>×</button>
          )}
        </span>
      </div>
      <div className="slider-track-wrap">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={displayValue}
          onChange={e => onChange(Number(e.target.value))}
          style={{ '--pct': `${pct}%` }}
        />
        {showLabelBar && (
          <div className="slider-labels">
            {labels.map((l, i) => <span key={i}>{l}</span>)}
          </div>
        )}
        {manyLabels && currentLabel && isSet && (
          <span className="slider-word-label">{currentLabel}</span>
        )}
      </div>
    </div>
  );
}
