// Multi-select chip component
// options: [{ value, label }]
// value: string[] of selected values
// onChange: (newValue: string[]) => void

export default function ChipSelect({ options, value = [], onChange }) {
  const toggle = v => {
    if (value.includes(v)) {
      onChange(value.filter(x => x !== v));
    } else {
      onChange([...value, v]);
    }
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(o => {
        const selected = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            style={{
              padding: '7px 14px',
              border: selected ? '1.5px solid var(--fhq-graphite)' : '1.5px solid var(--fhq-border)',
              borderRadius: 100,
              background: selected ? 'var(--fhq-signal-lime)' : 'var(--fhq-surface)',
              color: selected ? 'var(--fhq-graphite)' : 'var(--fhq-text-muted)',
              fontSize: 13,
              fontWeight: selected ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.12s ease',
              fontFamily: 'var(--fhq-font-sans)',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
