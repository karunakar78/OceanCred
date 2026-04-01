import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import { login, register, verifyCreditPublic } from '../api';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('company');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [verifyKey, setVerifyKey] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  async function handleAuth(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password, role);
        showToast('Login Successful!', 'success');
        setTimeout(() => {
          navigate(role === 'admin' ? '/admin' : '/company');
        }, 1000);
      } else {
        await register(email, password, role, name);
        showToast('Registration Complete! Please log in.', 'success');
        setIsLogin(true);
      }
    } catch (err) {
      showToast(err.message || 'Something went wrong', 'danger');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify() {
    if (!verifyKey.trim()) {
      setVerifyResult({ error: 'Please enter a key.' });
      return;
    }
    setVerifyLoading(true);
    setVerifyResult(null);
    try {
      const { ok, data } = await verifyCreditPublic(verifyKey.trim());
      if (!ok) {
        setVerifyResult({ error: data.detail || 'Invalid Key' });
      } else {
        setVerifyResult({ ok: true, payload: data.data });
      }
    } catch {
      setVerifyResult({ error: 'Failed to connect to verification server.' });
    } finally {
      setVerifyLoading(false);
    }
  }

  return (
    <div className="login-page">
      <AnimatedBackground />
      <Navbar brand="SeaCred" />
      <div className="login-layout">
        <div className="login-hero">
          <p className="hero-kicker">Verified marine plastic credits</p>
          <h1 className="hero-title">
            Offset with <span className="hero-accent">traceability</span> you can prove
          </h1>
          <p className="hero-sub">
            SeaCred links coastal collectors and companies through transparent auctions, wallet settlement,
            and public certificate verification—notions that stand up to audit.
          </p>
          <div className="hero-stats">
            {['Live marketplace', 'AI-verified consignments', 'Public key lookup'].map((t) => (
              <span key={t} className="hero-pill">
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="login-forms">
          <div className="glass-panel login-form-wrapper">
            <div className="auth-mode-toggle" role="tablist" aria-label="Account mode">
              <button
                type="button"
                role="tab"
                aria-selected={isLogin}
                className={isLogin ? 'is-active' : ''}
                onClick={() => setIsLogin(true)}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!isLogin}
                className={!isLogin ? 'is-active' : ''}
                onClick={() => setIsLogin(false)}
              >
                Register
              </button>
            </div>
            <h2 className="form-title">{isLogin ? 'Welcome back' : 'Create your account'}</h2>
            <form onSubmit={handleAuth}>
              {!isLogin && (
                <div className="form-group">
                  <label>Company or admin name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Acme Corporation"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              <div className="form-group">
                <label>Work email</label>
                <input
                  type="email"
                  className="form-control"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  className="form-control"
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="company">Company</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? 'Please wait…' : isLogin ? 'Continue to portal' : 'Create account'}
              </button>
            </form>
            <div className="form-footer">
              <p>
                {isLogin ? 'Need an account?' : 'Already registered?'}{' '}
                <button type="button" className="link-cyan" onClick={() => setIsLogin(!isLogin)}>
                  {isLogin ? 'Switch to register' : 'Back to sign in'}
                </button>
              </p>
              <p className="demo-tip">
                <strong className="text-success">Demo:</strong> sign in as Admin with{' '}
                <code className="demo-code">admin@seacred.com</code> / <code className="demo-code">admin123</code>.
              </p>
            </div>
          </div>

          <div className="glass-panel verify-panel">
            <p className="section-head__eyebrow" style={{ marginBottom: '0.5rem' }}>
              Public lookup
            </p>
            <h3>Verify a credit certificate</h3>
            <p className="verify-copy">
              Enter a credit key to confirm authenticity, weight, waste type, and the company to which the
              certificate is allotted.
            </p>
            <div className="verify-row">
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 9F4E-2B1A-…"
                value={verifyKey}
                onChange={(e) => setVerifyKey(e.target.value)}
              />
              <button type="button" className="btn btn-outline" onClick={handleVerify} disabled={verifyLoading}>
                {verifyLoading ? '…' : 'Verify'}
              </button>
            </div>
            <div className="verify-result">
              {verifyLoading && <p className="text-muted">Checking registry…</p>}
              {verifyResult?.error && <p className="text-danger">{verifyResult.error}</p>}
              {verifyResult?.ok && (
                <div className="verify-success">
                  <h4 className="text-success">Certificate verified</h4>
                  <p>
                    <strong>Weight:</strong> {verifyResult.payload.weight_kg} kg {verifyResult.payload.waste_type}
                  </p>
                  <p>
                    <strong>Allotted to:</strong> {verifyResult.payload.allotted_to_company}
                  </p>
                  <p>
                    <strong>Collected:</strong> {verifyResult.payload.collected_by} — {verifyResult.payload.gps_location}
                  </p>
                  <p className="text-muted verify-issued">
                    Issued {new Date(verifyResult.payload.issue_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
