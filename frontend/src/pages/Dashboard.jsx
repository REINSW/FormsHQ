import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();
  const [intakes, setIntakes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/v1/intake').then(r => setIntakes(r.data)),
      api.get('/v1/transactions').then(r => setTransactions(r.data))
    ]).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Intake Requests', value: intakes.length, sub: `${intakes.filter(i=>i.status==='submitted').length} submitted`, color: 'var(--fhq-signal-lime)' },
    { label: 'Transactions', value: transactions.length, sub: `${transactions.filter(t=>t.status==='completed').length} completed`, color: '#a5b4fc' },
    { label: 'In Progress', value: transactions.filter(t=>t.status==='in_progress').length, sub: 'awaiting agent', color: '#fde68a' },
    { label: 'PDFs Generated', value: transactions.filter(t=>t.pdf_path).length, sub: 'ready to sign', color: '#86efac' }
  ];

  const recent = [...intakes.slice(0,3), ...transactions.slice(0,3)]
    .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0,6);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p style={{ fontSize: 14, color: 'var(--fhq-text-muted)', marginTop: 2 }}>
            Good day, {user?.fullName?.split(' ')[0]}
          </p>
        </div>
        <Link to="/intake?new=1" className="btn btn-primary">
          + New Intake
        </Link>
      </div>

      <div className="page-body">
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ width: 32, height: 3, background: s.color, borderRadius: 100, marginBottom: 16 }} />
              <div className="label">{s.label}</div>
              {loading
                ? <div style={{ width: 40, height: 36, background: 'var(--fhq-surface-muted)', borderRadius: 6, marginBottom: 6 }} />
                : <div className="value">{s.value}</div>
              }
              <div className="sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--fhq-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Recent Activity</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/intake" className="btn btn-ghost btn-sm">All Intake</Link>
              <Link to="/transactions" className="btn btn-ghost btn-sm">All Transactions</Link>
            </div>
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : recent.length === 0 ? (
            <div className="empty-state">
              <h3>No activity yet</h3>
              <p>Create your first intake request to get started.</p>
              <Link to="/intake?new=1" className="btn btn-primary">Create Intake Request</Link>
            </div>
          ) : (
            <div>
              {recent.map(item => {
                const isIntake = 'token' in item;
                return (
                  <div key={item.id} style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid var(--fhq-border)',
                    display: 'flex', alignItems: 'center', gap: 12
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: isIntake ? 'var(--fhq-signal-lime-soft)' : 'var(--fhq-surface-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16
                    }}>
                      {isIntake ? '✦' : '◈'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {isIntake
                          ? (item.client_name || 'Unknown client')
                          : (item.client_name || item.property_address || 'Transaction')}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--fhq-text-muted)', marginTop: 2 }}>
                        {isIntake ? 'Intake request' : item.form_name || 'FM00100'}
                        {' · '}
                        {item.property_address || item.client_email || ''}
                      </div>
                    </div>
                    <StatusBadge status={item.status} />
                    <div style={{ fontSize: 12, color: 'var(--fhq-text-soft)', flexShrink: 0 }}>
                      {formatDate(item.created_at)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick start guide */}
        <div className="card card-pad" style={{
          background: 'linear-gradient(135deg, var(--fhq-graphite) 0%, #24282D 100%)',
          border: '1px solid rgba(183,255,74,0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div>
              <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                Getting started
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6 }}>
                Create an intake request → share the link with your client → review their responses → launch the pre-filled FM00100 wizard → download the completed PDF.
              </p>
            </div>
            <Link to="/intake?new=1" className="btn btn-lime" style={{ flexShrink: 0 }}>
              Start now →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: ['badge-warning', 'Pending'],
    submitted: ['badge-success', 'Submitted'],
    draft: ['badge-neutral', 'Draft'],
    in_progress: ['badge-info', 'In Progress'],
    completed: ['badge-success', 'Completed'],
    cancelled: ['badge-error', 'Cancelled'],
    expired: ['badge-error', 'Expired']
  };
  const [cls, label] = map[status] || ['badge-neutral', status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}
