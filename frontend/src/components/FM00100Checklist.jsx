/**
 * FM00100Checklist
 *
 * Shows completion status for FM00100 — which sections are done, which
 * still need attention, and who is responsible for filling them in.
 *
 * Usage:
 *   <FM00100Checklist data={form_data} onGoToWizard={() => setActiveTab('wizard')} />
 *   <FM00100Checklist data={form_data} compact />   ← small banner for top of preview
 */

// ── Section definitions ───────────────────────────────────────────────────────
// Each field has a primary `key` (canonical v4) and optional `alt` keys
// to handle older key names that may still be in form_data.

const SECTIONS = [
  {
    id: 'owner',
    title: 'Owner / Principal',
    icon: '👤',
    source: 'intake',
    sourceLabel: 'Pre-filled from intake',
    wizardStep: 0,
    fields: [
      { label: 'Owner name',    keys: ['party_0__name_full',      'party_0__full_name',       'party_0__trading_as', 'party_0__company_name'] },
      { label: 'Email',         keys: ['party_0__email'] },
      { label: 'Mobile',        keys: ['party_0__mobile',         'party_0__phone_mobile'] },
      { label: 'Postal address',keys: ['party_0__address_street', 'party_0__address'] },
    ],
  },
  {
    id: 'property',
    title: 'Property',
    icon: '🏠',
    source: 'intake',
    sourceLabel: 'Pre-filled from intake',
    wizardStep: 1,
    fields: [
      { label: 'Street address', keys: ['property__address_street', 'property__street_address'] },
      { label: 'Suburb',         keys: ['property__address_suburb', 'property__suburb'] },
      { label: 'Property type',  keys: ['property__type'] },
    ],
  },
  {
    id: 'agent',
    title: 'Agent & Agency',
    icon: '🏢',
    source: 'profile',
    sourceLabel: 'From agency profile',
    wizardStep: 5,
    fields: [
      { label: 'Agency name',    keys: ['agent__name', 'agent__trading_as'] },
      { label: 'Licence no.',    keys: ['agent__licence_no'] },
    ],
  },
  {
    id: 'agreement',
    title: 'Agreement Terms',
    icon: '📋',
    source: 'agent',
    sourceLabel: 'Agent to complete',
    wizardStep: 2,
    fields: [
      { label: 'Commencement date',    keys: ['management_authority__start_date', 'agreement__start_date'] },
      { label: 'Termination notice',   keys: ['management_authority__termination_notice_days', 'agreement__termination_days'] },
    ],
  },
  {
    id: 'leasing',
    title: 'Rent & Leasing',
    icon: '💰',
    source: 'confirm',
    sourceLabel: 'Confirm with owner',
    wizardStep: 2,
    fields: [
      { label: 'Agreed rent amount', keys: ['management_authority__rent_amount', 'leasing__rent_amount'] },
      { label: 'Rent period',        keys: ['management_authority__rent_period',  'leasing__rent_period'] },
    ],
  },
  {
    id: 'fees',
    title: 'Fees & Remuneration',
    icon: '%',
    source: 'agent',
    sourceLabel: 'Agent to confirm',
    wizardStep: 2,
    fields: [
      { label: 'Management fee %', keys: ['fees__management_percent', 'fees__management_pct'] },
      { label: 'Letting fee',      keys: ['fees__letting_fee_weeks',  'fees__letting_fee'] },
    ],
  },
  {
    id: 'disclosures',
    title: 'Material Fact Disclosures',
    icon: '⚠',
    source: 'agent',
    sourceLabel: 'Agent must complete — legal requirement',
    wizardStep: 4,
    fields: [
      { label: 'Flooding / bushfire',     keys: ['disclosure__flooding_bushfire',           'disclosure__flooding'] },
      { label: 'Health & safety risks',   keys: ['disclosure__health_safety_risks',         'disclosure__health_safety'] },
      { label: 'Serious crime',           keys: ['disclosure__murder_manslaughter',         'disclosure__violent_crime'] },
      { label: 'Loose-fill asbestos',     keys: ['disclosure__loose_fill_asbestos',         'disclosure__asbestos'] },
      { label: 'Drug manufacture',        keys: ['disclosure__prohibited_drug'] },
      { label: 'Combustible cladding',    keys: ['disclosure__combustible_cladding_order',  'disclosure__cladding'] },
    ],
  },
  {
    id: 'bank',
    title: 'Owner Bank Account',
    icon: '🏦',
    source: 'intake',
    sourceLabel: 'Pre-filled from intake',
    wizardStep: 5,
    fields: [
      { label: 'Account name', keys: ['owner_bank__account_name'] },
      { label: 'BSB',          keys: ['owner_bank__bsb'] },
      { label: 'Account no.',  keys: ['owner_bank__account_no'] },
    ],
  },
  {
    id: 'trust',
    title: 'Agency Trust Account',
    icon: '🏛',
    source: 'profile',
    sourceLabel: 'From agency profile',
    wizardStep: 5,
    fields: [
      { label: 'Trust account name', keys: ['trust__account_name', 'management_authority__trust_account_name'] },
      { label: 'Trust BSB',          keys: ['trust__bsb',          'management_authority__trust_bsb'] },
      { label: 'Trust account no.',  keys: ['trust__account_no',   'management_authority__trust_account_no'] },
    ],
  },
];

// ── Source badge styling ───────────────────────────────────────────────────────
const SOURCE_STYLE = {
  intake:  { bg: '#dbeafe', color: '#1d4ed8', label: 'Intake' },
  profile: { bg: '#f3f4f6', color: '#4b5563', label: 'Profile' },
  agent:   { bg: '#fef3c7', color: '#92400e', label: 'Agent' },
  confirm: { bg: '#ede9fe', color: '#5b21b6', label: 'Confirm' },
};

// ── Helper: check if a field has a value ──────────────────────────────────────
function hasValue(data, keys) {
  return keys.some(k => {
    const v = data[k];
    return v !== undefined && v !== null && v !== '' && v !== false;
  });
}

// ── Main computation ──────────────────────────────────────────────────────────
export function computeCompletion(data = {}) {
  const sections = SECTIONS.map(section => {
    const fieldResults = section.fields.map(f => ({
      label: f.label,
      filled: hasValue(data, f.keys),
    }));
    const filled = fieldResults.filter(f => f.filled).length;
    const total  = fieldResults.length;
    const missing = fieldResults.filter(f => !f.filled).map(f => f.label);
    return {
      ...section,
      fieldResults,
      filled,
      total,
      missing,
      complete: filled === total,
    };
  });

  const totalRequired = sections.reduce((a, s) => a + s.total, 0);
  const totalFilled   = sections.reduce((a, s) => a + s.filled, 0);
  const percent       = Math.round((totalFilled / totalRequired) * 100);
  const incompleteSections = sections.filter(s => !s.complete);

  return { sections, totalRequired, totalFilled, percent, incompleteSections };
}

// ── Full checklist card ───────────────────────────────────────────────────────
export default function FM00100Checklist({ data = {}, onGoToWizard }) {
  const { sections, totalFilled, totalRequired, percent, incompleteSections } = computeCompletion(data);

  const allDone = incompleteSections.length === 0;

  return (
    <div style={{
      background: 'var(--fhq-surface)',
      border: '1px solid var(--fhq-border)',
      borderRadius: 'var(--fhq-radius-md)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--fhq-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Form Completion</div>
          <div style={{ fontSize: 12, color: 'var(--fhq-text-muted)', marginTop: 2 }}>
            {totalFilled} of {totalRequired} fields complete
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* Percent ring */}
          <div style={{ position: 'relative', width: 48, height: 48 }}>
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="var(--fhq-border)" strokeWidth="4" />
              <circle cx="24" cy="24" r="20" fill="none"
                stroke={allDone ? '#22c55e' : percent >= 60 ? '#b7ff4a' : '#f59e0b'}
                strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - percent / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 24 24)"
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: 'var(--fhq-text)',
            }}>{percent}%</div>
          </div>
          {onGoToWizard && !allDone && (
            <button className="btn btn-primary btn-sm" onClick={onGoToWizard}>
              Complete in wizard →
            </button>
          )}
          {allDone && (
            <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>✓ Ready to send</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--fhq-border)' }}>
        <div style={{
          height: '100%',
          width: `${percent}%`,
          background: allDone ? '#22c55e' : percent >= 60 ? 'var(--fhq-signal-lime)' : '#f59e0b',
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Section list */}
      <div style={{ padding: '8px 0' }}>
        {sections.map(section => {
          const src = SOURCE_STYLE[section.source] || SOURCE_STYLE.agent;
          return (
            <div key={section.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '10px 20px',
              borderBottom: '1px solid var(--fhq-border)',
              opacity: section.complete ? 0.8 : 1,
            }}>
              {/* Status dot */}
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: section.complete ? '#22c55e' : section.filled > 0 ? '#f59e0b' : 'var(--fhq-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, color: section.complete ? '#fff' : section.filled > 0 ? '#fff' : 'var(--fhq-text-muted)',
                marginTop: 1,
              }}>
                {section.complete ? '✓' : section.filled > 0 ? '~' : '○'}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{section.title}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                    background: src.bg, color: src.color,
                  }}>{src.label}</span>
                  {!section.complete && (
                    <span style={{ fontSize: 11, color: 'var(--fhq-text-muted)' }}>
                      {section.filled}/{section.total}
                    </span>
                  )}
                </div>

                {/* Missing fields */}
                {!section.complete && section.missing.length > 0 && (
                  <div style={{ marginTop: 5, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {section.missing.map(m => (
                      <span key={m} style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 99,
                        background: '#fef2f2', color: '#991b1b',
                        border: '1px solid #fecaca',
                      }}>
                        {m}
                      </span>
                    ))}
                  </div>
                )}

                {/* Source hint for incomplete agent-required sections */}
                {!section.complete && section.source === 'agent' && (
                  <div style={{ fontSize: 11, color: 'var(--fhq-text-muted)', marginTop: 3 }}>
                    {section.sourceLabel}
                  </div>
                )}
                {!section.complete && section.source === 'intake' && (
                  <div style={{ fontSize: 11, color: '#1d4ed8', marginTop: 3 }}>
                    {section.sourceLabel}
                  </div>
                )}
              </div>

              {/* Wizard link */}
              {!section.complete && onGoToWizard && section.wizardStep !== null && (
                <button onClick={onGoToWizard} style={{
                  flexShrink: 0, background: 'none', border: 'none',
                  fontSize: 12, color: 'var(--fhq-text-muted)', cursor: 'pointer',
                  padding: '2px 6px',
                }}>Fill →</button>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer summary */}
      {!allDone && (
        <div style={{
          padding: '12px 20px',
          fontSize: 12, color: 'var(--fhq-text-muted)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>
            {incompleteSections.filter(s => s.source === 'agent').length > 0 && (
              <>
                <span style={{ color: '#92400e', fontWeight: 600 }}>
                  {incompleteSections.filter(s => s.source === 'agent' || s.source === 'confirm').length} section{incompleteSections.filter(s => s.source === 'agent' || s.source === 'confirm').length !== 1 ? 's' : ''} need the agent to complete
                </span>
              </>
            )}
          </span>
          {incompleteSections.filter(s => s.source === 'intake' || s.source === 'profile').length > 0 && (
            <span style={{ color: '#1d4ed8', fontWeight: 600 }}>
              {incompleteSections.filter(s => s.source === 'intake' || s.source === 'profile').length} pre-fill section{incompleteSections.filter(s => s.source === 'intake' || s.source === 'profile').length !== 1 ? 's' : ''} incomplete
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Compact banner (for top of preview / Preview & Sign step) ─────────────────
export function FM00100CompletionBanner({ data = {}, onGoToWizard }) {
  const { percent, incompleteSections, totalFilled, totalRequired } = computeCompletion(data);
  const allDone = incompleteSections.length === 0;

  if (allDone) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px', marginBottom: 12,
        background: '#f0fdf4', border: '1px solid #bbf7d0',
        borderRadius: 8, fontSize: 13,
      }}>
        <span style={{ color: '#16a34a', fontSize: 16 }}>✓</span>
        <span style={{ fontWeight: 600, color: '#15803d' }}>All sections complete — ready to send for signing</span>
      </div>
    );
  }

  const agentItems  = incompleteSections.filter(s => s.source === 'agent' || s.source === 'confirm');
  const intakeItems = incompleteSections.filter(s => s.source === 'intake' || s.source === 'profile');

  return (
    <div style={{
      padding: '12px 16px', marginBottom: 12,
      background: '#fffbeb', border: '1px solid #fde68a',
      borderRadius: 8,
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14 }}>⚠</span>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
              {totalFilled} of {totalRequired} fields complete ({percent}%)
            </span>
            <span style={{ fontSize: 12, color: '#b45309', marginLeft: 8 }}>
              {incompleteSections.length} section{incompleteSections.length !== 1 ? 's' : ''} need attention
            </span>
          </div>
        </div>
        {onGoToWizard && (
          <button onClick={onGoToWizard} style={{
            flexShrink: 0, fontSize: 12, fontWeight: 600,
            padding: '5px 12px', borderRadius: 6,
            background: '#fef3c7', border: '1px solid #fcd34d',
            color: '#92400e', cursor: 'pointer',
          }}>
            Open wizard →
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: '#fde68a', borderRadius: 99, marginTop: 10 }}>
        <div style={{
          height: '100%', borderRadius: 99,
          width: `${percent}%`,
          background: percent >= 80 ? '#b7ff4a' : '#f59e0b',
          transition: 'width 0.4s',
        }} />
      </div>

      {/* Missing sections list */}
      {incompleteSections.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {agentItems.map(s => (
            <span key={s.id} style={{
              fontSize: 11, padding: '2px 9px', borderRadius: 99,
              background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', fontWeight: 600,
            }}>
              {s.title}: {s.missing.join(', ')}
            </span>
          ))}
          {intakeItems.map(s => (
            <span key={s.id} style={{
              fontSize: 11, padding: '2px 9px', borderRadius: 99,
              background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
            }}>
              {s.title}: {s.missing.join(', ')}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
