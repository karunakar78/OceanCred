import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import { fetchAPI, logout } from '../api';
import { useToast } from '../context/ToastContext';

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

  async function simulateAdminClose(listingId) {
    try {
      const res = await fetchAPI(`/marketplace/${listingId}/close`, 'POST');
      if (res.status === 'success') {
        showToast(res.message, 'success');
        loadAdminDashboard();
      } else {
        showToast(res.detail || res.message || 'Failed to close auction', 'danger');
      }
    } catch (e) {
      showToast(e.message, 'danger');
    }
  }

  async function simulateNewListing() {
    try {
      const res = await fetchAPI('/admin/simulate-auction', 'POST');
      if (res.status === 'success') {
        showToast(res.message, 'success');
        loadAdminDashboard();
      } else {
        showToast(res.detail || 'Failed to generate listing', 'danger');
      }
    } catch (e) {
      showToast(e.message, 'danger');
    }
  }

  return (
    <>
      <AnimatedBackground />
      <Navbar
        brand="SeaCred Admin //"
        right={
          <motion.button type="button" className="btn btn-outline" onClick={handleLogout} whileTap={{ scale: 0.98 }}>
            Secure Logout
          </motion.button>
        }
      />

      <div className="wrapper page-enter">
        <motion.div className="dashboard-header" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1>Command Center</h1>
          <p>Platform health, total metrics, and administration.</p>
        </motion.div>

        <motion.div
          className="stats-grid admin-stats"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
        >
          {[
            { label: 'Total Revenue', value: stats ? `₹${stats.total_platform_revenue.toLocaleString()}` : '…', cls: 'text-success' },
            { label: 'Credits Gen (kg)', value: stats ? `${stats.total_credits_generated_kg} kg` : '…', cls: 'text-cyan' },
            { label: 'Active Auctions', value: stats?.active_auctions ?? '…', cls: 'text-danger' },
            { label: 'Total Companies', value: stats?.total_companies ?? '…', cls: 'text-blue' },
            { label: 'Total Fishermen', value: stats?.total_fishermen ?? '…', cls: 'text-muted' },
          ].map((s) => (
            <motion.div
              key={s.label}
              className="glass-card text-center stat-card"
              variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
            >
              <p>{s.label}</p>
              <h2 className={`stat-value ${s.cls}`}>{s.value}</h2>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid two-col">
          <motion.div className="glass-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="mb-1">Registered Companies</h3>
            <div className="scroll-panel admin-scroll">
              {companies === null && <p className="text-muted">Loading companies...</p>}
              {companies && companies.length === 0 && <p className="text-muted">No registered companies yet.</p>}
              {companies &&
                companies.map((c) => (
                  <div key={c.id} className="glass-card listing-card company-card">
                    <div className="flex-between">
                      <h4 className="text-blue">🏢 {c.name || 'Anonymous User'}</h4>
                      <span className={`badge ${c.is_active ? 'badge-active' : 'badge-closed'}`}>
                        {c.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                    <div className="flex-between mt-1">
                      <p className="text-muted small">{c.email}</p>
                      <p className="small">
                        GST: <strong>{c.gst_number || 'N/A'}</strong>
                      </p>
                    </div>
                    <div className="flex-between mt-1 admin-card-footer">
                      <p>
                        Wallet: <strong className="text-success">₹{c.wallet_balance.toLocaleString()}</strong>
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
          </motion.div>

          <motion.div className="glass-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <h3 className="mb-1">Registered Fishermen</h3>
            <div className="scroll-panel admin-scroll">
              {fishermen === null && <p className="text-muted">Loading fishermen...</p>}
              {fishermen && fishermen.length === 0 && <p className="text-muted">No registered fishermen yet.</p>}
              {fishermen &&
                fishermen.map((f) => (
                  <div key={f.id} className="glass-card listing-card fish-card">
                    <div className="flex-between">
                      <h4 className="text-success">🎣 {f.name || 'Anonymous Fisherman'}</h4>
                      <span className={`badge ${f.is_active ? 'badge-active' : 'badge-closed'}`}>
                        {f.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                    <div className="flex-between mt-1">
                      <p className="text-muted small">{f.email}</p>
                      <p className="small">Role: {f.role}</p>
                    </div>
                    <div className="flex-between mt-1 admin-card-footer">
                      <p>
                        Wallet Earnings: <strong className="text-success">₹{f.wallet_balance.toLocaleString()}</strong>
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
          </motion.div>
        </div>

        <motion.div
          className="flex-between dashboard-header admin-marketplace-header"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div>
            <h2>Admin Marketplace Simulation</h2>
            <p>Force close current auctions or generate fresh listings to test bids instantly.</p>
          </div>
          <motion.button
            type="button"
            className="btn btn-outline btn-cyan-outline"
            onClick={simulateNewListing}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Create Auction Simulation
          </motion.button>
        </motion.div>

        <div className="grid marketplace-grid">
          {listings === null && <p className="text-muted">Loading active listings...</p>}
          {listings && listings.length === 0 && <p>No active listings available right now.</p>}
          {listings &&
            listings.map((item) => (
              <motion.div
                key={item.id}
                className="glass-card listing-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex-between mb-1">
                  <span className="badge badge-active">Active</span>
                  <span className="text-muted">Listing #{item.id}</span>
                </div>
                <h3>
                  {item.credit.weight} kg {item.credit.waste_type}
                </h3>
                <p className="mt-1">📍 {item.credit.gps_location}</p>
                <p>📅 {new Date(item.credit.collection_date).toLocaleDateString()}</p>
                <div className="bid-box mt-1">
                  <p>
                    Min Bid: <strong className="text-cyan">₹{item.min_price}</strong>
                  </p>
                </div>
                <motion.button
                  type="button"
                  className="btn btn-primary mt-1 btn-block"
                  onClick={() => simulateAdminClose(item.id)}
                  whileTap={{ scale: 0.99 }}
                >
                  Force Close Auction
                </motion.button>
              </motion.div>
            ))}
        </div>
      </div>
    </>
  );
}
