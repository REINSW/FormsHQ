import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const STATUS_TABS = [
  { key: 'active', label: 'Active', statuses: ['draft', 'in_progress'] },
  { key: 'completed', label: 'Completed', statuses: ['completed'] },
  { key: 'archived', label: 'Archived', statuses: ['archived', 'cancelled'] },
  { key: 'all', label: 'All', statuses: null },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'archived', label: 'Archived' },
];

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionMenu, setActionMenu] = useState(null); // { id, x, y }
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    api.get('/v1/transactions').then(r => setTransactions(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Close action menu on outside click
  const menuRef = useRef(null);
  useEffect(() => {
    const handler = e => { if (!e.target.closest('.tx-action-menu')) setActionMenu(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const changeStatus = async (id, status) => {
    try {
      await api.patch(`/v1/transactions/${id}/status`, { status });
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t));
      setActionMenu(null);
    } catch {}
  };

  const openMenu = (e, txId) => {
    if (actionMenu?.id === txId) { setActionMenu(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    // Position below button, right-aligned; flip up if near bottom of viewport
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = 280;
    const top = spaceBelow < menuHeight ? rect.top - menuHeight : rect.bottom + 4;
    setActionMenu({ id: txId, x: rect.right, y: top });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/v1/transactions/${id}`);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch {}
    setConfirmDelete(null);
  };

  const handleDuplicate = async (id) => {
    try {
      const res = await api.post(`/v1/transactions/${id}/duplicate`);
      setTransactions(prev => [res.data, ...prev]);
      setActionMenu(null);
    } catch {}
  };

  const menuTx = actionMenu ? transactions.find(t => t.id === actionMenu.id) : null;

  const activeTab = STATUS_TABS.find(t => t.key === tab);
  const filtered = transactions.filter(tx => {
    const matchesTab = !activeTab.statuses || activeTab.statuses.includes(tx.status);
    const q = search.toLowerCase();
    const matchesSearch = !q || [tx.client_name, tx.property_address, tx.form_id, tx.client_email]
      .some(v => v && v.toLowerCase().includes(q));
    return matchesTab && matchesSearch;
  });

  // Detect duplicates: group by property_address, flag any address with 2+ active transactions
  const addressCounts = {};
  transactions.filter(t => ['draft','in_progress'].includes(t.status)).forEach(t => {
    if (t.property_address) {
      const key = t.property_address.toLowerCase().trim();
      addressCounts[key] = (addressCounts[key] || 0) + 1;
    }
  });
  const duplicateAddresses = new Set(Object.entries(addressCounts).filter(([,c]) => c > 1).map(([k]) => k));

  const tabCounts = STATUS_TABS.reduce((acc, t) => {
    acc[t.key] = t.statuses
      ? transactions.filter(tx => t.statuses.includes(tx.status)).length
      : transactions.length;
    return acc;
  }, {});

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p style={{ fontSize: 14, color: 'var(--fhq-text-muted)', marginTop: 2 }}>
            Management authorities in progress and completed
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="input" placeholder="Search client, property…" value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 240, fontSize: 13 }} />
        </div>
      </div>

      {/* Status tabs */}
      <div style={{ background: 'var(--fhq-surface)', borderBottom: '1px solid var(--fhq-border)', padding: '0 32px', display: 'flex', gap: 0 }}>
        {STATUS_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '12px 18px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
            color: tab === t.key ? 'var(--fhq-text)' : 'var(--fhq-text-muted)',
            borderBottom: tab === t.key ? '2px solid var(--fhq-graphite)' : '2px solid transparent',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            {t.label}
            {tabCounts[t.key] > 0 && (
              <span style={{
                background: tab === t.key ? 'var(--fhq-graphite)' : 'var(--fhq-surface-muted)',
                color: tab === t.key ? 'var(--fhq-signal-lime)' : 'var(--fhq-text-muted)',
                borderRadius: 100, fontSize: 11, fontWeight: 700, padding: '1px 7px',
              }}>{tabCounts[t.key]}</span>
            )}
          </button>
        ))}
      </div>

      <div className="page-body">
        {/* Duplicate warning */}
        {duplicateAddresses.size > 0 && (tab === 'active' || tab === 'all') && (
          <div className="alert alert-warning" style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 16 }}>⚠</span>
            <div>
              <strong>Possible duplicate transactions detected</strong>
              <div style={{ fontSize: 13, marginTop: 3 }}>
                {duplicateAddresses.size} {duplicateAddresses.size === 1 ? 'property has' : 'properties have'} multiple active transactions. Review and archive duplicates below.
              </div>
            </div>
          </div>
        )}

        <div className="table-wrap">
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <h3>{search ? 'No results' : `No ${tab === 'all' ? '' : tab} transactions`}</h3>
              <p>{search ? 'Try a different search term.' : 'Transactions are created from submitted intake requests.'}</p>
              {!search && <Link to="/intake" className="btn btn-primary">Go to Intake</Link>}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Form</th>
                  <th>Client</th>
                  <th>Property</th>
                  <th>Status</th>
                  <th>Created by</th>
                  <th>Date</th>
                  <th style={{ width: 48 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => {
                  const isDupe = tx.property_address && duplicateAddresses.has(tx.property_address.toLowerCase().trim());
                  return (
                    <tr key={tx.id}
                      onDoubleClick={() => navigate(`/transactions/${tx.id}`)}
                      style={{ background: isDupe ? '#fffbeb' : undefined, cursor: 'pointer' }}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{tx.form_id}</div>
                        <div style={{ fontSize: 11, color: 'var(--fhq-text-muted)' }}>MA Residential</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{tx.client_name || '—'}</div>
                        <div style={{ fontSize: 12, color: 'var(--fhq-text-muted)' }}>{tx.client_email}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13, color: 'var(--fhq-text)' }}>{tx.property_address || '—'}</div>
                        {isDupe && (
                          <div style={{ fontSize: 11, color: 'var(--fhq-warning)', fontWeight: 600, marginTop: 2 }}>
                            ⚠ Possible duplicate
                          </div>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={tx.status} />
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--fhq-text-muted)' }}>{tx.created_by_name}</td>
                      <td style={{ fontSize: 13, color: 'var(--fhq-text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(tx.created_at)}</td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm tx-action-menu"
                          onClick={e => openMenu(e, tx.id)}
                          style={{ padding: '5px 10px', fontSize: 16, lineHeight: 1 }}>
                          ⋯
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Fixed action menu — renders outside table so it's never clipped by overflow */}
      {actionMenu && menuTx && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setActionMenu(null)} />
          <div className="tx-action-menu" style={{
            position: 'fixed',
            right: window.innerWidth - actionMenu.x,
            top: actionMenu.y,
            zIndex: 100,
            background: 'var(--fhq-surface)',
            border: '1px solid var(--fhq-border)',
            borderRadius: 'var(--fhq-radius-sm)',
            boxShadow: 'var(--fhq-shadow-md)',
            minWidth: 200,
            overflow: 'hidden',
          }}>
            <MenuItem onClick={() => { navigate(`/transactions/${menuTx.id}`); setActionMenu(null); }}>
              Open →
            </MenuItem>
            <div style={{ borderTop: '1px solid var(--fhq-border)', margin: '2px 0' }} />
            <div style={{ padding: '6px 14px 4px', fontSize: 11, fontWeight: 700, color: 'var(--fhq-text-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Change Status
            </div>
            {STATUS_OPTIONS.filter(o => o.value !== menuTx.status).map(o => (
              <MenuItem key={o.value} onClick={() => changeStatus(menuTx.id, o.value)}>
                Set as {o.label}
              </MenuItem>
            ))}
            <div style={{ borderTop: '1px solid var(--fhq-border)', margin: '2px 0' }} />
            <MenuItem onClick={() => handleDuplicate(menuTx.id)}>
              Duplicate
            </MenuItem>
            <MenuItem danger onClick={() => { setConfirmDelete(menuTx); setActionMenu(null); }}>
              Delete
            </MenuItem>
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2>Delete transaction?</h2>
              <button onClick={() => setConfirmDelete(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--fhq-text-muted)' }}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--fhq-text-muted)' }}>
                This will permanently delete the transaction for <strong>{confirmDelete.client_name || 'this client'}</strong> at <strong>{confirmDelete.property_address || 'unknown property'}</strong>.
              </p>
              <p style={{ fontSize: 13, color: 'var(--fhq-text-muted)', marginTop: 10 }}>
                Tip: consider <strong>Archiving</strong> instead to keep a record.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete.id)}>
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MenuItem({ children, onClick, danger }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        padding: '9px 14px', border: 'none', cursor: 'pointer',
        fontSize: 13, fontWeight: 500,
        background: hover ? (danger ? 'var(--fhq-error-soft)' : 'var(--fhq-bg)') : 'none',
        color: danger ? 'var(--fhq-error)' : 'var(--fhq-text)',
        fontFamily: 'var(--fhq-font-sans)',
      }}>
      {children}
    </button>
  );
}

function StatusBadge({ status }) {
  const map = {
    draft: ['badge-neutral', 'Draft'],
    in_progress: ['badge-info', 'In Progress'],
    completed: ['badge-success', 'Completed'],
    cancelled: ['badge-error', 'Cancelled'],
    archived: ['badge-neutral', 'Archived'],
  };
  const [cls, label] = map[status] || ['badge-neutral', status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

function fmtDate(str) {
  return str ? new Date(str).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}
