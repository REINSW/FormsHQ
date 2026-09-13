import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import VoiceButton from '../components/VoiceButton';
import FM00100Template from '../components/FM00100Template';
import FM00100Checklist, { FM00100CompletionBanner } from '../components/FM00100Checklist';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import api from '../utils/api';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function TransactionDetail() {
  const { id } = useParams();
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    api.get(`/v1/transactions/${id}`).then(r => setTx(r.data)).finally(() => setLoading(false));
  }, [id]);

  const generatePDF = async () => {
    setGeneratingPdf(true);
    try {
      const res = await api.post(`/v1/pdf/fm00100/${id}`, {}, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `FM00100_${id}.pdf`; a.click();
      URL.revokeObjectURL(url);
      setTx(prev => ({ ...prev, pdf_path: 'generated' }));
    } catch (err) {
      alert(err.response?.data?.error || 'PDF generation failed');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) return (
    <div className="loading-center" style={{ minHeight: '60vh' }}>
      <div className="spinner" />
      <span>Loading transaction…</span>
    </div>
  );

  if (!tx) return (
    <div className="page-body">
      <div className="alert alert-error">Transaction not found</div>
      <Link to="/transactions" className="btn btn-ghost" style={{ marginTop: 16 }}>← Back</Link>
    </div>
  );

  const prefill = tx.form_data || {};

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/transactions" style={{ color: 'var(--fhq-text-muted)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div>
            <h1>{tx.form_id} — {tx.client_name || 'Management Authority'}</h1>
            <p style={{ fontSize: 13, color: 'var(--fhq-text-muted)', marginTop: 2 }}>
              {tx.property_address} · Created {fmtDate(tx.created_at)}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <StatusBadge status={tx.status} />
          <button className="btn btn-primary" onClick={generatePDF} disabled={generatingPdf}>
            {generatingPdf ? 'Generating…' : (tx.pdf_path ? '↓ Re-download PDF' : '↓ Generate PDF')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'var(--fhq-surface)', borderBottom: '1px solid var(--fhq-border)', padding: '0 32px', display: 'flex', gap: 0 }}>
        {['overview', 'tasks', 'wizard', 'prefill'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '14px 20px', background: 'none', border: 'none',
            cursor: 'pointer', fontSize: 14, fontWeight: activeTab === tab ? 700 : 500,
            color: activeTab === tab ? 'var(--fhq-text)' : 'var(--fhq-text-muted)',
            borderBottom: activeTab === tab ? '2px solid var(--fhq-graphite)' : '2px solid transparent',
            textTransform: 'capitalize'
          }}>
            {tab === 'prefill' ? 'Pre-fill Data' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="page-body">
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Transaction + Principal cards side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="card card-pad">
                  <h3 style={{ fontSize: 12, fontWeight: 700, marginBottom: 14, color: 'var(--fhq-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Transaction</h3>
                  <InfoRow label="Form" value={tx.form_id} />
                  <InfoRow label="Status" value={<StatusBadge status={tx.status} />} />
                  <InfoRow label="Created" value={fmtDate(tx.created_at)} />
                  {tx.completed_at && <InfoRow label="Completed" value={fmtDate(tx.completed_at)} />}
                  {tx.pdf_path && (
                    <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--fhq-success-soft)', borderRadius: 6, fontSize: 12, color: 'var(--fhq-success)' }}>
                      ✓ PDF generated
                    </div>
                  )}
                </div>

                <div className="card card-pad">
                  <h3 style={{ fontSize: 12, fontWeight: 700, marginBottom: 14, color: 'var(--fhq-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Principal & Property</h3>
                  <InfoRow label="Owner" value={tx.client_name || prefill.party_0__name_full || prefill.party_0__full_name} />
                  <InfoRow label="Email" value={tx.client_email || prefill.party_0__email} />
                  <InfoRow label="Property" value={tx.property_address || [prefill.property__address_street || prefill.property__street_address, prefill.property__address_suburb || prefill.property__suburb].filter(Boolean).join(', ')} />
                  <InfoRow label="Rent" value={
                    (prefill.management_authority__rent_amount || prefill.leasing__rent_amount)
                      ? `$${prefill.management_authority__rent_amount || prefill.leasing__rent_amount} ${prefill.management_authority__rent_period || prefill.leasing__rent_period || ''}`.trim()
                      : '—'
                  } />
                  <InfoRow label="Mgmt fee" value={
                    (prefill.fees__management_percent || prefill.fees__management_pct)
                      ? `${prefill.fees__management_percent || prefill.fees__management_pct}%`
                      : '—'
                  } />
                </div>
              </div>

              {/* Wizard CTA */}
              <div className="card card-pad" style={{ background: 'linear-gradient(135deg, var(--fhq-graphite) 0%, var(--fhq-carbon) 100%)', border: '1px solid rgba(183,255,74,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: 4, fontSize: 14 }}>FM00100 Wizard</h3>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>
                      Complete the remaining sections to prepare the agreement for signing.
                    </p>
                  </div>
                  <button onClick={() => setActiveTab('wizard')} className="btn btn-lime">
                    Open Wizard →
                  </button>
                </div>
              </div>
            </div>

            {/* Right column — completion checklist */}
            <FM00100Checklist
              data={prefill}
              onGoToWizard={() => setActiveTab('wizard')}
            />
          </div>
        )}

        {activeTab === 'tasks' && <TasksPanel transactionId={id} />}

        {activeTab === 'wizard' && (
          <FM00100Wizard tx={tx} onComplete={(data) => {
            setTx(prev => ({ ...prev, form_data: { ...prev.form_data, ...data }, status: 'in_progress' }));
          }} />
        )}

        {activeTab === 'prefill' && (
          <PrefillDataTab prefill={prefill} intakeResponses={tx.intake_responses} />
        )}
      </div>
    </>
  );
}

// ── TASKS PANEL ──────────────────────────────────────────────────────────────

const CATEGORY_LABELS = {
  verification: 'Verification',
  compliance: 'Compliance',
  document: 'Document',
  signing: 'Signing',
  admin: 'Admin',
};

const CATEGORY_COLORS = {
  verification: '#8b5cf6',
  compliance: '#ef4444',
  document: '#3b82f6',
  signing: '#059669',
  admin: '#6b7280',
};

const PRIORITY_COLORS = {
  urgent: '#ef4444',
  high: '#f97316',
  normal: '#6b7280',
  low: '#9ca3af',
};

function TasksPanel({ transactionId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', category: 'admin', priority: 'normal', due_date: '' });
  const [saving, setSaving] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [loadError, setLoadError] = useState(null);
  const [generating, setGenerating] = useState(false);

  const load = () => {
    setLoadError(null);
    api.get(`/v1/tasks?transactionId=${transactionId}`)
      .then(r => setTasks(r.data))
      .catch(err => setLoadError(err.response?.data?.error || 'Failed to load tasks'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [transactionId]);

  const toggleStatus = async (task) => {
    const next = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const res = await api.patch(`/v1/tasks/${task.id}`, { status: next });
      setTasks(prev => prev.map(t => t.id === task.id ? res.data : t));
    } catch {}
  };

  const updateNotes = async (task, notes) => {
    try {
      const res = await api.patch(`/v1/tasks/${task.id}`, { notes });
      setTasks(prev => prev.map(t => t.id === task.id ? res.data : t));
    } catch {}
  };

  const deleteTask = async (taskId) => {
    try {
      await api.delete(`/v1/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch {}
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post(`/v1/transactions/${transactionId}/generate-tasks`);
      setLoading(true);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate tasks');
    } finally {
      setGenerating(false);
    }
  };

  const handleAdd = async e => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    setSaving(true);
    try {
      const res = await api.post('/v1/tasks', { transactionId, ...newTask });
      setTasks(prev => [...prev, res.data]);
      setNewTask({ title: '', description: '', category: 'admin', priority: 'normal', due_date: '' });
      setShowAdd(false);
    } catch {}
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (loadError) return (
    <div className="alert alert-warning" style={{ maxWidth: 600 }}>
      <div>
        <strong>Could not load tasks</strong>
        <div style={{ fontSize: 13, marginTop: 4 }}>{loadError}</div>
        <div style={{ fontSize: 12, marginTop: 8, color: 'var(--fhq-text-muted)' }}>
          If this is a new setup, run <code>tasks_migration.sql</code> in Supabase SQL Editor then refresh.
        </div>
      </div>
    </div>
  );

  const pending = tasks.filter(t => t.status !== 'completed' && t.status !== 'skipped');
  const completed = tasks.filter(t => t.status === 'completed');
  const pct = tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0;

  // Group pending tasks by category
  const grouped = {};
  pending.forEach(t => {
    const cat = t.category || 'admin';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(t);
  });
  const catOrder = ['verification', 'document', 'signing', 'compliance', 'admin'];

  if (tasks.length === 0) return (
    <div style={{ maxWidth: 560 }}>
      <div style={{
        border: '1px dashed var(--fhq-border)', borderRadius: 'var(--fhq-radius-md)',
        padding: '36px 32px', textAlign: 'center', background: 'var(--fhq-surface)'
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
        <h3 style={{ fontWeight: 700, marginBottom: 8 }}>No tasks yet</h3>
        <p style={{ fontSize: 13, color: 'var(--fhq-text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
          This transaction was created before the task system was set up.<br />
          Generate the standard checklist from the intake data, or add tasks manually.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generating…' : '⚡ Generate task checklist'}
          </button>
          <button className="btn btn-ghost" onClick={() => setShowAdd(true)}>
            + Add manually
          </button>
        </div>
      </div>
      {showAdd && (
        <form onSubmit={handleAdd} style={{
          border: '1px solid var(--fhq-border)', borderRadius: 'var(--fhq-radius-sm)',
          padding: 16, marginTop: 16, background: 'var(--fhq-surface)', display: 'flex', flexDirection: 'column', gap: 10
        }}>
          <input className="input" placeholder="Task title *" value={newTask.title}
            onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} autoFocus />
          <input className="input" placeholder="Description (optional)" value={newTask.description}
            onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} />
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="select" value={newTask.category} onChange={e => setNewTask(p => ({ ...p, category: e.target.value }))}>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select className="select" value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))}>
              {['urgent','high','normal','low'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Adding…' : 'Add Task'}</button>
          </div>
        </form>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: 860 }}>
      {/* Progress bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{completed.length} of {tasks.length} tasks complete</span>
          <span style={{ fontSize: 13, color: 'var(--fhq-text-muted)' }}>{pct}%</span>
        </div>
        <div style={{ height: 8, background: 'var(--fhq-surface-muted)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--fhq-signal-lime)', borderRadius: 99, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Pending tasks grouped by category */}
      {catOrder.filter(cat => grouped[cat]?.length > 0).map(cat => (
        <div key={cat} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: CATEGORY_COLORS[cat], background: `${CATEGORY_COLORS[cat]}18`,
              padding: '3px 8px', borderRadius: 99
            }}>{CATEGORY_LABELS[cat] || cat}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {grouped[cat].map(task => (
              <TaskCard key={task.id} task={task}
                onToggle={toggleStatus}
                onDelete={deleteTask}
                onUpdateNotes={updateNotes}
                expanded={!!expandedNotes[task.id]}
                onToggleNotes={() => setExpandedNotes(p => ({ ...p, [task.id]: !p[task.id] }))}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Add task */}
      {!showAdd ? (
        <button className="btn btn-ghost" style={{ marginTop: 4 }} onClick={() => setShowAdd(true)}>
          + Add custom task
        </button>
      ) : (
        <form onSubmit={handleAdd} style={{
          border: '1px solid var(--fhq-border)', borderRadius: 'var(--fhq-radius-sm)',
          padding: 16, marginTop: 8, background: 'var(--fhq-surface)', display: 'flex', flexDirection: 'column', gap: 10
        }}>
          <input className="input" placeholder="Task title *" value={newTask.title}
            onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} autoFocus />
          <input className="input" placeholder="Description (optional)" value={newTask.description}
            onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} />
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="select" value={newTask.category}
              onChange={e => setNewTask(p => ({ ...p, category: e.target.value }))}>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select className="select" value={newTask.priority}
              onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))}>
              {['urgent','high','normal','low'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
            </select>
            <input className="input" type="date" value={newTask.due_date}
              onChange={e => setNewTask(p => ({ ...p, due_date: e.target.value }))} style={{ flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Adding…' : 'Add Task'}
            </button>
          </div>
        </form>
      )}

      {/* Completed tasks */}
      {completed.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fhq-text-muted)', marginBottom: 8 }}>
            Completed ({completed.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {completed.map(task => (
              <TaskCard key={task.id} task={task}
                onToggle={toggleStatus}
                onDelete={deleteTask}
                onUpdateNotes={updateNotes}
                expanded={!!expandedNotes[task.id]}
                onToggleNotes={() => setExpandedNotes(p => ({ ...p, [task.id]: !p[task.id] }))}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onToggle, onDelete, onUpdateNotes, expanded, onToggleNotes }) {
  const [notesVal, setNotesVal] = useState(task.notes || '');
  const [editingNotes, setEditingNotes] = useState(false);
  const isDone = task.status === 'completed';

  const saveNotes = () => {
    onUpdateNotes(task, notesVal);
    setEditingNotes(false);
  };

  return (
    <div style={{
      border: '1px solid var(--fhq-border)', borderRadius: 'var(--fhq-radius-sm)',
      background: isDone ? 'var(--fhq-surface-muted)' : 'var(--fhq-surface)',
      padding: '10px 14px', opacity: isDone ? 0.75 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Checkbox */}
        <button onClick={() => onToggle(task)} style={{
          width: 20, height: 20, borderRadius: 4, border: `2px solid ${isDone ? 'var(--fhq-signal-lime)' : 'var(--fhq-border)'}`,
          background: isDone ? 'var(--fhq-signal-lime)' : 'transparent',
          cursor: 'pointer', flexShrink: 0, marginTop: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, color: isDone ? 'var(--fhq-graphite)' : 'transparent',
        }}>✓</button>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 13, fontWeight: 600,
              textDecoration: isDone ? 'line-through' : 'none',
              color: isDone ? 'var(--fhq-text-muted)' : 'var(--fhq-text)',
            }}>{task.title}</span>
            {task.priority !== 'normal' && (
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: PRIORITY_COLORS[task.priority] }}>
                {task.priority}
              </span>
            )}
            {task.due_date && (
              <span style={{ fontSize: 11, color: 'var(--fhq-text-muted)' }}>
                Due {new Date(task.due_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
          {task.description && (
            <div style={{ fontSize: 12, color: 'var(--fhq-text-muted)', marginTop: 2 }}>{task.description}</div>
          )}
          {task.completed_by_name && isDone && (
            <div style={{ fontSize: 11, color: 'var(--fhq-text-muted)', marginTop: 2 }}>
              Completed by {task.completed_by_name}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button onClick={onToggleNotes} style={{
            border: 'none', background: 'none', cursor: 'pointer', padding: '2px 6px',
            fontSize: 12, color: task.notes ? 'var(--fhq-signal-lime)' : 'var(--fhq-text-muted)',
          }} title="Notes">✎</button>
          {!task.is_auto_generated && (
            <button onClick={() => onDelete(task.id)} style={{
              border: 'none', background: 'none', cursor: 'pointer', padding: '2px 6px',
              fontSize: 12, color: 'var(--fhq-text-muted)',
            }} title="Delete">×</button>
          )}
        </div>
      </div>

      {/* Notes area */}
      {expanded && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--fhq-border)' }}>
          {editingNotes ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <textarea className="input" style={{ resize: 'vertical', minHeight: 60, fontSize: 12 }}
                value={notesVal} onChange={e => setNotesVal(e.target.value)}
                placeholder="Add notes…" autoFocus />
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-primary btn-sm" onClick={saveNotes}>Save</button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setNotesVal(task.notes || ''); setEditingNotes(false); }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div onClick={() => setEditingNotes(true)} style={{
              fontSize: 12, color: notesVal ? 'var(--fhq-text)' : 'var(--fhq-text-muted)',
              cursor: 'text', minHeight: 24,
            }}>
              {notesVal || 'Click to add notes…'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── AGREEMENT HTML PREVIEW ────────────────────────────────────────────────────

function AgreementPreview({ form, tx }) {
  return <FM00100Template data={form} tx={tx} />;
}

// ── PREFILL DATA TAB ─────────────────────────────────────────────────────────

function PrefillDataTab({ prefill = {}, intakeResponses }) {
  const [showRaw, setShowRaw] = useState(false);

  // Sections: [title, key prefix, source label, source colour]
  const SECTIONS = [
    ['Owner 1',              'party_0__',       'Intake',          '#dbeafe', '#1d4ed8'],
    ['Owner 2',              'party_1__',       'Intake',          '#dbeafe', '#1d4ed8'],
    ['Property',             'property__',      'Intake',          '#dbeafe', '#1d4ed8'],
    ['Owner Bank Account',   'owner_bank__',    'Intake',          '#dcfce7', '#15803d'],
    ['Agreement / Leasing',  'management_authority__', 'Intake / Agent', '#ede9fe', '#5b21b6'],
    ['Fees',                 'fees__',          'Agency profile',  '#f3f4f6', '#4b5563'],
    ['Agent & Agency',       'agent__',         'Agency profile',  '#f3f4f6', '#4b5563'],
    ['Agency Trust Account', 'trust__',         'Agency profile',  '#f3f4f6', '#4b5563'],
    ['Disclosures',          'disclosure__',    'Agent',           '#fef3c7', '#92400e'],
    ['Utilities / Compliance','utilities__',    'Intake',          '#dbeafe', '#1d4ed8'],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Intro + raw toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 14, color: 'var(--fhq-text-muted)', margin: 0 }}>
          Data pre-filled into the FM00100 wizard from the intake form and agency profile.
          Empty sections mean that data wasn't collected yet.
        </p>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowRaw(r => !r)}>
          {showRaw ? 'Hide raw JSON' : 'View raw JSON'}
        </button>
      </div>

      {showRaw && (
        <div style={{
          background: '#1e1e1e', borderRadius: 8, padding: '16px',
          maxHeight: 400, overflowY: 'auto', border: '1px solid var(--fhq-border)',
        }}>
          <pre style={{ color: '#d4d4d4', fontSize: 11, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(prefill, null, 2)}
          </pre>
        </div>
      )}

      {/* Intake responses (what the owner actually submitted) */}
      {intakeResponses && (
        <details style={{ border: '1px solid var(--fhq-border)', borderRadius: 8, overflow: 'hidden' }}>
          <summary style={{
            padding: '12px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
            background: 'var(--fhq-surface)', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }}>Intake</span>
            Raw intake responses (what the owner submitted)
          </summary>
          <div style={{ padding: '12px 16px', background: '#1e1e1e' }}>
            <pre style={{ color: '#d4d4d4', fontSize: 11, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 300, overflowY: 'auto' }}>
              {JSON.stringify(intakeResponses, null, 2)}
            </pre>
          </div>
        </details>
      )}

      {/* Section cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {SECTIONS.map(([title, prefix, sourceLabel, sourceBg, sourceColor]) => {
          const data = filterKeys(prefill, prefix);
          const entries = Object.entries(data).filter(([, v]) => v !== null && v !== '' && v !== undefined && v !== false);
          const emptyCount = Object.keys(data).length - entries.length;
          if (Object.keys(data).length === 0 && !['Owner Bank Account','Agency Trust Account','Agent & Agency'].includes(title)) return null;
          return (
            <div key={title} className="card card-pad">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--fhq-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                  {title}
                </h3>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: sourceBg, color: sourceColor, fontWeight: 700 }}>
                  {sourceLabel}
                </span>
                {entries.length === 0 && (
                  <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, marginLeft: 'auto' }}>Empty</span>
                )}
              </div>
              {entries.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--fhq-text-muted)', margin: 0, fontStyle: 'italic' }}>
                  {prefix === 'owner_bank__'
                    ? 'Bank details not submitted in intake — owner can be asked separately or agent can enter in wizard.'
                    : prefix === 'trust__'
                    ? 'Trust account not set in agency profile — update Settings → Agency Profile.'
                    : prefix === 'agent__'
                    ? 'Agent details not set in agency profile — update Settings → Agency Profile.'
                    : 'No data for this section yet.'}
                </p>
              ) : (
                <>
                  {entries.map(([k, v]) => (
                    <InfoRow key={k}
                      label={k.replace(prefix, '').replace(/_/g, ' ')}
                      value={Array.isArray(v) ? v.join(', ') : String(v)}
                    />
                  ))}
                  {emptyCount > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--fhq-text-muted)', marginTop: 6, fontStyle: 'italic' }}>
                      + {emptyCount} empty field{emptyCount !== 1 ? 's' : ''}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PrefillSection({ title, data }) {
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== '' && v !== undefined);
  if (entries.length === 0) return null;
  return (
    <div className="card card-pad">
      <h3 style={{ fontSize: 12, fontWeight: 700, marginBottom: 14, color: 'var(--fhq-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</h3>
      {entries.map(([k, v]) => (
        <InfoRow key={k} label={k.replace(/^[^_]+__/, '').replace(/_/g, ' ')} value={String(v)} />
      ))}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '6px 0', borderBottom: '1px solid var(--fhq-border)', gap: 12 }}>
      <span style={{ fontSize: 13, color: 'var(--fhq-text-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, textAlign: 'right' }}>{value || '—'}</span>
    </div>
  );
}

function filterKeys(obj, prefix) {
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => k.startsWith(prefix)).map(([k, v]) => [k, v])
  );
}

function StatusBadge({ status }) {
  const map = {
    draft: ['badge-neutral', 'Draft'],
    in_progress: ['badge-info', 'In Progress'],
    completed: ['badge-success', 'Completed'],
    cancelled: ['badge-error', 'Cancelled']
  };
  const [cls, label] = map[status] || ['badge-neutral', status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

function fmtDate(str) {
  return str ? new Date(str).toLocaleDateString('en-AU', { day:'numeric', month:'short', year:'numeric' }) : '—';
}

const STEPS = ['Principal', 'Property', 'Agreement & Fees', 'Authority', 'Disclosures', 'Bank Accounts', 'Review', 'Preview & Sign'];

// Convert ISO date YYYY-MM-DD → DD/MM/YYYY for display
const isoToAU = d => (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) ? d.split('-').reverse().join('/') : (d || '');

// Maps step index → voice context (null = no voice button for that step)
const VOICE_CONTEXTS = {
  0: 'wizard_principal',
  1: 'wizard_property',
  2: 'wizard_fees',
  3: 'wizard_authority',
  5: 'wizard_trust',
};

function WF({ label, children, required }) {
  return (
    <div className="field">
      <label>{label}{required && <span style={{ color:'var(--fhq-error)',marginLeft:3 }}>*</span>}</label>
      {children}
    </div>
  );
}

function WChk({ name, label, checked, onChange }) {
  return (
    <label style={{ display:'flex', gap:10, alignItems:'center', cursor:'pointer', fontSize:14 }}>
      <input type="checkbox" name={name} checked={!!checked} onChange={onChange}
        style={{ width:16, height:16, accentColor:'var(--fhq-signal-lime)' }} />
      {label}
    </label>
  );
}

function WRadio({ name, label, value, onChange }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:13, fontWeight:500, marginBottom:6 }}>{label}</div>
      <div style={{ display:'flex', gap:16 }}>
        {['yes','no'].map(v => (
          <label key={v} style={{ display:'flex', gap:8, alignItems:'center', cursor:'pointer', fontSize:14 }}>
            <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)}
              style={{ accentColor:'var(--fhq-signal-lime)' }} />
            {v === 'yes' ? 'Yes' : 'No'}
          </label>
        ))}
      </div>
    </div>
  );
}

function OwnerSection({ prefix, label, form, set }) {
  const p = prefix;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:13, fontWeight:700, color:'var(--fhq-text-muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
      <div className="grid-2">
        <WF label="Full Name / Company Name" required>
          <input className="input" value={form[`${p}full_name`]} onChange={e=>set(`${p}full_name`,e.target.value)} />
        </WF>
        <WF label="Company / Trust Name">
          <input className="input" value={form[`${p}company_name`]} onChange={e=>set(`${p}company_name`,e.target.value)} />
        </WF>
      </div>
      <div className="grid-2">
        <WF label="ABN"><input className="input" value={form[`${p}abn`]} placeholder="12 345 678 901" onChange={e=>set(`${p}abn`,e.target.value)} /></WF>
        <WF label="ACN"><input className="input" value={form[`${p}acn`]} placeholder="000 000 000" onChange={e=>set(`${p}acn`,e.target.value)} /></WF>
      </div>
      <div className="grid-2">
        <WF label="Email" required><input className="input" type="email" value={form[`${p}email`]} onChange={e=>set(`${p}email`,e.target.value)} /></WF>
        <WF label="Mobile"><input className="input" value={form[`${p}phone_mobile`]} placeholder="0412 345 678" onChange={e=>set(`${p}phone_mobile`,e.target.value)} /></WF>
      </div>
      <div className="grid-2">
        <WF label="Work Phone"><input className="input" value={form[`${p}phone_work`]} placeholder="02 9000 0000" onChange={e=>set(`${p}phone_work`,e.target.value)} /></WF>
        <WF label="Home Phone"><input className="input" value={form[`${p}phone_home`]} placeholder="02 9000 0000" onChange={e=>set(`${p}phone_home`,e.target.value)} /></WF>
      </div>
      <WF label="Address"><input className="input" value={form[`${p}address`]} placeholder="1 Example Street" onChange={e=>set(`${p}address`,e.target.value)} /></WF>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:12}}>
        <WF label="Suburb"><input className="input" value={form[`${p}suburb`]} onChange={e=>set(`${p}suburb`,e.target.value)} /></WF>
        <WF label="State">
          <select className="select" value={form[`${p}state`]} onChange={e=>set(`${p}state`,e.target.value)}>
            {['NSW','VIC','QLD','WA','SA','TAS','ACT','NT'].map(s=><option key={s}>{s}</option>)}
          </select>
        </WF>
        <WF label="Postcode"><input className="input" value={form[`${p}postcode`]} onChange={e=>set(`${p}postcode`,e.target.value)} /></WF>
      </div>
      <WChk name={`${p}is_gst_registered`} label="GST Registered" checked={form[`${p}is_gst_registered`]} onChange={e=>set(`${p}is_gst_registered`,e.target.checked)} />
    </div>
  );
}

function StepPrincipal({ form, set }) {
  const hasParty1 = !!(form.party_1__full_name || form.party_1__email);
  const [showParty1, setShowParty1] = useState(hasParty1);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <OwnerSection prefix="party_0__" label="Principal / Owner 1" form={form} set={set} />
      {showParty1 ? (
        <>
          <div style={{ borderTop:'1px solid var(--fhq-border)', paddingTop:20 }} />
          <OwnerSection prefix="party_1__" label="Owner 2" form={form} set={set} />
          <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf:'flex-start' }}
            onClick={() => { setShowParty1(false); ['full_name','company_name','abn','acn','email','phone_mobile','phone_work','phone_home','address','suburb','state','postcode'].forEach(f=>set(`party_1__${f}`,'')); }}>
            − Remove Owner 2
          </button>
        </>
      ) : (
        <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf:'flex-start' }}
          onClick={() => setShowParty1(true)}>
          + Add Second Owner
        </button>
      )}
    </div>
  );
}

function StepProperty({ form, set }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <WF label="Street Address" required>
        <input className="input" value={form.property__street_address} onChange={e=>set('property__street_address',e.target.value)} />
      </WF>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:12}}>
        <WF label="Suburb"><input className="input" value={form.property__suburb} onChange={e=>set('property__suburb',e.target.value)} /></WF>
        <WF label="State">
          <select className="select" value={form.property__state} onChange={e=>set('property__state',e.target.value)}>
            {['NSW','VIC','QLD','WA','SA','TAS','ACT','NT'].map(s=><option key={s}>{s}</option>)}
          </select>
        </WF>
        <WF label="Postcode"><input className="input" value={form.property__postcode} onChange={e=>set('property__postcode',e.target.value)} /></WF>
      </div>
      <div className="grid-2">
        <WF label="Property Type">
          <select className="select" value={form.property__type} onChange={e=>set('property__type',e.target.value)}>
            <option value="">Select…</option>
            <option value="house">House</option>
            <option value="apartment">Apartment / Unit</option>
            <option value="townhouse">Townhouse</option>
            <option value="villa">Villa</option>
            <option value="land">Vacant Land</option>
            <option value="other">Other</option>
          </select>
        </WF>
        <WF label="Parking">
          <select className="select" value={form.property__parking} onChange={e=>set('property__parking',e.target.value)}>
            <option value="">Select…</option>
            <option value="single_garage">Single garage</option>
            <option value="double_garage">Double garage</option>
            <option value="carport">Carport</option>
            <option value="off_street">Off-street parking</option>
            <option value="on_street">Street parking only</option>
            <option value="none">No parking</option>
          </select>
        </WF>
      </div>
      <div className="grid-2">
        <WF label="Bedrooms">
          <select className="select" value={form.property__bedrooms} onChange={e=>set('property__bedrooms',e.target.value)}>
            <option value="">Select…</option>
            {['1','2','3','4','5'].map(n=><option key={n} value={n}>{n}{n==='5'?'+':''}</option>)}
          </select>
        </WF>
        <WF label="Bathrooms">
          <select className="select" value={form.property__bathrooms} onChange={e=>set('property__bathrooms',e.target.value)}>
            <option value="">Select…</option>
            {['1','2','3','4+'].map(n=><option key={n} value={n}>{n}</option>)}
          </select>
        </WF>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <WChk name="property__is_furnished" label="Furnished" checked={form.property__is_furnished} onChange={e=>set('property__is_furnished',e.target.checked)} />
        <WChk name="property__has_garage" label="Garage / car space" checked={form.property__has_garage} onChange={e=>set('property__has_garage',e.target.checked)} />
        <WChk name="property__nbn_ready" label="NBN ready" checked={form.property__nbn_ready} onChange={e=>set('property__nbn_ready',e.target.checked)} />
        <WChk name="property__is_strata" label="Strata scheme" checked={form.property__is_strata} onChange={e=>set('property__is_strata',e.target.checked)} />
        {form.property__is_strata && (
          <div className="grid-2">
            <WF label="Strata Plan No."><input className="input" value={form.property__strata_plan_no} placeholder="SP12345" onChange={e=>set('property__strata_plan_no',e.target.value)} /></WF>
            <WF label="Strata Lot No."><input className="input" value={form.property__strata_lot_no} placeholder="12" onChange={e=>set('property__strata_lot_no',e.target.value)} /></WF>
          </div>
        )}
        <WChk name="property__has_pool" label="Swimming pool on property" checked={form.property__has_pool} onChange={e=>set('property__has_pool',e.target.checked)} />
      </div>
      {/* Read-only intake summary */}
      {(form.property__condition_exterior || form.property__current_situation || (form.property__features || []).length > 0) && (
        <div style={{padding:'12px 16px',background:'var(--fhq-surface-muted)',borderRadius:8,fontSize:13}}>
          <div style={{fontWeight:700,marginBottom:8,fontSize:12,color:'var(--fhq-text-muted)',textTransform:'uppercase',letterSpacing:'0.04em'}}>From Intake</div>
          {form.property__condition_exterior && <div style={{marginBottom:4}}><span style={{color:'var(--fhq-text-muted)'}}>Exterior condition: </span>{form.property__condition_exterior}</div>}
          {form.property__condition_interior && <div style={{marginBottom:4}}><span style={{color:'var(--fhq-text-muted)'}}>Interior condition: </span>{form.property__condition_interior}</div>}
          {form.property__current_situation && <div style={{marginBottom:4}}><span style={{color:'var(--fhq-text-muted)'}}>Current situation: </span>{form.property__current_situation.replace(/_/g,' ')}</div>}
          {form.property__access_method && <div style={{marginBottom:4}}><span style={{color:'var(--fhq-text-muted)'}}>Access: </span>{form.property__access_method.replace(/_/g,' ')}</div>}
          {(form.property__features || []).length > 0 && (
            <div style={{marginTop:8}}>
              <span style={{color:'var(--fhq-text-muted)'}}>Features: </span>
              <span>{(form.property__features).map(f=>f.replace(/_/g,' ')).join(', ')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StepFees({ form, set }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <WF label="Commencement Date (DD/MM/YYYY)">
        <input className="input" value={form.agreement__start_date} placeholder="01/07/2026" onChange={e=>set('agreement__start_date',e.target.value)} />
      </WF>
      <div className="grid-2">
        <WF label="Rent Amount ($)" required><input className="input" type="number" value={form.leasing__rent_amount} onChange={e=>set('leasing__rent_amount',e.target.value)} /></WF>
        <WF label="Rent Period">
          <select className="input" value={form.leasing__rent_period} onChange={e=>set('leasing__rent_period',e.target.value)}>
            <option value="weekly">Weekly</option>
            <option value="fortnightly">Fortnightly</option>
            <option value="monthly">Monthly</option>
          </select>
        </WF>
      </div>
      <div className="grid-2">
        <WF label="Lease Term">
          <select className="select" value={form.leasing__term} onChange={e=>set('leasing__term',e.target.value)}>
            <option value="">No preference</option>
            <option value="6 months">6 months</option>
            <option value="12 months">12 months</option>
            <option value="18 months">18 months</option>
            <option value="24 months">24 months</option>
            <option value="periodic">Periodic</option>
          </select>
        </WF>
        <WF label="Bond (weeks)"><input className="input" type="number" value={form.leasing__rental_bond_weeks} onChange={e=>set('leasing__rental_bond_weeks',e.target.value)} /></WF>
      </div>
      <div className="grid-2">
        <WF label="Payment Frequency to Owner">
          <select className="select" value={form.leasing__payment_frequency} onChange={e=>set('leasing__payment_frequency',e.target.value)}>
            <option value="">Select…</option>
            <option value="weekly">Weekly</option>
            <option value="fortnightly">Fortnightly</option>
            <option value="monthly_start">Monthly — start of month</option>
            <option value="monthly_end">Monthly — end of month</option>
          </select>
        </WF>
        <WF label="Termination Notice (days)">
          <input className="input" type="number" value={form.agreement__termination_days} onChange={e=>set('agreement__termination_days',e.target.value)} />
        </WF>
      </div>
      <WRadio name="leasing__signboard_consent" label="Owner consents to 'For Lease' signboard at front of property?" value={form.leasing__signboard_consent} onChange={v=>set('leasing__signboard_consent',v)} />
      <div style={{borderTop:'1px solid var(--fhq-border)',paddingTop:16,marginTop:4}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12,color:'var(--fhq-text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Agent Fees</div>
        <div className="grid-2">
          <WF label="Management Fee (%)"><input className="input" type="number" value={form.fees__management_pct} placeholder="8.80" onChange={e=>set('fees__management_pct',e.target.value)} /></WF>
          <WF label="Leasing Fee"><input className="input" value={form.fees__letting_fee} placeholder="1 week + GST" onChange={e=>set('fees__letting_fee',e.target.value)} /></WF>
        </div>
        <div className="grid-2">
          <WF label="Tenancy Preparation Fee ($)"><input className="input" type="number" value={form.fees__admin_fee} onChange={e=>set('fees__admin_fee',e.target.value)} /></WF>
          <WF label="Lease Renewal Fee"><input className="input" value={form.fees__lease_renewal_fee} onChange={e=>set('fees__lease_renewal_fee',e.target.value)} /></WF>
        </div>
      </div>
    </div>
  );
}

function StepAuthority({ form, set }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <WF label="Repairs Limit ($)"><input className="input" type="number" value={form.authority__repairs_limit} onChange={e=>set('authority__repairs_limit',e.target.value)} /></WF>
      <div style={{fontSize:13,fontWeight:700,color:'var(--fhq-text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Agent Authorities</div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <WChk name="authority__select_tenants" label="Select tenants" checked={form.authority__select_tenants} onChange={e=>set('authority__select_tenants',e.target.checked)} />
        <WChk name="authority__sign_tenancy" label="Sign tenancy agreements" checked={form.authority__sign_tenancy} onChange={e=>set('authority__sign_tenancy',e.target.checked)} />
        <WChk name="authority__collect_rent" label="Collect rent" checked={form.authority__collect_rent} onChange={e=>set('authority__collect_rent',e.target.checked)} />
        <WChk name="authority__receive_bond" label="Receive and disburse bonds" checked={form.authority__receive_bond} onChange={e=>set('authority__receive_bond',e.target.checked)} />
        <WChk name="authority__ncat_proceedings" label="Represent at NCAT proceedings" checked={form.authority__ncat_proceedings} onChange={e=>set('authority__ncat_proceedings',e.target.checked)} />
        <WChk name="authority__issue_receipts" label="Issue rental receipts" checked={form.authority__issue_receipts} onChange={e=>set('authority__issue_receipts',e.target.checked)} />
        <WChk name="authority__bond_claims" label="Make bond claims on behalf of owner" checked={form.authority__bond_claims} onChange={e=>set('authority__bond_claims',e.target.checked)} />
      </div>
      <div style={{fontSize:13,fontWeight:600,color:'var(--fhq-text-muted)',marginTop:4}}>Re-leasing / Rent Review</div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <WChk name="authority__re_lease" label="Re-lease property at end of tenancy" checked={form.authority__re_lease} onChange={e=>set('authority__re_lease',e.target.checked)} />
        <WChk name="authority__review_rent" label="Review rent at lease renewal" checked={form.authority__review_rent} onChange={e=>set('authority__review_rent',e.target.checked)} />
        <WChk name="authority__refer_principal" label="Refer to principal before re-leasing" checked={form.authority__refer_principal} onChange={e=>set('authority__refer_principal',e.target.checked)} />
      </div>
      <div style={{borderTop:'1px solid var(--fhq-border)',paddingTop:16}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12,color:'var(--fhq-text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Disbursements</div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <WChk name="disb__council_rates" label="Council rates" checked={form.disb__council_rates} onChange={e=>set('disb__council_rates',e.target.checked)} />
          <WChk name="disb__water_rates" label="Water / sewerage rates" checked={form.disb__water_rates} onChange={e=>set('disb__water_rates',e.target.checked)} />
          <WChk name="disb__insurance" label="Insurance premiums" checked={form.disb__insurance} onChange={e=>set('disb__insurance',e.target.checked)} />
          <WChk name="disb__strata_levies" label="Strata levies" checked={form.disb__strata_levies} onChange={e=>set('disb__strata_levies',e.target.checked)} />
          <WChk name="disb__maintenance_contracts" label="Maintenance contracts (garden, pool, etc.)" checked={form.disb__maintenance_contracts} onChange={e=>set('disb__maintenance_contracts',e.target.checked)} />
        </div>
      </div>
    </div>
  );
}

function StepDisclosures({ form, set }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:4}}>
      <div style={{padding:'10px 14px',background:'#fff4d6',border:'1px solid #fde68a',borderRadius:6,fontSize:13,marginBottom:12}}>
        <strong>Required disclosures</strong> under the Residential Tenancies Act 2010 (NSW)
      </div>
      <WRadio name="disclosure__flooding" label="Flooding or bushfire in last 5 years?" value={form.disclosure__flooding} onChange={v=>set('disclosure__flooding',v)} />
      <WRadio name="disclosure__health_safety" label="Significant health or safety risks?" value={form.disclosure__health_safety} onChange={v=>set('disclosure__health_safety',v)} />
      <WRadio name="disclosure__violent_crime" label="Serious violent crime in last 5 years?" value={form.disclosure__violent_crime} onChange={v=>set('disclosure__violent_crime',v)} />
      <WRadio name="disclosure__asbestos" label="Listed on LFAI (Loose-fill Asbestos) Register?" value={form.disclosure__asbestos} onChange={v=>set('disclosure__asbestos',v)} />
      <WRadio name="disclosure__proposed_sale" label="Proposed sale of the premises?" value={form.disclosure__proposed_sale} onChange={v=>set('disclosure__proposed_sale',v)} />
      <WRadio name="disclosure__water_efficiency" label="Prescribed water efficiency measures in place?" value={form.disclosure__water_efficiency} onChange={v=>set('disclosure__water_efficiency',v)} />
      {form.property__has_pool && <WRadio name="disclosure__pool_registered" label="Pool registered on NSW Swimming Pool Register?" value={form.disclosure__pool_registered} onChange={v=>set('disclosure__pool_registered',v)} />}
    </div>
  );
}

function StepBankAccounts({ form, set }) {
  const hasOwnerBank = !!(form.owner_bank__bsb || form.owner_bank__account_no);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:24}}>

      {/* ── Owner bank account ─────────────────────────────── */}
      <div>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
          <div style={{fontWeight:700,fontSize:14}}>Owner Bank Account</div>
          <span style={{fontSize:11,padding:'2px 8px',borderRadius:99,background:'#dbeafe',color:'#1d4ed8',fontWeight:700}}>Pre-filled from intake</span>
          {hasOwnerBank && <span style={{fontSize:11,color:'#16a34a',fontWeight:600}}>✓ Received</span>}
        </div>
        <p style={{fontSize:13,color:'var(--fhq-text-muted)',margin:'0 0 14px'}}>
          The account rental income is remitted to the owner from the agency trust account.
        </p>

        {/* Payment method */}
        <WF label="Payment Method">
          <div style={{display:'flex',gap:10}}>
            {[['eft','EFT (Electronic Transfer)'],['cheque','Cheque']].map(([v,l])=>(
              <button key={v} type="button" onClick={()=>set('owner_bank__payment_method',v)}
                style={{
                  flex:1, padding:'10px 14px', borderRadius:8, border:'1.5px solid',
                  borderColor: form.owner_bank__payment_method===v ? 'var(--fhq-graphite)' : 'var(--fhq-border)',
                  background: form.owner_bank__payment_method===v ? 'var(--fhq-signal-lime)' : 'var(--fhq-surface)',
                  color: form.owner_bank__payment_method===v ? 'var(--fhq-graphite)' : 'var(--fhq-text-muted)',
                  fontWeight: form.owner_bank__payment_method===v ? 700 : 500,
                  fontSize:13, cursor:'pointer', fontFamily:'var(--fhq-font-sans)',
                }}>{l}</button>
            ))}
          </div>
        </WF>

        {form.owner_bank__payment_method !== 'cheque' && (
          <>
            <div className="grid-2" style={{marginTop:12}}>
              <WF label="Bank Name">
                <input className="input" value={form.owner_bank__bank_name} placeholder="e.g. Commonwealth Bank"
                  onChange={e=>set('owner_bank__bank_name',e.target.value)} />
              </WF>
              <WF label="Account Name">
                <input className="input" value={form.owner_bank__account_name} placeholder="e.g. J Smith"
                  onChange={e=>set('owner_bank__account_name',e.target.value)} />
              </WF>
            </div>
            <div className="grid-2" style={{marginTop:12}}>
              <WF label="BSB" required>
                <input className="input" value={form.owner_bank__bsb} placeholder="062-000"
                  onChange={e=>set('owner_bank__bsb',e.target.value)} />
              </WF>
              <WF label="Account Number" required>
                <input className="input" value={form.owner_bank__account_no} placeholder="12345678"
                  onChange={e=>set('owner_bank__account_no',e.target.value)} />
              </WF>
            </div>
          </>
        )}
      </div>

      {/* Divider */}
      <div style={{borderTop:'1px solid var(--fhq-border)'}} />

      {/* ── Agency trust account ───────────────────────────── */}
      <div>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
          <div style={{fontWeight:700,fontSize:14}}>Agency Trust Account</div>
          <span style={{fontSize:11,padding:'2px 8px',borderRadius:99,background:'#f3f4f6',color:'#4b5563',fontWeight:700}}>From agency profile</span>
        </div>
        <p style={{fontSize:13,color:'var(--fhq-text-muted)',margin:'0 0 14px'}}>
          The account rental income is received into from tenants. This pre-fills from your agency's saved profile — update your profile to change the default.
        </p>
        <div className="grid-2">
          <WF label="Bank Name">
            <input className="input" value={form.trust__bank_name} placeholder="Commonwealth Bank"
              onChange={e=>set('trust__bank_name',e.target.value)} />
          </WF>
          <WF label="Account Name">
            <input className="input" value={form.trust__account_name}
              onChange={e=>set('trust__account_name',e.target.value)} />
          </WF>
        </div>
        <div className="grid-2" style={{marginTop:12}}>
          <WF label="BSB">
            <input className="input" value={form.trust__bsb} placeholder="062-000"
              onChange={e=>set('trust__bsb',e.target.value)} />
          </WF>
          <WF label="Account Number">
            <input className="input" value={form.trust__account_no}
              onChange={e=>set('trust__account_no',e.target.value)} />
          </WF>
        </div>
      </div>

      {/* ── Agent / Licensee (read-only) ───────────────────── */}
      <div style={{borderTop:'1px solid var(--fhq-border)',paddingTop:20}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
          <div style={{fontWeight:700,fontSize:14}}>Agent & Agency</div>
          <span style={{fontSize:11,padding:'2px 8px',borderRadius:99,background:'#f3f4f6',color:'#4b5563',fontWeight:700}}>From agency profile · read-only</span>
        </div>
        <p style={{fontSize:12,color:'var(--fhq-text-muted)',margin:'0 0 12px',lineHeight:1.5}}>
          These details are pulled from your agency account and appear in the printed agreement.
          To update them, go to <strong>Settings → Agency Profile</strong>.
        </p>
        <div style={{
          display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,
          background:'var(--fhq-surface-muted)',borderRadius:8,padding:'14px 16px',
          border:'1px solid var(--fhq-border)',
        }}>
          {[
            ['Agency / Trading Name', form.agent__name],
            ['Licence No.', form.agent__licence_no],
            ['ABN', form.agent__abn],
            ['Email', form.agent__email],
            ['Phone', form.agent__phone_work],
            ['Address', [form.agent__address_street, form.agent__address_suburb, form.agent__address_state].filter(Boolean).join(', ')],
          ].map(([label,value])=>(
            <div key={label} style={{padding:'4px 0'}}>
              <div style={{fontSize:11,color:'var(--fhq-text-muted)',marginBottom:1}}>{label}</div>
              <div style={{fontSize:13,fontWeight:500}}>{value || <span style={{color:'var(--fhq-border)'}}>—</span>}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function StepReview({ form, saveError, saved }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {saveError ? (
        <div style={{padding:'14px 18px',background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:8,fontSize:14,color:'#dc2626'}}>
          ✕ Error saving: {saveError}
        </div>
      ) : saved ? (
        <div style={{padding:'14px 18px',background:'var(--fhq-success-soft)',border:'1px solid var(--fhq-success)',borderRadius:8,fontSize:14,color:'var(--fhq-success)'}}>
          ✓ Saved! Click "↓ Generate PDF" in the top-right to download the FM00100.
        </div>
      ) : (
        <div style={{padding:'14px 18px',background:'var(--fhq-success-soft)',border:'1px solid var(--fhq-success)',borderRadius:8,fontSize:14,color:'var(--fhq-success)'}}>
          ✓ All sections complete. Review below then click Save & Complete.
        </div>
      )}
      {[
        ['Principal / Owner 1', [
          ['Name', form.party_0__full_name || form.party_0__company_name],
          ['Email', form.party_0__email],
          ['Mobile', form.party_0__phone_mobile],
          ['Address', [form.party_0__address, form.party_0__suburb, form.party_0__state].filter(Boolean).join(', ')],
        ]],
        ...(form.party_1__full_name || form.party_1__email ? [['Owner 2', [
          ['Name', form.party_1__full_name || form.party_1__company_name],
          ['Email', form.party_1__email],
          ['Mobile', form.party_1__phone_mobile],
        ]]] : []),
        ['Property', [
          ['Address', form.property__street_address],
          ['Suburb / State', `${form.property__suburb} ${form.property__state} ${form.property__postcode}`.trim()],
          ['Type', form.property__type],
          ['Beds / Baths', [form.property__bedrooms && `${form.property__bedrooms} bed`, form.property__bathrooms && `${form.property__bathrooms} bath`].filter(Boolean).join(' · ')],
        ]],
        ['Agreement', [
          ['Start Date', form.agreement__start_date],
          ['Rent', form.leasing__rent_amount ? `$${form.leasing__rent_amount} ${form.leasing__rent_period}` : ''],
          ['Lease Term', form.leasing__term],
          ['Mgmt Fee', form.fees__management_pct ? `${form.fees__management_pct}%` : ''],
          ['Repairs Limit', form.authority__repairs_limit ? `$${form.authority__repairs_limit}` : ''],
          ['Payment Frequency', form.leasing__payment_frequency ? form.leasing__payment_frequency.replace(/_/g,' ') : ''],
          ['Signboard', form.leasing__signboard_consent],
        ]],
        ['Owner Bank Account', [
          ['Payment Method', form.owner_bank__payment_method === 'cheque' ? 'Cheque' : 'EFT'],
          ...(form.owner_bank__payment_method !== 'cheque' ? [
            ['Bank', form.owner_bank__bank_name],
            ['Account Name', form.owner_bank__account_name],
            ['BSB', form.owner_bank__bsb],
            ['Account No.', form.owner_bank__account_no],
          ] : []),
        ]],
        ['Agency Trust Account', [
          ['Bank', form.trust__bank_name],
          ['Account Name', form.trust__account_name],
          ['BSB', form.trust__bsb],
          ['Account No.', form.trust__account_no],
        ]],
        ['Agent & Agency', [
          ['Agency', form.agent__name],
          ['Licence No.', form.agent__licence_no],
          ['ABN', form.agent__abn],
        ]],
      ].map(([title, rows]) => (
        <div key={title} className="card card-pad" style={{padding:'14px 18px'}}>
          <div style={{fontSize:12,fontWeight:700,color:'var(--fhq-text-muted)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:10}}>{title}</div>
          {rows.map(([label, value]) => value ? (
            <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid var(--fhq-border)',fontSize:13}}>
              <span style={{color:'var(--fhq-text-muted)'}}>{label}</span>
              <span style={{fontWeight:500}}>{value}</span>
            </div>
          ) : null)}
        </div>
      ))}
    </div>
  );
}

function StepPreviewSign({ tx, form }) {
  const [signatories, setSignatories] = useState([
    { id: 1, role: 'Principal (Landlord)', name: form.party_0__name_full || form.party_0__full_name || tx.client_name || '', email: form.party_0__email || tx.client_email || '', order: 1 },
    { id: 2, role: 'Agent / Licensee', name: form.agent__name || 'Agent', email: form.agent__email || 'agent@demopm.com.au', order: 2 },
  ]);
  const [attachments, setAttachments] = useState([]);
  const [formQueue, setFormQueue] = useState([
    { id: 'landlord-info', name: 'Landlord Information Statement', description: 'Required — NSW Fair Trading', required: true, queued: true },
    { id: 'material-facts', name: 'Material Facts Disclosure', description: 'Required — RTA s26', required: true, queued: true },
    { id: 'pool-safety', name: 'Pool Safety Certificate', description: 'Required if pool present', required: false, queued: !!form.property__has_pool },
    { id: 'strata-info', name: 'Strata Information Statement', description: 'Required if strata scheme', required: false, queued: !!form.property__is_strata },
    { id: 'smoke-alarm', name: 'Smoke Alarm Compliance', description: 'Recommended', required: false, queued: false },
    { id: 'water-efficiency', name: 'Water Efficiency Certificate', description: 'Required if claiming water usage', required: false, queued: form.disclosure__water_efficiency === 'yes' },
  ]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState('');


  const updateSignatory = (id, field, value) =>
    setSignatories(s => s.map(x => x.id === id ? { ...x, [field]: value } : x));

  const addSignatory = () => setSignatories(s => [...s, {
    id: Date.now(), role: 'Additional Signatory', name: '', email: '', order: s.length + 1
  }]);

  const removeSignatory = (id) => setSignatories(s => s.filter(x => x.id !== id));

  const toggleQueued = (id) => setFormQueue(q => q.map(f => f.id === id ? { ...f, queued: !f.queued } : f));

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(a => [...a, ...files.map(f => ({ name: f.name, size: f.size, file: f }))]);
  };

  const queuedCount = formQueue.filter(f => f.queued).length;

  const panelSection = (title, badge, children) => (
    <div style={{ borderBottom: '1px solid var(--fhq-border)', paddingBottom: 16, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fhq-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
        {badge != null && <span style={{ background: 'var(--fhq-signal-lime)', color: 'var(--fhq-graphite)', borderRadius: 100, fontSize: 10, fontWeight: 800, padding: '2px 7px' }}>{badge}</span>}
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, minHeight: '75vh' }}>
      {/* Agreement HTML Preview + completion banner */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minHeight: 0 }}>
        <FM00100CompletionBanner data={form} />
        <AgreementPreview form={form} tx={tx} />
      </div>

      {/* Action Panel */}
      <div style={{ background: 'var(--fhq-surface)', border: '1px solid var(--fhq-border)', borderRadius: 'var(--fhq-radius-md)', padding: '20px', overflowY: 'auto', maxHeight: '75vh' }}>

        {/* Send status */}
        {sent ? (
          <div style={{ padding: '14px', background: 'var(--fhq-success-soft)', border: '1px solid var(--fhq-success)', borderRadius: 8, fontSize: 13, color: 'var(--fhq-success)', marginBottom: 16, textAlign: 'center' }}>
            ✓ Sent for signing to {signatories.length} {signatories.length === 1 ? 'party' : 'parties'}
          </div>
        ) : (
          <button className="btn btn-primary" style={{ width: '100%', marginBottom: 20, padding: '12px' }}
            onClick={() => setShowSendModal(true)}>
            Send for Signing
          </button>
        )}

        {/* VOI — Identity Verification */}
        {panelSection('Identity Verification (VOI)', null, <>
          <p style={{ fontSize: 12, color: 'var(--fhq-text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
            Verify each signatory's identity before signing. Choose a verification method:
          </p>
          {[
            { name: 'ConnectID', desc: 'Verify via ANZ, CBA, NAB or Westpac banking app', tag: 'Recommended', color: '#2563eb' },
            { name: 'Australia Post Digital iD', desc: 'In-person or online via Australia Post', tag: 'Coming soon', color: '#dc2626' },
            { name: 'Frankie One', desc: 'Automated KYC / AML identity checks', tag: 'Coming soon', color: '#dc2626' },
            { name: 'Manual VOI', desc: 'Agent sights original documents in person', tag: 'Available', color: '#059669' },
          ].map(v => (
            <div key={v.name} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px', marginBottom: 8, borderRadius: 6,
              border: '1px solid var(--fhq-border)', background: 'var(--fhq-surface-muted)',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{v.name}</div>
                <div style={{ fontSize: 11, color: 'var(--fhq-text-muted)', marginTop: 2 }}>{v.desc}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: v.color, background: `${v.color}18`, padding: '3px 8px', borderRadius: 99, flexShrink: 0, marginLeft: 8 }}>
                {v.tag}
              </span>
            </div>
          ))}
          <p style={{ fontSize: 11, color: 'var(--fhq-text-muted)', marginTop: 4, lineHeight: 1.5 }}>
            VOI send links are managed from the Tasks panel. Integrations with ConnectID, AusPost and Frankie One are on the roadmap.
          </p>
        </>)}

        {/* Signatories */}
        {panelSection('Signatories', signatories.length, <>
          {signatories.map(s => (
            <div key={s.id} style={{ background: 'var(--fhq-surface-muted)', borderRadius: 8, padding: '10px 12px', marginBottom: 8, position: 'relative' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fhq-signal-lime)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {s.order}. {s.role}
              </div>
              <input className="input" style={{ marginBottom: 6, fontSize: 13 }} value={s.name}
                placeholder="Full name" onChange={e => updateSignatory(s.id, 'name', e.target.value)} />
              <input className="input" style={{ fontSize: 13 }} value={s.email} type="email"
                placeholder="Email address" onChange={e => updateSignatory(s.id, 'email', e.target.value)} />
              {signatories.length > 1 && (
                <button onClick={() => removeSignatory(s.id)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fhq-text-muted)', fontSize: 14 }}>×</button>
              )}
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 4 }} onClick={addSignatory}>
            + Add Signatory
          </button>
        </>)}

        {/* Form Queue */}
        {panelSection('Form Queue', queuedCount, <>
          <p style={{ fontSize: 12, color: 'var(--fhq-text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
            Select additional forms to send with this agreement:
          </p>
          {formQueue.map(f => (
            <label key={f.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 10, padding: '8px 10px', background: f.queued ? 'rgba(183,255,74,0.07)' : 'transparent', borderRadius: 6, border: `1px solid ${f.queued ? 'rgba(183,255,74,0.3)' : 'var(--fhq-border)'}` }}>
              <input type="checkbox" checked={f.queued} onChange={() => toggleQueued(f.id)}
                style={{ marginTop: 2, accentColor: 'var(--fhq-signal-lime)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{f.name}</div>
                <div style={{ fontSize: 11, color: 'var(--fhq-text-muted)', marginTop: 2 }}>{f.description}</div>
              </div>
              {f.required && <span style={{ fontSize: 10, color: 'var(--fhq-error)', fontWeight: 700, flexShrink: 0, marginLeft: 'auto', marginTop: 2 }}>REQ</span>}
            </label>
          ))}
        </>)}

        {/* Attachments */}
        {panelSection('Attachments', attachments.length || null, <>
          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '16px', border: '2px dashed var(--fhq-border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: 'var(--fhq-text-muted)', marginBottom: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            <span>Click to attach files</span>
            <input type="file" multiple style={{ display: 'none' }} onChange={handleFileUpload} />
          </label>
          {attachments.map((a, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--fhq-surface-muted)', borderRadius: 6, marginBottom: 4, fontSize: 12 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{a.name}</span>
              <button onClick={() => setAttachments(att => att.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fhq-text-muted)', fontSize: 14, flexShrink: 0 }}>×</button>
            </div>
          ))}
        </>)}

        {/* Note */}
        <p style={{ fontSize: 11, color: 'var(--fhq-text-soft)', lineHeight: 1.6, marginTop: 8 }}>
          E-signing powered by Form.io E-Sign+ · DocuSign integration available on upgrade
        </p>
      </div>

      {/* Send Modal */}
      {showSendModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowSendModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>Send for Signing</h2>
              <button onClick={() => setShowSendModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--fhq-text-muted)' }}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '12px 16px', background: 'var(--fhq-surface-muted)', borderRadius: 8, fontSize: 13 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>The following will be sent:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div>FM00100 — Management Agency Agreement</div>
                  {formQueue.filter(f => f.queued).map(f => <div key={f.id}>{f.name}</div>)}
                  {attachments.map((a, i) => <div key={i}>{a.name}</div>)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Signing order:</div>
                {signatories.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--fhq-surface-muted)', borderRadius: 6, marginBottom: 6, fontSize: 13 }}>
                    <span style={{ fontWeight: 500 }}>{s.order}. {s.name || 'Unnamed'}</span>
                    <span style={{ color: 'var(--fhq-text-muted)' }}>{s.email}</span>
                  </div>
                ))}
              </div>
              <div className="field">
                <label>Personal message (optional)</label>
                <textarea className="input" rows={3} style={{ resize: 'vertical' }}
                  placeholder="Please review and sign the attached management authority at your earliest convenience."
                  value={sendingEmail} onChange={e => setSendingEmail(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowSendModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { setShowSendModal(false); setSent(true); }}>
                ✉ Send Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FM00100Wizard({ tx, onComplete }) {
  const prefill = tx.form_data || {};
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const pf = (key, fallback = '') => prefill[key] !== undefined ? prefill[key] : fallback;
  const pfBool = (key, def = false) => prefill[key] !== undefined ? prefill[key] : def;

  const [form, setForm] = useState({
    // Principal / Owner 1
    party_0__full_name: pf('party_0__full_name', tx.client_name || ''),
    party_0__company_name: pf('party_0__company_name'),
    party_0__abn: pf('party_0__abn'),
    party_0__acn: pf('party_0__acn'),
    party_0__is_gst_registered: pfBool('party_0__is_gst_registered'),
    party_0__address: pf('party_0__address'),
    party_0__suburb: pf('party_0__suburb'),
    party_0__state: pf('party_0__state', 'NSW'),
    party_0__postcode: pf('party_0__postcode'),
    party_0__phone_mobile: pf('party_0__phone_mobile', tx.client_mobile || ''),
    party_0__phone_work: pf('party_0__phone_work'),
    party_0__phone_home: pf('party_0__phone_home'),
    party_0__email: pf('party_0__email', tx.client_email || ''),
    // Owner 2 (optional)
    party_1__full_name: pf('party_1__full_name'),
    party_1__company_name: pf('party_1__company_name'),
    party_1__abn: pf('party_1__abn'),
    party_1__acn: pf('party_1__acn'),
    party_1__is_gst_registered: pfBool('party_1__is_gst_registered'),
    party_1__address: pf('party_1__address'),
    party_1__suburb: pf('party_1__suburb'),
    party_1__state: pf('party_1__state', 'NSW'),
    party_1__postcode: pf('party_1__postcode'),
    party_1__phone_mobile: pf('party_1__phone_mobile'),
    party_1__phone_work: pf('party_1__phone_work'),
    party_1__phone_home: pf('party_1__phone_home'),
    party_1__email: pf('party_1__email'),
    // Property
    property__street_address: pf('property__street_address', tx.property_address || ''),
    property__suburb: pf('property__suburb'),
    property__state: pf('property__state', 'NSW'),
    property__postcode: pf('property__postcode'),
    property__type: pf('property__type'),
    property__bedrooms: pf('property__bedrooms'),
    property__bathrooms: pf('property__bathrooms'),
    property__parking: pf('property__parking'),
    property__features: pf('property__features', []),
    property__is_furnished: pfBool('property__is_furnished'),
    property__has_garage: pfBool('property__has_garage'),
    property__nbn_ready: pfBool('property__nbn_ready'),
    property__is_strata: pfBool('property__is_strata'),
    property__strata_plan_no: pf('property__strata_plan_no'),
    property__strata_lot_no: pf('property__strata_lot_no'),
    property__has_pool: pfBool('property__has_pool'),
    property__condition_exterior: pf('property__condition_exterior'),
    property__condition_interior: pf('property__condition_interior'),
    property__current_situation: pf('property__current_situation'),
    property__access_method: pf('property__access_method'),
    // Agreement / Leasing
    agreement__start_date: isoToAU(pf('agreement__start_date', pf('leasing__start_date'))),
    agreement__termination_days: pf('agreement__termination_days', '30'),
    leasing__term: pf('leasing__term'),
    leasing__rent_amount: pf('leasing__rent_amount'),
    leasing__rent_period: pf('leasing__rent_period', 'weekly'),
    leasing__rental_bond_weeks: pf('leasing__rental_bond_weeks', '4'),
    leasing__payment_frequency: pf('leasing__payment_frequency'),
    leasing__signboard_consent: pf('leasing__signboard_consent') === true ? 'yes' : pf('leasing__signboard_consent') === false ? 'no' : '',
    leasing__investment_goals: pf('leasing__investment_goals'),
    // Fees
    fees__letting_fee: pf('fees__letting_fee'),
    fees__admin_fee: pf('fees__admin_fee'),
    fees__management_pct: pf('fees__management_pct'),
    fees__lease_renewal_fee: pf('fees__lease_renewal_fee'),
    // Authority
    authority__repairs_limit: pf('authority__repairs_limit', '500'),
    authority__select_tenants: pfBool('authority__select_tenants', true),
    authority__sign_tenancy: pfBool('authority__sign_tenancy', true),
    authority__collect_rent: pfBool('authority__collect_rent', true),
    authority__receive_bond: pfBool('authority__receive_bond', true),
    authority__ncat_proceedings: pfBool('authority__ncat_proceedings', true),
    authority__issue_receipts: pfBool('authority__issue_receipts', true),
    authority__bond_claims: pfBool('authority__bond_claims', true),
    authority__re_lease: pfBool('authority__re_lease', true),
    authority__review_rent: pfBool('authority__review_rent', true),
    authority__refer_principal: pfBool('authority__refer_principal', false),
    // Disbursements
    disb__council_rates: pfBool('disb__council_rates'),
    disb__water_rates: pfBool('disb__water_rates'),
    disb__insurance: pfBool('disb__insurance'),
    disb__strata_levies: pfBool('disb__strata_levies'),
    disb__maintenance_contracts: pfBool('disb__maintenance_contracts'),
    // Disclosures
    disclosure__flooding: pf('disclosure__flooding'),
    disclosure__health_safety: pf('disclosure__health_safety'),
    disclosure__violent_crime: pf('disclosure__violent_crime'),
    disclosure__asbestos: pf('disclosure__asbestos'),
    disclosure__proposed_sale: pf('disclosure__proposed_sale'),
    disclosure__water_efficiency: pf('disclosure__water_efficiency'),
    disclosure__pool_registered: pf('disclosure__pool_registered'),
    // Owner bank account (pre-filled from intake — where rent is remitted to)
    owner_bank__bank_name:    pf('owner_bank__bank_name'),
    owner_bank__account_name: pf('owner_bank__account_name'),
    owner_bank__bsb:          pf('owner_bank__bsb'),
    owner_bank__account_no:   pf('owner_bank__account_no'),
    owner_bank__payment_method: pf('owner_bank__payment_method', pf('management_authority__payment_method', 'eft')),
    // Agency trust account (pre-filled from agency profile — where rent is received from tenants)
    trust__bank_name:    pf('trust__bank_name',    pf('management_authority__trust_account_name')),
    trust__account_name: pf('trust__account_name', pf('management_authority__trust_account_name')),
    trust__bsb:          pf('trust__bsb',          pf('management_authority__trust_bsb')),
    trust__account_no:   pf('trust__account_no',   pf('management_authority__trust_account_no')),
    // Agent / agency (read-only in wizard — sourced from agency profile)
    agent__name:       pf('agent__name',       pf('agent__trading_as', '')),
    agent__licence_no: pf('agent__licence_no', ''),
    agent__abn:        pf('agent__abn',        ''),
    agent__email:      pf('agent__email',      ''),
    agent__phone_work: pf('agent__phone_work', ''),
    agent__address_street:   pf('agent__address_street',  pf('agent__address', '')),
    agent__address_suburb:   pf('agent__address_suburb',  pf('agent__suburb',  '')),
    agent__address_state:    pf('agent__address_state',   pf('agent__state',   'NSW')),
    agent__address_postcode: pf('agent__address_postcode',pf('agent__postcode','')),
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    console.log('Saving transaction', tx.id, 'with form data', form);
    try {
      await api.patch(`/v1/transactions/${tx.id}/complete`, { formData: form });
      setSaved(true);
      onComplete(form);
    } catch (err) {
      console.error('Save error:', err);
      setSaveError(err.response?.data?.error || err.message || 'Save failed — check console');
    } finally {
      setSaving(false);
    }
  };

  const stepComponents = [
    <StepPrincipal key="principal" form={form} set={set} />,
    <StepProperty key="property" form={form} set={set} />,
    <StepFees key="fees" form={form} set={set} />,
    <StepAuthority key="authority" form={form} set={set} />,
    <StepDisclosures key="disclosures" form={form} set={set} />,
    <StepBankAccounts key="bank" form={form} set={set} />,
    <StepReview key="review" form={form} saveError={saveError} saved={saved} />,
    <StepPreviewSign key="preview" tx={tx} form={form} />,
  ];

  return (
    <div>
      {/* Step indicators */}
      <div style={{display:'flex',gap:0,marginBottom:24,background:'var(--fhq-surface)',border:'1px solid var(--fhq-border)',borderRadius:'var(--fhq-radius-md)',overflow:'hidden'}}>
        {STEPS.map((s, i) => (
          <button key={i} onClick={() => setStep(i)} style={{
            flex:1, padding:'12px 8px', background: i===step ? 'var(--fhq-graphite)' : 'none',
            border:'none', borderRight: i<STEPS.length-1 ? '1px solid var(--fhq-border)' : 'none',
            cursor:'pointer', fontSize:12, fontWeight: i===step ? 700 : 500,
            color: i===step ? '#fff' : i<step ? 'var(--fhq-signal-lime)' : 'var(--fhq-text-muted)',
            textAlign:'center'
          }}>
            <div style={{fontSize:10,marginBottom:2,opacity:0.6}}>{i+1}</div>
            {s}
          </button>
        ))}
      </div>

      {step < STEPS.length - 1 ? (
        <div className="card" style={{marginBottom:20}}>
          <div style={{padding:'16px 24px',borderBottom:'1px solid var(--fhq-border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontWeight:700,fontSize:15}}>{STEPS[step]}</span>
            {VOICE_CONTEXTS[step] && (
              <VoiceButton
                context={VOICE_CONTEXTS[step]}
                label="Voice input"
                onExtract={fields => {
                  // Map feature string back to array if needed
                  if (typeof fields.property__features === 'string') {
                    fields.property__features = fields.property__features.split(',').map(s => s.trim()).filter(Boolean);
                  }
                  // Booleans come as strings "true"/"false" — keep as-is, set handles them
                  setForm(prev => ({ ...prev, ...fields }));
                }}
              />
            )}
          </div>
          <div style={{padding:'24px'}}>
            {stepComponents[step]}
          </div>
        </div>
      ) : (
        <div style={{marginBottom:20}}>
          {stepComponents[step]}
        </div>
      )}

      {/* Nav */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <button className="btn btn-ghost" onClick={() => setStep(s => Math.max(0, s-1))} disabled={step===0}>
          ← Previous
        </button>
        <span style={{fontSize:13,color:'var(--fhq-text-muted)'}}>Step {step+1} of {STEPS.length}</span>
        {step === STEPS.length - 2 ? (
          <button className="btn btn-primary" onClick={async () => { await handleSave(); setStep(s => s+1); }}>
            Save & Preview →
          </button>
        ) : step < STEPS.length - 1 ? (
          <button className="btn btn-primary" onClick={() => setStep(s => s+1)}>
            Next →
          </button>
        ) : null}
      </div>
    </div>
  );
}
