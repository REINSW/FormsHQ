import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('agent@demopm.com.au');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--fhq-graphite)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'var(--fhq-signal-lime)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 22, color: 'var(--fhq-graphite)',
            margin: '0 auto 16px'
          }}>FH</div>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>FormsHQ</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 4 }}>REINSW Forms Platform</p>
        </div>

        <div className="card card-pad" style={{ background: 'var(--fhq-carbon)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field">
              <label style={{ color: 'rgba(255,255,255,0.5)' }}>Email</label>
              <input className="input" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              />
            </div>
            <div className="field">
              <label style={{ color: 'rgba(255,255,255,0.5)' }}>Password</label>
              <input className="input" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              />
            </div>

            {error && (
              <div className="alert alert-error" style={{ fontSize: 13 }}>{error}</div>
            )}

            <button type="submit" className="btn btn-lime btn-lg" disabled={loading}
              style={{ marginTop: 4, justifyContent: 'center' }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={{
            marginTop: 20, padding: '12px 14px',
            background: 'rgba(183,255,74,0.06)', border: '1px solid rgba(183,255,74,0.15)',
            borderRadius: 8, fontSize: 12, color: 'rgba(255,255,255,0.4)'
          }}>
            <strong style={{ color: 'var(--fhq-signal-lime)' }}>Demo credentials</strong><br />
            Email: agent@demopm.com.au<br />
            Password: demo1234
          </div>
        </div>
      </div>
    </div>
  );
}
