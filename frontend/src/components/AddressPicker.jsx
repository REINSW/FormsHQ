import { useState, useEffect, useRef } from 'react';

// Uses OpenStreetMap Nominatim — free, no API key required
// Searches Australian addresses only

export default function AddressPicker({ value, onChange, placeholder = 'Start typing an address…' }) {
  const [query, setQuery] = useState(value?.street || value?.formatted || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);
  const selectedRef = useRef(false); // track whether user picked from dropdown

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = q => {
    if (q.length < 4) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=au&format=json&addressdetails=1&limit=6`, {
      headers: { 'Accept-Language': 'en' }
    })
      .then(r => r.json())
      .then(data => {
        const results = data.map(item => {
          const a = item.address;
          const street = [a.house_number, a.road].filter(Boolean).join(' ');
          const suburb = a.suburb || a.town || a.city_district || a.city || '';
          const state = normaliseState(a.state);
          const postcode = a.postcode || '';
          return {
            formatted: item.display_name.split(', Australia')[0],
            street,
            suburb,
            state,
            postcode,
          };
        }).filter(r => r.street);
        setSuggestions(results);
        setOpen(results.length > 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleInput = e => {
    const q = e.target.value;
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 350);
  };

  const select = suggestion => {
    // Show full address in the box so user can see what was selected
    setQuery(`${suggestion.street}, ${suggestion.suburb} ${suggestion.state} ${suggestion.postcode}`.trim());
    setSuggestions([]);
    setOpen(false);
    selectedRef.current = true;
    onChange(suggestion);
  };

  const handleManual = e => {
    const q = e.target.value;
    setQuery(q);
    selectedRef.current = false; // user is typing again — clear selection lock
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 350);
    // Only propagate to parent on blur (see handleBlur) to avoid clearing suburb/state mid-type
  };

  const handleBlur = () => {
    // If user typed but never selected a suggestion, propagate what they typed as the street
    if (!selectedRef.current && query) {
      onChange({ formatted: query, street: query, suburb: '', state: 'NSW', postcode: '' });
    }
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          className="input"
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleManual}
          onBlur={handleBlur}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {loading && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
            <div className="spinner" style={{ width: 14, height: 14, borderWidth: 1.5 }} />
          </div>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#fff', border: '1px solid var(--fhq-border)',
          borderRadius: 'var(--fhq-radius-sm)', boxShadow: 'var(--fhq-shadow-md)',
          zIndex: 100, maxHeight: 260, overflowY: 'auto',
        }}>
          {suggestions.map((s, i) => (
            <button key={i} type="button"
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 14px', border: 'none', background: 'none',
                cursor: 'pointer', fontSize: 13, borderBottom: i < suggestions.length - 1 ? '1px solid var(--fhq-border)' : 'none',
                color: 'var(--fhq-text)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--fhq-bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
              onClick={() => select(s)}>
              <div style={{ fontWeight: 600 }}>{s.street}</div>
              <div style={{ color: 'var(--fhq-text-muted)', fontSize: 12 }}>
                {[s.suburb, s.state, s.postcode].filter(Boolean).join(' ')}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function normaliseState(raw = '') {
  const map = {
    'new south wales': 'NSW', 'victoria': 'VIC', 'queensland': 'QLD',
    'western australia': 'WA', 'south australia': 'SA', 'tasmania': 'TAS',
    'australian capital territory': 'ACT', 'northern territory': 'NT',
  };
  return map[raw.toLowerCase()] || raw.toUpperCase().substring(0, 3) || 'NSW';
}
