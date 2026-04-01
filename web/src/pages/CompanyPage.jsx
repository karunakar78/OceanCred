import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import {
  fetchAPI,
  logout,
  placeBidRequest,
  sendBidSocketPing,
} from '../api';
import { useToast } from '../context/ToastContext';
import { useAuctionTimer } from '../hooks/useAuctionTimer';
import { useListingSocket } from '../hooks/useListingSocket';

function CompanyListingCard({ item, bidAmount, onBidAmount, onBid, onSimClose, showToast }) {
  const scaledMinPrice = item.min_price * 1.1;
  const [highest, setHighest] = useState(scaledMinPrice);
  const timerLabel = useAuctionTimer(item.closes_at);

  const onSocketBid = useCallback(
    (amount) => {
      const n = typeof amount === 'number' ? amount : parseFloat(amount);
      if (!Number.isNaN(n)) setHighest(n);
      showToast(`New Bid of ₹${amount} placed on Listing #${item.id}!`, 'success');
    },
    [item.id, showToast]
  );

  useListingSocket(item.id, onSocketBid);

  return (
    <motion.div
      className="glass-card listing-card"
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
      <p className="text-blue mt-1">
        ⏱️ <span>{timerLabel}</span>
      </p>
      <div className="bid-box mt-1">
        <p>
          Min Bid: <strong className="text-cyan">₹{scaledMinPrice.toFixed(2)}</strong>
        </p>
        <p>
          Current Highest:{' '}
          <strong className="text-success bid-pulse">₹{typeof highest === 'number' ? highest.toFixed(2) : highest}</strong>
        </p>
      </div>
      <div className="flex-between mt-1 listing-actions">
        <input
          type="number"
          className="form-control bid-input"
          placeholder="Enter Bid"
          min={(scaledMinPrice + 1).toFixed(2)}
          step="0.01"
          value={bidAmount}
          onChange={(e) => onBidAmount(item.id, e.target.value)}
        />
        <motion.button
          type="button"
          className="btn btn-primary bid-btn"
          onClick={() => onBid(item.id)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          BID
        </motion.button>
      </div>
      <button type="button" className="btn btn-outline mt-1 btn-sim" onClick={() => onSimClose(item.id)}>
        Simulate Auction Close (Time Up)
      </button>
    </motion.div>
  );
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export default function CompanyPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [dashboard, setDashboard] = useState(null);
  const [notifications, setNotifications] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [listings, setListings] = useState(null);
  const [bidInputs, setBidInputs] = useState({});

  const [prefsOpen, setPrefsOpen] = useState(false);
  const [prefEnabled, setPrefEnabled] = useState(false);
  const [prefEmail, setPrefEmail] = useState('');

  const loadCompanyDashboard = useCallback(async () => {
    const data = await fetchAPI('/company/dashboard');
    if (data && data.status === 'success') {
      setDashboard(data.data);
    }
    const n = await fetchAPI('/company/notifications');
    setNotifications(Array.isArray(n) ? n : []);
    const tx = await fetchAPI('/company/transactions');
    setTransactions(Array.isArray(tx) ? tx : []);
  }, []);

  const loadMarketplace = useCallback(async () => {
    const data = await fetchAPI('/marketplace');
    setListings(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    loadCompanyDashboard();
    loadMarketplace();
    const id = setInterval(loadMarketplace, 30000);
    return () => clearInterval(id);
  }, [loadCompanyDashboard, loadMarketplace]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  async function handleBid(listingId) {
    const amount = parseFloat(bidInputs[listingId]);
    if (!amount) {
      showToast('Enter a valid bid amount', 'danger');
      return;
    }
    try {
      const res = await placeBidRequest(listingId, amount);
      if (res.detail) {
        showToast(res.detail, 'danger');
      } else {
        await sendBidSocketPing(listingId, amount);
        showToast('Bid Placed Successfully!', 'success');
      }
    } catch (e) {
      showToast(e.message, 'danger');
    }
  }

  async function handleSimClose(listingId) {
    try {
      const res = await fetchAPI(`/marketplace/${listingId}/close`, 'POST');
      if (res.status === 'success') {
        showToast(res.message, 'success');
        loadCompanyDashboard();
        loadMarketplace();
      } else {
        showToast(res.detail || res.message || 'Failed to close auction', 'danger');
      }
    } catch (e) {
      showToast(e.message, 'danger');
    }
  }

  async function topupWallet() {
    const amount = window.prompt('Enter amount to deposit into wallet:');
    if (!amount || isNaN(amount)) return;
    const res = await fetchAPI('/company/wallet/topup', 'POST', { amount: parseFloat(amount) });
    if (res && res.status === 'success') {
      showToast(`Successfully deposited ₹${amount}`, 'success');
      loadCompanyDashboard();
    }
  }

  async function openPreferencesManager() {
    setPrefsOpen(true);
    try {
      const res = await fetchAPI('/company/preferences');
      if (res && res.status === 'success') {
        setPrefEnabled(res.data.email_notifications_enabled);
        setPrefEmail(res.data.notification_email || '');
      }
    } catch {
      showToast('Failed to load preferences', 'danger');
    }
  }

  async function savePreferences() {
    try {
      const res = await fetchAPI('/company/preferences', 'POST', {
        email_notifications_enabled: prefEnabled,
        notification_email: prefEmail || null,
      });
      if (res && res.status === 'success') {
        showToast('Preferences saved successfully!', 'success');
        setPrefsOpen(false);
      } else {
        showToast(res.message || 'Failed to save', 'danger');
      }
    } catch (e) {
      showToast(e.message, 'danger');
    }
  }

  function setBidAmount(id, value) {
    setBidInputs((prev) => ({ ...prev, [id]: value }));
  }

  return (
    <>
      <AnimatedBackground />
      <Navbar
        brand="SeaCred //"
        right={
          <div className="nav-actions">
            <motion.button type="button" className="btn btn-outline" onClick={openPreferencesManager} whileTap={{ scale: 0.98 }}>
              Settings
            </motion.button>
            <motion.button type="button" className="btn btn-outline" onClick={topupWallet} whileTap={{ scale: 0.98 }}>
              Add Funds
            </motion.button>
            <motion.button type="button" className="btn btn-primary" onClick={handleLogout} whileTap={{ scale: 0.98 }}>
              Logout
            </motion.button>
          </div>
        }
      />

      <div className="wrapper page-enter">
        <motion.div className="dashboard-header" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1>Company ESG Dashboard</h1>
          <p>Track your verified plastic carbon credits and participate in active auctions instantly.</p>
        </motion.div>

        <motion.div className="stats-grid" variants={stagger} initial="hidden" animate="visible">
          {[
            { label: 'Wallet Balance', value: dashboard ? `₹${dashboard.wallet_balance.toLocaleString()}` : '…', cls: 'text-success' },
            { label: 'Total Credits Purchased', value: dashboard ? dashboard.total_credits_purchased_count : '…', cls: 'text-cyan' },
            { label: 'Total Amount Spent', value: dashboard ? `₹${dashboard.total_amount_spent.toLocaleString()}` : '…', cls: 'text-blue' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              className="glass-panel stat-card"
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <p>{s.label}</p>
              <h2 className={`stat-value ${s.cls}`}>{s.value}</h2>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid two-col">
          <motion.div className="glass-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <h3 className="mb-1">Notifications</h3>
            <div className="scroll-panel">
              {notifications === null && <p className="text-muted">Loading notifications...</p>}
              {notifications && notifications.length === 0 && <p className="text-muted">No new notifications.</p>}
              {notifications &&
                notifications.map((n) => (
                  <div key={n.id ?? n.created_at} className="list-row">
                    <p className="list-main">{n.message}</p>
                    <small className="text-muted">{new Date(n.created_at).toLocaleString()}</small>
                  </div>
                ))}
            </div>
          </motion.div>
          <motion.div className="glass-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h3 className="mb-1">Credits Acquired History</h3>
            <div className="scroll-panel">
              {transactions === null && <p className="text-muted">Loading history...</p>}
              {transactions && transactions.length === 0 && <p className="text-muted">No credits purchased yet.</p>}
              {transactions &&
                transactions.map((tx) => (
                  <div key={tx.id ?? tx.listing_id} className="list-row">
                    <p className="list-main">
                      <span className="text-success">Won!</span> Listing #{tx.listing_id}
                    </p>
                    <p className="list-sub">
                      {tx.listing?.credit?.weight || '??'} kg of {tx.listing?.credit?.waste_type || 'Unknown'}
                    </p>
                    <p className="text-cyan">Amount Paid: ₹{tx.final_price}</p>
                    <p className="key-badge">
                      Key: <strong>{tx.listing?.credit?.unique_key || 'Pending Processing'}</strong>
                    </p>
                  </div>
                ))}
            </div>
          </motion.div>
        </div>

        <motion.div className="dashboard-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <h2>Live Marketplace</h2>
          <p>Browse active listings collected by local fishermen. Verified by AI.</p>
        </motion.div>

        <div className="grid marketplace-grid">
          {listings === null && <p className="text-muted">Loading live auctions...</p>}
          {listings && listings.length === 0 && <p>No active listings available right now.</p>}
          {listings &&
            listings.map((item) => (
              <CompanyListingCard
                key={item.id}
                item={item}
                bidAmount={bidInputs[item.id] ?? ''}
                onBidAmount={setBidAmount}
                onBid={handleBid}
                onSimClose={handleSimClose}
                showToast={showToast}
              />
            ))}
        </div>
      </div>

      {prefsOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setPrefsOpen(false)}>
          <motion.div
            className="glass-card modal-card"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Email Preferences</h2>
            <div className="form-group mt-1">
              <label className="checkbox-row">
                <input type="checkbox" checked={prefEnabled} onChange={(e) => setPrefEnabled(e.target.checked)} />
                Enable Email Notifications
              </label>
            </div>
            <div className="form-group mt-1">
              <label>Preferred Notifications Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="e.g. alerts@company.com"
                value={prefEmail}
                onChange={(e) => setPrefEmail(e.target.value)}
              />
              <small className="text-muted">Invoices and Outbid alerts will be sent here.</small>
            </div>
            <div className="flex-between mt-2 modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setPrefsOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={savePreferences}>
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
