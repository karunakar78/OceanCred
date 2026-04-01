import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

function getMostRecentTimestamp(item, fields) {
  for (const field of fields) {
    const value = item?.[field];
    if (!value) continue;
    const ts = new Date(value).getTime();
    if (!Number.isNaN(ts)) return ts;
  }
  return 0;
}

function sortRecentFirst(items, fields) {
  return [...items].sort((a, b) => {
    const aTs = getMostRecentTimestamp(a, fields);
    const bTs = getMostRecentTimestamp(b, fields);
    if (aTs !== bTs) return bTs - aTs;
    return (b?.id || 0) - (a?.id || 0);
  });
}

function CompanyListingCard({ item, bidAmount, onBidAmount, onBid, showToast }) {
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
    <article className="auction-card">
      <div className="auction-card__top">
        <span className="auction-card__id">Listing #{item.id}</span>
        <span className="badge badge-active">Open</span>
      </div>
      <h3 className="auction-card__title">
        {item.credit.weight} kg
        <span className="auction-card__waste">{item.credit.waste_type}</span>
      </h3>
      <dl className="auction-card__meta">
        <div>
          <dt>Location</dt>
          <dd>{item.credit.gps_location}</dd>
        </div>
        <div>
          <dt>Collected</dt>
          <dd>{new Date(item.credit.collection_date).toLocaleDateString()}</dd>
        </div>
        <div>
          <dt>Time left</dt>
          <dd className="auction-card__timer">{timerLabel}</dd>
        </div>
      </dl>
      <div className="auction-card__prices">
        <div className="auction-card__price-block">
          <span className="auction-card__price-label">Min bid</span>
          <span className="auction-card__price auction-card__price--min">₹{scaledMinPrice.toFixed(2)}</span>
        </div>
        <div className="auction-card__price-block auction-card__price-block--high">
          <span className="auction-card__price-label">Leading bid</span>
          <span className="auction-card__price auction-card__price--high bid-pulse">
            ₹{typeof highest === 'number' ? highest.toFixed(2) : highest}
          </span>
        </div>
      </div>
      <div className="auction-card__bid-row">
        <input
          type="number"
          className="form-control auction-card__bid-input"
          placeholder="Your bid (INR)"
          min={(scaledMinPrice + 1).toFixed(2)}
          step="0.01"
          value={bidAmount}
          onChange={(e) => onBidAmount(item.id, e.target.value)}
        />
        <button type="button" className="btn btn-primary auction-card__bid-btn" onClick={() => onBid(item.id)}>
          Place bid
        </button>
      </div>
    </article>
  );
}

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
    const id = setInterval(loadMarketplace, 5000);
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

  const kpis = [
    {
      key: 'wallet',
      label: 'Wallet balance',
      value: dashboard ? `₹${dashboard.wallet_balance.toLocaleString()}` : '…',
      hint: 'Available to bid',
      tone: 'success',
    },
    {
      key: 'credits',
      label: 'Credits purchased',
      value: dashboard ? String(dashboard.total_credits_purchased_count) : '…',
      hint: 'Certificates won',
      tone: 'cyan',
    },
    {
      key: 'spent',
      label: 'Total spent',
      value: dashboard ? `₹${dashboard.total_amount_spent.toLocaleString()}` : '…',
      hint: 'Lifetime spend',
      tone: 'blue',
    },
  ];

  const notificationFeed = notifications
    ? sortRecentFirst(notifications, ['created_at', 'updated_at'])
    : null;
  const transactionFeed = transactions
    ? sortRecentFirst(transactions, ['created_at', 'updated_at', 'purchased_at', 'transaction_date'])
    : null;

  return (
    <>
      <AnimatedBackground />
      <Navbar
        brand="SeaCred"
        right={
          <>
            <button type="button" className="btn btn-outline" onClick={openPreferencesManager}>
              Settings
            </button>
            <button type="button" className="btn btn-outline" onClick={topupWallet}>
              Add funds
            </button>
            <button type="button" className="btn btn-primary" onClick={handleLogout}>
              Sign out
            </button>
          </>
        }
      />

      <div className="wrapper company-dash">
        <header className="company-dash__intro">
          <div className="company-dash__intro-text">
            <p className="section-head__eyebrow">Company workspace</p>
            <h1 className="company-dash__title">Dashboard</h1>
            <p className="company-dash__lede">
              Monitor your wallet, review activity, and bid on verified plastic credits in real time.
            </p>
          </div>
          <div className="company-dash__intro-aside" aria-hidden>
            <div className="company-dash__intro-card">
              <span className="company-dash__intro-label">Marketplace</span>
              <span className="company-dash__intro-value">{listings === null ? '…' : `${listings.length} live`}</span>
            </div>
          </div>
        </header>

        <section className="company-dash__kpis" aria-label="Key metrics">
          {kpis.map((k) => (
            <div key={k.key} className={`company-dash__kpi company-dash__kpi--${k.tone}`}>
              <div className="company-dash__kpi-icon" />
              <div className="company-dash__kpi-body">
                <p className="company-dash__kpi-label">{k.label}</p>
                <p className={`company-dash__kpi-value company-dash__kpi-value--${k.tone}`}>{k.value}</p>
                <p className="company-dash__kpi-hint">{k.hint}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="company-dash__feeds" aria-label="Activity">
          <div className="company-dash__feed company-dash__feed--notify">
            <div className="company-dash__feed-head">
              <h2>Notifications</h2>
              <span className="company-dash__feed-badge">
                {notifications ? notifications.length : '—'}
              </span>
            </div>
            <div className="company-dash__feed-body scroll-panel company-dash__scroll">
              {notifications === null && <p className="company-dash__empty">Loading…</p>}
              {notificationFeed && notificationFeed.length === 0 && (
                <p className="company-dash__empty">No new notifications. You’re up to date.</p>
              )}
              {notificationFeed &&
                notificationFeed.map((n) => (
                  <div key={n.id ?? n.created_at} className="company-dash__notify-item">
                    <span className="company-dash__notify-dot" aria-hidden />
                    <div>
                      <p className="company-dash__notify-msg">{n.message}</p>
                      <time className="company-dash__notify-time" dateTime={n.created_at}>
                        {new Date(n.created_at).toLocaleString()}
                      </time>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="company-dash__feed company-dash__feed--history">
            <div className="company-dash__feed-head">
              <h2>Credits acquired</h2>
            </div>
            <div className="company-dash__feed-body scroll-panel company-dash__scroll">
              {transactions === null && <p className="company-dash__empty">Loading…</p>}
              {transactionFeed && transactionFeed.length === 0 && (
                <p className="company-dash__empty">No purchases yet. Win an auction to see credits here.</p>
              )}
              {transactionFeed &&
                transactionFeed.map((tx) => (
                  <div key={tx.id ?? tx.listing_id} className="company-dash__tx-card">
                    <div className="company-dash__tx-top">
                      <span className="company-dash__tx-tag">Awarded</span>
                      <span className="company-dash__tx-id">#{tx.listing_id}</span>
                    </div>
                    <p className="company-dash__tx-detail">
                      {tx.listing?.credit?.weight || '—'} kg · {tx.listing?.credit?.waste_type || 'Unknown'}
                    </p>
                    <p className="company-dash__tx-price">₹{tx.final_price}</p>
                    <code className="company-dash__tx-key">
                      {tx.listing?.credit?.unique_key || 'Pending'}
                    </code>
                  </div>
                ))}
            </div>
          </div>
        </section>

        <section className="company-dash__market" aria-label="Live auctions">
          <div className="company-dash__market-head">
            <div>
              <p className="section-head__eyebrow">Marketplace</p>
              <h2 className="company-dash__market-title">Live auctions</h2>
              <p className="company-dash__market-sub">
                Listings refresh every 5 seconds.
              </p>
            </div>
          </div>

          <div className="company-dash__auction-grid">
            {listings === null && <p className="company-dash__empty company-dash__empty--wide">Loading listings…</p>}
            {listings && listings.length === 0 && (
              <p className="company-dash__empty company-dash__empty--wide">No active listings. Check back soon.</p>
            )}
            {listings &&
              listings.map((item) => (
                <CompanyListingCard
                  key={item.id}
                  item={item}
                  bidAmount={bidInputs[item.id] ?? ''}
                  onBidAmount={setBidAmount}
                  onBid={handleBid}
                  showToast={showToast}
                />
              ))}
          </div>
        </section>
      </div>

      {prefsOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setPrefsOpen(false)}>
          <div
            className="glass-card modal-card modal-card--company"
            role="dialog"
            aria-labelledby="prefs-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="prefs-title">Notification preferences</h2>
            <p className="text-muted small" style={{ marginTop: '0.35rem' }}>
              Email for invoices and outbid alerts.
            </p>
            <div className="form-group mt-1">
              <label className="checkbox-row">
                <input type="checkbox" checked={prefEnabled} onChange={(e) => setPrefEnabled(e.target.checked)} />
                Enable email notifications
              </label>
            </div>
            <div className="form-group mt-1">
              <label>Notifications email</label>
              <input
                type="email"
                className="form-control"
                placeholder="alerts@company.com"
                value={prefEmail}
                onChange={(e) => setPrefEmail(e.target.value)}
              />
            </div>
            <div className="flex-between mt-2 modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setPrefsOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={savePreferences}>
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
