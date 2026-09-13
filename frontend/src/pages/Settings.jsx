import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';

const TABS = [
  { id: 'agency',    label: 'Agency Profile' },
  { id: 'fees',      label: 'Default Fees' },
  { id: 'trust',     label: 'Trust Account' },
  { id: 'agent',     label: 'My Profile' },
];

const FIELD = ({ label, hint, children, required }) => (
  <div className="field">
    <label>
      {label}
      {required && <span style={{ color: 'var(--fhq-error)', marginLeft: 3 }}>*</span>}
    </label>
    {children}
    {hint && <div style={{ fontSize: 11, color: 'var(--fhq-text-muted)', marginTop: 3 }}>{hint}</div>}
  </div>
);

export default function Settings() {
  const { tab: tabParam } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(tabParam || 'agency');

  const [agency, setAgency]     = useState(null);
  const [agentProfile, setAgentProfile] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/v1/settings/agency'),
      api.get('/v1/settings/agent'),
    ]).then(([agencyRes, agentRes]) => {
      setAgency(agencyRes.data);
      setAgentProfile(agentRes.data);
    }).catch(e => setError(e.response?.data?.error || 'Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setAgency(a => ({ ...a, [k]: v }));

  const handleSave = async () => {
    setSaving(true); setSaved(false); setError('');
    try {
      const res = await api.patch('/v1/settings/agency', agency);
      setAgency(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const switchTab = (id) => {
    setActiveTab(id);
    navigate(`/settings/${id}`, { replace: true });
    setSaved(false); setError('');
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p style={{ fontSize: 13, color: 'var(--fhq-text-muted)', marginTop: 2 }}>
            Agency profile and defaults that pre-fill into every FM00100
          </p>
        </div>
        {activeTab !== 'agent' && (
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !agency}>
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ background: 'var(--fhq-surface)', borderBottom: '1px solid var(--fhq-border)', padding: '0 32px', display: 'flex', gap: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => switchTab(t.id)} style={{
            padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: activeTab === t.id ? 700 : 500,
            color: activeTab === t.id ? 'var(--fhq-text)' : 'var(--fhq-text-muted)',
            borderBottom: activeTab === t.id ? '2px solid var(--fhq-graphite)' : '2px solid transparent',
          }}>{t.label}</button>
        ))}
      </div>

      <div className="page-body" style={{ maxWidth: 720 }}>
        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
        {saved && <div className="alert alert-success" style={{ marginBottom: 16 }}>✓ Settings saved — new transactions will use these values</div>}

        {activeTab === 'agency' && agency && (
          <AgencyTab agency={agency} set={set} user={user} />
        )}
        {activeTab === 'fees' && agency && (
          <FeesTab agency={agency} set={set} />
        )}
        {activeTab === 'trust' && agency && (
          <TrustTab agency={agency} set={set} />
        )}
        {activeTab === 'agent' && agentProfile && (
          <AgentTab profile={agentProfile} />
        )}
      </div>
    </>
  );
}

// ── Agency Profile Tab ────────────────────────────────────────────────────────

function AgencyTab({ agency, set }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <InfoBanner
        title="Who fills this in?"
        text="These details appear printed in the FM00100 as the Agent / Licensee. They pre-fill automatically into every new transaction — agents never need to type them manually."
        source="Agency account"
      />

      <Section title="Agency Identity">
        <div className="grid-2">
          <FIELD label="Registered Name" required>
            <input className="input" value={agency.name || ''} onChange={e => set('name', e.target.value)} />
          </FIELD>
          <FIELD label="Trading As / Brand Name">
            <input className="input" value={agency.trading_as || ''} placeholder="e.g. Demo PM"
              onChange={e => set('trading_as', e.target.value)} />
          </FIELD>
        </div>
        <div className="grid-2">
          <FIELD label="Real Estate Licence No." required hint="Corporation licence number (not individual)">
            <input className="input" value={agency.licence_no || ''} placeholder="1234567"
              onChange={e => set('licence_no', e.target.value)} />
          </FIELD>
          <FIELD label="ABN">
            <input className="input" value={agency.abn || ''} placeholder="12 345 678 901"
              onChange={e => set('abn', e.target.value)} />
          </FIELD>
        </div>
      </Section>

      <Section title="Contact Details">
        <FIELD label="Office Address">
          <input className="input" value={agency.address || ''} placeholder="Level 1, 123 Pitt Street"
            onChange={e => set('address', e.target.value)} />
        </FIELD>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
          <FIELD label="Suburb">
            <input className="input" value={agency.suburb || ''} onChange={e => set('suburb', e.target.value)} />
          </FIELD>
          <FIELD label="State">
            <select className="select" value={agency.state || 'NSW'} onChange={e => set('state', e.target.value)}>
              {['NSW','VIC','QLD','WA','SA','TAS','ACT','NT'].map(s => <option key={s}>{s}</option>)}
            </select>
          </FIELD>
          <FIELD label="Postcode">
            <input className="input" value={agency.postcode || ''} placeholder="2000"
              onChange={e => set('postcode', e.target.value)} />
          </FIELD>
        </div>
        <div className="grid-2">
          <FIELD label="Office Phone">
            <input className="input" value={agency.phone_work || ''} placeholder="02 9000 0001"
              onChange={e => set('phone_work', e.target.value)} />
          </FIELD>
          <FIELD label="Mobile">
            <input className="input" value={agency.phone_mobile || ''} placeholder="0400 000 000"
              onChange={e => set('phone_mobile', e.target.value)} />
          </FIELD>
        </div>
        <div className="grid-2">
          <FIELD label="Email">
            <input className="input" type="email" value={agency.email || ''}
              onChange={e => set('email', e.target.value)} />
          </FIELD>
          <FIELD label="Website">
            <input className="input" value={agency.website || ''} placeholder="www.demopm.com.au"
              onChange={e => set('website', e.target.value)} />
          </FIELD>
        </div>
      </Section>
    </div>
  );
}

// ── Default Fees Tab ──────────────────────────────────────────────────────────

function FeesTab({ agency, set }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <InfoBanner
        title="Default fees"
        text="These are your agency's standard fee schedule. They pre-fill into every new FM00100 — the agent can adjust them per transaction in the wizard if needed."
        source="Agency account"
      />

      <Section title="Remuneration (Clause 7)">
        <div className="grid-2">
          <FIELD label="Management Fee (%)" hint="e.g. 8.8 for 8.8% incl. GST">
            <input className="input" type="number" step="0.1" min="0" max="20"
              value={agency.default_management_fee_pct || ''}
              placeholder="8.80"
              onChange={e => set('default_management_fee_pct', e.target.value)} />
          </FIELD>
          <FIELD label="Letting Fee" hint="e.g. '1 weeks rent + GST' or '1.1'">
            <input className="input" value={agency.default_letting_fee || ''}
              placeholder="1 weeks rent + GST"
              onChange={e => set('default_letting_fee', e.target.value)} />
          </FIELD>
        </div>
        <div className="grid-2">
          <FIELD label="Admin / Sundry Fee ($ per month)">
            <input className="input" type="number" step="0.01" min="0"
              value={agency.default_admin_fee || ''}
              placeholder="15.00"
              onChange={e => set('default_admin_fee', e.target.value)} />
          </FIELD>
          <FIELD label="Lease Renewal Fee ($)">
            <input className="input" type="number" step="0.01" min="0"
              value={agency.default_lease_renewal_fee || ''}
              placeholder="330.00"
              onChange={e => set('default_lease_renewal_fee', e.target.value)} />
          </FIELD>
        </div>
        <div className="grid-2">
          <FIELD label="Tribunal / NCAT Fee ($)" hint="Per appearance at NSW Civil & Administrative Tribunal">
            <input className="input" type="number" step="0.01" min="0"
              value={agency.default_tribunal_fee || ''}
              placeholder="110.00"
              onChange={e => set('default_tribunal_fee', e.target.value)} />
          </FIELD>
          <FIELD label="Emergency Repairs Limit ($)" hint="Agent can authorise repairs up to this without owner approval">
            <input className="input" type="number" step="1" min="0"
              value={agency.default_repairs_limit || ''}
              placeholder="500"
              onChange={e => set('default_repairs_limit', e.target.value)} />
          </FIELD>
        </div>
      </Section>

      <div style={{ padding: '14px 16px', background: 'var(--fhq-surface-muted)', border: '1px solid var(--fhq-border)', borderRadius: 8, fontSize: 12, color: 'var(--fhq-text-muted)', lineHeight: 1.6 }}>
        <strong>Note:</strong> All fees should be stated inclusive of GST where applicable, as required by the Property, Stock and Business Agents Act 2002 (NSW).
        The agent can override any fee on a per-transaction basis in the FM00100 wizard.
      </div>
    </div>
  );
}

// ── Trust Account Tab ─────────────────────────────────────────────────────────

function TrustTab({ agency, set }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <InfoBanner
        title="Agency trust account"
        text="This is the account rental income from tenants is received into. It pre-fills into every FM00100 automatically. The owner's bank account (where rent is then remitted to them) is collected separately during intake."
        source="Agency account"
      />

      <Section title="Trust Account Details">
        <div className="grid-2">
          <FIELD label="Bank Name">
            <input className="input" value={agency.trust_bank_name || ''} placeholder="Commonwealth Bank"
              onChange={e => set('trust_bank_name', e.target.value)} />
          </FIELD>
          <FIELD label="Account Name" required hint="Usually 'Agency Name Trust Account'">
            <input className="input" value={agency.trust_account_name || ''} placeholder="Demo PM Trust Account"
              onChange={e => set('trust_account_name', e.target.value)} />
          </FIELD>
        </div>
        <div className="grid-2">
          <FIELD label="BSB" required>
            <input className="input" value={agency.trust_bsb || ''} placeholder="062-000"
              onChange={e => set('trust_bsb', e.target.value)} />
          </FIELD>
          <FIELD label="Account Number" required>
            <input className="input" value={agency.trust_account_no || ''} placeholder="12345678"
              onChange={e => set('trust_account_no', e.target.value)} />
          </FIELD>
        </div>
      </Section>

      <div style={{ padding: '14px 16px', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, fontSize: 12, color: '#92400e', lineHeight: 1.6 }}>
        <strong>⚠ Statutory requirement:</strong> Real estate agents in NSW must hold rental money in a dedicated trust account
        under the Property, Stock and Business Agents Act 2002. This account must be separate from the agency's operating account.
      </div>
    </div>
  );
}

// ── My Profile Tab ────────────────────────────────────────────────────────────

function AgentTab({ profile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <InfoBanner
        title="Your agent profile"
        text="This is your individual agent record. Your name and licence number appear on agreements you prepare. Contact your agency administrator to make changes."
        source="Agent account"
      />
      <Section title="Agent Details">
        <div className="grid-2">
          <FIELD label="Full Name">
            <input className="input" value={profile.full_name || ''} disabled
              style={{ background: 'var(--fhq-surface-muted)', color: 'var(--fhq-text-muted)' }} />
          </FIELD>
          <FIELD label="Role">
            <input className="input" value={profile.role || ''} disabled
              style={{ background: 'var(--fhq-surface-muted)', color: 'var(--fhq-text-muted)', textTransform: 'capitalize' }} />
          </FIELD>
        </div>
        <FIELD label="Email">
          <input className="input" value={profile.email || ''} disabled
            style={{ background: 'var(--fhq-surface-muted)', color: 'var(--fhq-text-muted)' }} />
        </FIELD>
        <div style={{ padding: '12px 14px', background: 'var(--fhq-surface-muted)', borderRadius: 8, fontSize: 12, color: 'var(--fhq-text-muted)' }}>
          To update your name or email, contact your agency administrator.
        </div>
      </Section>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div className="card card-pad">
      <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--fhq-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 18 }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </div>
  );
}

function InfoBanner({ title, text, source }) {
  const sourceStyle = source === 'Agency account'
    ? { bg: '#f3f4f6', color: '#4b5563' }
    : { bg: '#dbeafe', color: '#1d4ed8' };
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 8,
      background: 'var(--fhq-surface)', border: '1px solid var(--fhq-border)',
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{title}</span>
          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: sourceStyle.bg, color: sourceStyle.color, fontWeight: 700 }}>
            {source}
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--fhq-text-muted)', margin: 0, lineHeight: 1.5 }}>{text}</p>
      </div>
    </div>
  );
}
