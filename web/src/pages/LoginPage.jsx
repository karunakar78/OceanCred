import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import { login, register, verifyCreditPublic } from '../api';
import { useToast } from '../context/ToastContext';

const panelVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};

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
    <>
      <AnimatedBackground />
      <Navbar brand="SeaCred //" />
      <div className="login-layout">
        <motion.div
          className="login-hero"
          initial={{ opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="hero-kicker">Marine plastic · Verified credits</p>
          <h1 className="hero-title">
            Trade ESG offsets with <span className="text-gradient">confidence</span>
          </h1>
          <p className="hero-sub">
            SeaCred connects coastal collectors with companies through transparent auctions and public
            certificate verification.
          </p>
          <div className="hero-stats">
            {['Live bidding', 'AI-verified lots', 'Public key lookup'].map((t, i) => (
              <motion.span
                key={t}
                className="hero-pill"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.1 }}
              >
                {t}
              </motion.span>
            ))}
          </div>
        </motion.div>

        <div className="login-forms">
          <motion.div
            className="glass-panel login-form-wrapper"
            custom={0}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="form-title">{isLogin ? 'Secure Access' : 'Create Account'}</h2>
            <form onSubmit={handleAuth}>
              {!isLogin && (
                <div className="form-group">
                  <label>Company/Admin Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Acme Corp"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  className="form-control"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="company">Company</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <motion.button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={submitting}
                whileHover={{ scale: submitting ? 1 : 1.02 }}
                whileTap={{ scale: submitting ? 1 : 0.98 }}
              >
                {submitting ? 'Authenticating...' : isLogin ? 'Continue to Portal' : 'Register Account'}
              </motion.button>
            </form>
            <div className="form-footer">
              <p>
                New to SeaCred?{' '}
                <button type="button" className="link-cyan" onClick={() => setIsLogin(!isLogin)}>
                  {isLogin ? 'Register Here' : 'Back to Login'}
                </button>
              </p>
              <p className="demo-tip">
                <strong className="text-success">Demo Tip:</strong> Use &apos;admin@seacred.com&apos; /
                &apos;admin123&apos; as Admin role to view Dashboard instantly!
              </p>
            </div>
          </motion.div>

          <motion.div className="glass-panel verify-panel" custom={1} variants={panelVariants} initial="hidden" animate="visible">
            <h3>Verify Public Credit</h3>
            <p className="verify-copy">
              Enter a Credit Key to publicly verify the authenticity, weight, and allotted company of a SeaCred
              certificate.
            </p>
            <div className="verify-row">
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 9F4E-2B1A-..."
                value={verifyKey}
                onChange={(e) => setVerifyKey(e.target.value)}
              />
              <motion.button
                type="button"
                className="btn btn-outline"
                onClick={handleVerify}
                disabled={verifyLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {verifyLoading ? '...' : 'Verify'}
              </motion.button>
            </div>
            <div className="verify-result">
              {verifyLoading && <p className="text-muted">Verifying...</p>}
              {verifyResult?.error && <p className="text-danger">{verifyResult.error}</p>}
              {verifyResult?.ok && (
                <motion.div
                  className="verify-success"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h4 className="text-success">Verified Authentic</h4>
                  <p>
                    <strong>Weight:</strong> {verifyResult.payload.weight_kg} kg {verifyResult.payload.waste_type}
                  </p>
                  <p>
                    <strong>Owner:</strong> {verifyResult.payload.allotted_to_company}
                  </p>
                  <p>
                    <strong>Collected By:</strong> {verifyResult.payload.collected_by} at{' '}
                    {verifyResult.payload.gps_location}
                  </p>
                  <p className="text-muted verify-issued">
                    Issued: {new Date(verifyResult.payload.issue_date).toLocaleDateString()}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
