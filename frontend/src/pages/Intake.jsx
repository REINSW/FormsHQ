import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import VoiceButton from '../components/VoiceButton';

export default function Intake() {
  const [intakes, setIntakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(searchParams.get('new') === '1');
  const [creating, setCreating] = useState(false);
  const [newIntake, setNewIntake] = useState({ clientName: '', clientEmail: '', clientMobile: '', propertyAddress: '' });
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const navigate = useNavigate();

  const load = () => {
    setLoadError(null);
    api.get('/v1/intake')
      .then(r => setIntakes(r.data))
      .catch(err => setLoadError(err.response?.data?.error || 'Failed to load intake requests'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async e => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/v1/intake', newIntake);
      setCreated(res.data);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create intake');
    } finally {
      setCreating(false);
    }
  };

  const copyLink = url => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startMA = async (intakeId) => {
    try {
      const res = await api.post('/v1/transactions', { intakeId });
      navigate(`/transactions/${res.data.id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start transaction');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Intake Requests</h1>
          <p style={{ fontSize: 14, color: 'var(--fhq-text-muted)', marginTop: 2 }}>
            Send intake links to owners — their responses pre-fill the MA wizard
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setCreated(null); setNewIntake({ clientName:'',clientEmail:'',clientMobile:'',propertyAddress:'' }); }}>
          + New Intake Request
        </button>
      </div>

      <div className="page-body">
        {/* How it works banner */}
        <div style={{
          display: 'flex', gap: 0, marginBottom: 24,
          background: 'var(--fhq-surface)', border: '1px solid var(--fhq-border)',
          borderRadius: 'var(--fhq-radius-md)', overflow: 'hidden'
        }}>
          {[
            { n:'1', title:'Create request', desc:'Enter client & property details' },
            { n:'2', title:'Send link', desc:'Client fills the intake form' },
            { n:'3', title:'Review submission', desc:'Check client responses' },
            { n:'4', title:'Launch wizard', desc:'FM00100 opens pre-filled' },
          ].map((step, i) => (
            <div key={i} style={{
              flex: 1, padding: '16px 18px',
              borderRight: i<3 ? '1px solid var(--fhq-border)' : 'none',
              display: 'flex', gap: 12, alignItems: 'flex-start'
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: 'var(--fhq-signal-lime)', color: 'var(--fhq-graphite)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800
              }}>{step.n}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{step.title}</div>
                <div style={{ fontSize: 12, color: 'var(--fhq-text-muted)', marginTop: 2 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : loadError ? (
            <div className="empty-state">
              <h3>Could not load intake requests</h3>
              <p>{loadError}</p>
              <button className="btn btn-primary" onClick={load}>Retry</button>
            </div>
          ) : intakes.length === 0 ? (
            <div className="empty-state">
              <h3>No intake requests yet</h3>
              <p>Create your first intake request and share the link with an owner.</p>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                + Create Intake Request
              </button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Property</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Submitted</th>
                  <th style={{ width: 200 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {intakes.map(intake => (
                  <tr key={intake.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{intake.client_name || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--fhq-text-muted)' }}>{intake.client_email}</div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--fhq-text-muted)' }}>{intake.property_address || '—'}</td>
                    <td><StatusBadge status={intake.status} /></td>
                    <td style={{ fontSize: 13, color: 'var(--fhq-text-muted)' }}>{fmtDate(intake.created_at)}</td>
                    <td style={{ fontSize: 13, color: 'var(--fhq-text-muted)' }}>{intake.submitted_at ? fmtDate(intake.submitted_at) : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {intake.status === 'pending' && (
                          <button className="btn btn-ghost btn-sm"
                            onClick={() => copyLink(`${window.location.origin}/intake/${intake.token}`)}>
                            Copy link
                          </button>
                        )}
                        {intake.status === 'submitted' && !intake.transaction_id && (
                          <button className="btn btn-primary btn-sm"
                            onClick={() => startMA(intake.id)}>
                            Start MA →
                          </button>
                        )}
                        {intake.status === 'submitted' && intake.transaction_id && (
                          <Link to={`/transactions/${intake.transaction_id}`} className="btn btn-ghost btn-sm">
                            View MA →
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>New Intake Request</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--fhq-text-muted)' }}>×</button>
            </div>

            {created ? (
              <SendPanel
                created={created}
                onClose={() => setShowModal(false)}
              />
            ) : (
              <form onSubmit={handleCreate}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Voice input */}
                  <div style={{
                    padding: '12px 14px', background: 'var(--fhq-surface-muted)',
                    borderRadius: 'var(--fhq-radius-sm)', border: '1px solid var(--fhq-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Fill by voice</div>
                      <div style={{ fontSize: 12, color: 'var(--fhq-text-muted)', marginTop: 2 }}>
                        Speak the owner's name, email, mobile and property address
                      </div>
                    </div>
                    <VoiceButton
                      context="intake"
                      onExtract={fields => setNewIntake(p => ({
                        clientName:      fields.clientName      || p.clientName,
                        clientEmail:     fields.clientEmail     || p.clientEmail,
                        clientMobile:    fields.clientMobile    || p.clientMobile,
                        propertyAddress: fields.propertyAddress || p.propertyAddress,
                      }))}
                    />
                  </div>
                  <div className="field">
                    <label>Client / Owner Name</label>
                    <input className="input" placeholder="Jane Smith" value={newIntake.clientName}
                      onChange={e => setNewIntake(p => ({ ...p, clientName: e.target.value }))} />
                  </div>
                  <div className="grid-2">
                    <div className="field">
                      <label>Client Email</label>
                      <input className="input" type="email" placeholder="jane@example.com" value={newIntake.clientEmail}
                        onChange={e => setNewIntake(p => ({ ...p, clientEmail: e.target.value }))} />
                    </div>
                    <div className="field">
                      <label>Client Mobile</label>
                      <input className="input" placeholder="0412 345 678" value={newIntake.clientMobile}
                        onChange={e => setNewIntake(p => ({ ...p, clientMobile: e.target.value }))} />
                    </div>
                  </div>
                  <div className="field">
                    <label>Property Address</label>
                    <input className="input" placeholder="14 Example Street, Newtown NSW 2042" value={newIntake.propertyAddress}
                      onChange={e => setNewIntake(p => ({ ...p, propertyAddress: e.target.value }))} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={creating}>
                    {creating ? 'Creating…' : 'Create & Get Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── Send Panel ────────────────────────────────────────────────────────────────

function SendPanel({ created, onClose }) {
  const [copied, setCopied] = useState(false);
  const [panel, setPanel] = useState(null); // null | 'email' | 'sms'
  const [emailTo, setEmailTo] = useState(created.clientEmail || '');
  const [smsTo, setSmsTo]     = useState(created.clientMobile || '');
  const [sending, setSending] = useState(false);
  const [sentEmail, setSentEmail] = useState(false);
  const [sentSms, setSentSms]     = useState(false);
  const [sendError, setSendError] = useState('');

  const copyLink = () => {
    navigator.clipboard.writeText(created.intakeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendEmail = async e => {
    e.preventDefault();
    setSending(true); setSendError('');
    try {
      await api.post('/v1/notify/email', { intakeId: created.id, to: emailTo, toName: created.clientName });
      setSentEmail(true); setPanel(null);
    } catch (err) {
      setSendError(err.response?.data?.error || 'Failed to send email');
    } finally { setSending(false); }
  };

  const sendSms = async e => {
    e.preventDefault();
    setSending(true); setSendError('');
    try {
      await api.post('/v1/notify/sms', { intakeId: created.id, to: smsTo });
      setSentSms(true); setPanel(null);
    } catch (err) {
      setSendError(err.response?.data?.error || 'Failed to send SMS');
    } finally { setSending(false); }
  };

  return (
    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Success */}
      <div className="alert alert-success">Intake request created successfully</div>

      {/* Link display */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fhq-text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Client intake link
        </label>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          background: 'var(--fhq-surface-muted)', border: '1px solid var(--fhq-border)',
          borderRadius: 'var(--fhq-radius-sm)', padding: '10px 14px'
        }}>
          <code style={{ flex: 1, fontSize: 12, wordBreak: 'break-all', color: 'var(--fhq-text-muted)', fontFamily: 'var(--fhq-font-mono)' }}>
            {created.intakeUrl}
          </code>
        </div>
      </div>

      {/* 3 action buttons */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fhq-text-muted)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Share with client
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Copy link */}
          <ActionBtn
            active={copied}
            onClick={copyLink}
            icon={<IconCopy />}
            label={copied ? 'Copied!' : 'Copy link'}
            success={copied}
          />
          {/* Send email */}
          <ActionBtn
            active={panel === 'email'}
            onClick={() => { setPanel(panel === 'email' ? null : 'email'); setSendError(''); }}
            icon={<IconEmail />}
            label="Send email"
            success={sentEmail}
          />
          {/* Send SMS */}
          <ActionBtn
            active={panel === 'sms'}
            onClick={() => { setPanel(panel === 'sms' ? null : 'sms'); setSendError(''); }}
            icon={<IconSms />}
            label="Send SMS"
            success={sentSms}
          />
        </div>
      </div>

      {/* Email sub-form */}
      {panel === 'email' && (
        <form onSubmit={sendEmail} style={{ display: 'flex', flexDirection: 'column', gap: 10,
          padding: '16px', background: 'var(--fhq-surface-muted)', borderRadius: 'var(--fhq-radius-sm)',
          border: '1px solid var(--fhq-border)' }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Send intake link by email</div>
          <div className="field">
            <label>Recipient email</label>
            <input className="input" type="email" required value={emailTo}
              onChange={e => setEmailTo(e.target.value)}
              placeholder="client@example.com" />
          </div>
          {sendError && <div style={{ fontSize: 12, color: 'var(--fhq-error)' }}>{sendError}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPanel(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={sending}>
              {sending ? 'Sending…' : 'Send email'}
            </button>
          </div>
        </form>
      )}

      {/* SMS sub-form */}
      {panel === 'sms' && (
        <div style={{
          padding: '16px', background: 'var(--fhq-surface-muted)', borderRadius: 'var(--fhq-radius-sm)',
          border: '1px solid var(--fhq-border)', display: 'flex', flexDirection: 'column', gap: 10
        }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Send intake link by SMS</div>
          <div style={{
            display: 'flex', gap: 12, alignItems: 'flex-start',
            padding: '12px 14px', background: '#fffbeb',
            border: '1px solid #fcd34d', borderRadius: 'var(--fhq-radius-sm)'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>SMS not configured yet</div>
              <div style={{ fontSize: 12, color: '#92400e', marginTop: 3, lineHeight: 1.5 }}>
                Twilio credentials are needed to send SMS. Add your Account SID, Auth Token and register the
                "FormsHQ" sender ID, then update <code style={{ fontSize: 11 }}>api/.env</code>.
                <br />In the meantime, use <strong>Copy link</strong> to share manually.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPanel(null)}>Close</button>
          </div>
        </div>
      )}

      {/* Sent confirmations */}
      {sentEmail && <div style={{ fontSize: 13, color: 'var(--fhq-success)' }}>Email sent successfully</div>}
      {sentSms   && <div style={{ fontSize: 13, color: 'var(--fhq-success)' }}>SMS sent successfully</div>}

      <p style={{ fontSize: 13, color: 'var(--fhq-text-muted)', margin: 0 }}>
        Once the client submits the form, you can start the FM00100 wizard from the Intake table.
      </p>
      <div style={{ paddingTop: 16, borderTop: '1px solid var(--fhq-border)' }}>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, onClick, active, success }) {
  return (
    <button type="button" onClick={onClick} style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      padding: '14px 10px', border: `1.5px solid ${active ? 'var(--fhq-graphite)' : success ? 'var(--fhq-success)' : 'var(--fhq-border)'}`,
      borderRadius: 'var(--fhq-radius-sm)', background: active ? 'var(--fhq-graphite)' : success ? 'var(--fhq-success-soft)' : 'var(--fhq-surface)',
      cursor: 'pointer', transition: 'all 0.15s',
    }}>
      <span style={{ color: active ? 'var(--fhq-signal-lime)' : success ? 'var(--fhq-success)' : 'var(--fhq-text)' }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: active ? '#fff' : success ? 'var(--fhq-success)' : 'var(--fhq-text)' }}>{label}</span>
    </button>
  );
}

// SVG Icons
function IconCopy() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}
function IconEmail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}
function IconSms() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: ['badge-warning', 'Pending'],
    submitted: ['badge-success', 'Submitted'],
    expired: ['badge-error', 'Expired'],
    cancelled: ['badge-neutral', 'Cancelled']
  };
  const [cls, label] = map[status] || ['badge-neutral', status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

function fmtDate(str) {
  return str ? new Date(str).toLocaleDateString('en-AU', { day:'numeric', month:'short', year:'numeric' }) : '—';
}
