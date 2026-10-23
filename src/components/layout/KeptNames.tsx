interface KeptNamesProps {
  names: string[];
  message: string;
  onRemove: (name: string) => void;
  onCopy: () => void;
  onClear: () => void;
}

/** The sticky ledger of kept names, with copy and clear. */
export function KeptNames({ names, message, onRemove, onCopy, onClear }: KeptNamesProps) {
  return (
    <aside className="ledger">
      <h2>
        Kept names <small>{names.length || ''}</small>
      </h2>
      <ul className="favs">
        {names.length === 0 ? (
          <li className="empty">Nothing kept yet.</li>
        ) : (
          names.map((name) => (
            <li key={name}>
              <span>{name}</span>
              <button type="button" className="rm" aria-label={`Remove ${name}`} onClick={() => onRemove(name)}>
                {'×'}
              </button>
            </li>
          ))
        )}
      </ul>
      <div className="actions">
        <button type="button" className="btn" onClick={onCopy}>
          Copy all
        </button>
        <button type="button" className="btn quiet" onClick={onClear}>
          Clear
        </button>
      </div>
      <div className="toast" aria-live="polite">
        {message}
      </div>
    </aside>
  );
}
