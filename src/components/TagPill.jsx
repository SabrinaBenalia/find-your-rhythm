export default function TagPill({ label, active, onClick, onRemove }) {
  return (
    <button
      className={`tag-pill ${active ? 'active' : ''}`}
      onClick={onClick}
      type="button"
    >
      {label}
      {onRemove && (
        <span className="tag-pill-remove" onClick={e => { e.stopPropagation(); onRemove(); }}>×</span>
      )}
    </button>
  );
}
