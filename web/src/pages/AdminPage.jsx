import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import { fetchAPI, logout } from '../api';
import { useToast } from '../context/ToastContext';

const statsContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.045 } },
};

export default function AdminPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState(null);
  const [fishermen, setFishermen] = useState(null);
  const [listings, setListings] = useState(null);

  const loadAdminDashboard = useCallback(async () => {
    const data = await fetchAPI('/admin/dashboard');
    if (data && data.status === 'success') {
      setStats(data.data);
    }

    const comp = await fetchAPI('/admin/companies');
    setCompanies(Array.isArray(comp) ? comp : []);

    const fish = await fetchAPI('/admin/fishermen');
    setFishermen(Array.isArray(fish) ? fish : []);

    const m = await fetchAPI('/marketplace');
    setListings(Array.isArray(m) ? m : []);
  }, []);

  useEffect(() => {
    loadAdminDashboard();
  }, [loadAdminDashboard]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  async function toggleUserStatus(userId) {
    if (!window.confirm('Are you sure you want to change this user\'s status?')) return;
    try {
      const res = await fetchAPI(`/admin/users/${userId}/toggle-status`, 'PATCH');
      if (res.status === 'success') {
        showToast(res.message, 'success');
        loadAdminDashboard();
      } else {
        showToast(res.detail || 'Failed to toggle status', 'danger');
      }
    } catch (e) {
      showToast(e.message, 'danger');
    }
  }

  return (
    <>
      <AnimatedBackground />
      <Navbar
        admin
        brand="SeaCred Admin"
        right={
          <motion.button type="button" className="btn btn-outline" onClick={handleLogout} whileTap={{ scale: 0.98 }}>
            Sign out
          </motion.button>
        }
      />

      <div className="wrapper admin-dash page-enter">
        <motion.header
          className="admin-dash__intro"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="admin-dash__intro-text">
            <p className="section-head__eyebrow">Platform operations</p>
            <h1 className="admin-dash__title">Command center</h1>
            <p className="admin-dash__lede">
              Revenue, inventory, participant registry, and auction tooling for administrators.
            </p>
          </div>
          <div className="admin-dash__intro-aside" aria-hidden>
            <div className="admin-dash__intro-card">
              <span className="admin-dash__intro-label">Live auctions</span>
              <span className="admin-dash__intro-value">{stats?.active_auctions ?? '…'}</span>
            </div>
          </div>
        </motion.header>

        <motion.div
          className="admin-dash__kpis admin-stats"
          initial="hidden"
          animate="visible"
          variants={statsContainer}
        >
          {[
            {
              key: 'revenue',
              label: 'Platform revenue',
              value: stats ? `₹${stats.total_platform_revenue.toLocaleString()}` : '…',
              cls: 'text-success',
              tone: 'success',
            },
            {
              key: 'credits',
              label: 'Credits generated',
              value: stats ? `${stats.total_credits_generated_kg} kg` : '…',
              cls: 'text-cyan',
              tone: 'cyan',
            },
            {
              key: 'auctions',
              label: 'Active auctions',
              value: stats?.active_auctions ?? '…',
              cls: 'text-danger',
              tone: 'blue',
            },
            {
              key: 'companies',
              label: 'Companies',
              value: stats?.total_companies ?? '…',
              cls: 'text-blue',
              tone: 'cyan',
            },
            {
              key: 'fishermen',
              label: 'Fishermen',
              value: stats?.total_fishermen ?? '…',
              cls: 'text-muted',
              tone: 'success',
            },
          ].map((s) => (
            <motion.div
              key={s.key}
              className={`admin-dash__kpi admin-dash__kpi--${s.tone} glass-card`}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
            >
              <div className="admin-dash__kpi-icon" />
              <div className="admin-dash__kpi-body">
                <p className="admin-dash__kpi-label">{s.label}</p>
                <h2 className={`admin-dash__kpi-value ${s.cls}`}>{s.value}</h2>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <section className="admin-dash__feeds" aria-label="Registry">
          <motion.section className="admin-dash__feed glass-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="company-dash__feed-head">
              <h2>Registered companies</h2>
              <span className="company-dash__feed-badge">{companies ? companies.length : '—'}</span>
            </div>
            <div className="scroll-panel admin-scroll">
              {companies === null && <p className="text-muted">Loading…</p>}
              {companies && companies.length === 0 && <p className="text-muted">No companies yet.</p>}
              {companies &&
                companies.map((c) => (
                  <div key={c.id} className="glass-card listing-card company-card">
                    <div className="flex-between gap-1">
                      <h4 className="text-blue">{c.name || 'Anonymous'}</h4>
                      <span className={`badge ${c.is_active ? 'badge-active' : 'badge-closed'}`}>
                        {c.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                    <div className="flex-between mt-1 gap-1 flex-wrap">
                      <p className="text-muted small">{c.email}</p>
                      <p className="small">
                        GST <strong>{c.gst_number || '—'}</strong>
                      </p>
                    </div>
                    <div className="flex-between mt-1 admin-card-footer">
                      <p className="small">
                        Wallet <strong className="text-success">₹{c.wallet_balance.toLocaleString()}</strong>
                      </p>
                      <button
                        type="button"
                        className={`btn ${c.is_active ? 'btn-outline' : 'btn-primary'} btn-tiny`}
                        onClick={() => toggleUserStatus(c.id)}
                      >
                        {c.is_active ? 'Block' : 'Unblock'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </motion.section>

          <motion.section
            className="admin-dash__feed glass-panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="company-dash__feed-head">
              <h2>Registered fishermen</h2>
              <span className="company-dash__feed-badge">{fishermen ? fishermen.length : '—'}</span>
            </div>
            <div className="scroll-panel admin-scroll">
              {fishermen === null && <p className="text-muted">Loading…</p>}
              {fishermen && fishermen.length === 0 && <p className="text-muted">No fishermen yet.</p>}
              {fishermen &&
                fishermen.map((f) => (
                  <div key={f.id} className="glass-card listing-card fish-card">
                    <div className="flex-between gap-1">
                      <h4 className="text-success">{f.name || 'Anonymous'}</h4>
                      <span className={`badge ${f.is_active ? 'badge-active' : 'badge-closed'}`}>
                        {f.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                    <div className="flex-between mt-1 gap-1 flex-wrap">
                      <p className="text-muted small">{f.email}</p>
                      <p className="small">{f.role}</p>
                    </div>
                    <div className="flex-between mt-1 admin-card-footer">
                      <p className="small">
                        Earnings <strong className="text-success">₹{f.wallet_balance.toLocaleString()}</strong>
                      </p>
                      <button
                        type="button"
                        className={`btn ${f.is_active ? 'btn-outline' : 'btn-primary'} btn-tiny`}
                        onClick={() => toggleUserStatus(f.id)}
                      >
                        {f.is_active ? 'Block' : 'Unblock'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </motion.section>
        </section>

        <motion.div
          className="admin-dash__market-head flex-between dashboard-header section-head admin-marketplace-header"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
        >
          <div>
            <p className="section-head__eyebrow">Marketplace</p>
            <h2>Marketplace controls</h2>
            <p>Review live marketplace activity and auction status.</p>
          </div>
        </motion.div>

        <div className="grid marketplace-grid admin-dash__market-grid">
          {listings === null && <p className="text-muted">Loading listings…</p>}
          {listings && listings.length === 0 && <p className="text-muted">No active listings.</p>}
          {listings &&
            listings.map((item) => (
              <motion.article
                key={item.id}
                className="glass-card listing-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex-between mb-1">
                  <span className="badge badge-active">Live</span>
                  <span className="text-tertiary" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    #{item.id}
                  </span>
                </div>
                <h3>
                  {item.credit.weight} kg · {item.credit.waste_type}
                </h3>
                <div className="meta-row">
                  <p>
                    <span className="meta-label">Location</span>
                    <span>{item.credit.gps_location}</span>
                  </p>
                  <p>
                    <span className="meta-label">Collected</span>
                    <span>{new Date(item.credit.collection_date).toLocaleDateString()}</span>
                  </p>
                </div>
                <div className="bid-box mt-1">
                  <p>
                    Floor price <strong className="text-cyan">₹{item.min_price}</strong>
                  </p>
                </div>
              </motion.article>
            ))}
        </div>
      </div>
    </>
  );
}
