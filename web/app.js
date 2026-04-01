const API_URL = "http://localhost:8080";

// --- AUTHENTICATION ---
async function login(email, password, roleInput) {
    try {
        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);

        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });

        if (!res.ok) throw new Error("Invalid credentials");
        const data = await res.json();
        
        localStorage.setItem("token", data.access_token);
        
        // We will just decode slightly or assume role based on login form
        // Real app: decode JWT or parse profile route
        localStorage.setItem("role", roleInput); 

        showToast("Login Successful!", "success");
        setTimeout(() => {
            if (roleInput === 'admin') window.location.href = 'admin.html';
            else window.location.href = 'company.html';
        }, 1000);

    } catch (e) {
        showToast(e.message, "danger");
    }
}

async function register(email, password, role, name) {
    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role, name, gst_number: "GST-" + Math.floor(Math.random() * 10000) })
        });
        if (!res.ok) throw new Error("Registration failed. Email might exist.");
        showToast("Registration Complete! Please log in.", "success");
        document.getElementById('mode-toggle').click(); // Switch to login
    } catch (e) {
        showToast(e.message, "danger");
    }
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

// --- API HELPERS ---
async function fetchAPI(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`
    };
    
    if (body) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    });
    
    if (res.status === 401 || res.status === 403) {
        logout();
    }
    
    return res.json();
}

// --- COMPANY VIEWS ---
async function loadCompanyDashboard() {
    const data = await fetchAPI('/company/dashboard');
    if(data && data.status === 'success') {
        document.getElementById('wallet-balance').innerText = `₹${data.data.wallet_balance.toLocaleString()}`;
        document.getElementById('total-spent').innerText = `₹${data.data.total_amount_spent.toLocaleString()}`;
        document.getElementById('total-credits').innerText = data.data.total_credits_purchased_count;
    }
    loadNotifications();
    loadTransactions();
}

async function loadMarketplace() {
    const listings = await fetchAPI('/marketplace');
    const container = document.getElementById('marketplace-grid');
    container.innerHTML = '';

    if(!listings || listings.length === 0) {
        container.innerHTML = '<p>No active listings available right now.</p>';
        return;
    }

    listings.forEach(item => {
        const card = document.createElement('div');
        card.className = 'glass-card animate-fade';
        const closesAt = new Date(item.closes_at).getTime();
        const scaledMinPrice = item.min_price * 1.10;
        
        card.innerHTML = `
            <div class="flex-between mb-1">
                <span class="badge badge-active">Active</span>
                <span class="text-muted">Listing #${item.id}</span>
            </div>
            <h3>${item.credit.weight} kg ${item.credit.waste_type}</h3>
            <p class="mt-1">📍 ${item.credit.gps_location}</p>
            <p>📅 ${new Date(item.credit.collection_date).toLocaleDateString()}</p>
            <p class="text-blue mt-1">⏱️ <span id="timer-${item.id}">Calculating...</span></p>
            <div class="mt-1 p-1" style="background: rgba(0,0,0,0.3); border-radius: 8px;">
                <p>Min Bid: <strong class="text-cyan">₹${scaledMinPrice.toFixed(2)}</strong></p>
                <p>Current Highest: <strong class="text-success" id="highest-bid-${item.id}">₹${scaledMinPrice.toFixed(2)}</strong></p>
            </div>
            <div class="flex-between mt-1">
                <input type="number" id="bid-input-${item.id}" class="form-control" placeholder="Enter Bid" style="width: 50%; margin-bottom:0;" min="${(scaledMinPrice + 1).toFixed(2)}" step="0.01">
                <button class="btn btn-primary" onclick="placeBid(${item.id})" style="padding: 0.75rem 1rem;">BID</button>
            </div>
            <button class="btn btn-outline mt-1" style="width: 100%; font-size: 0.8rem; padding: 0.5rem;" onclick="simulateClose(${item.id})">Simulate Auction Close (Time Up)</button>
        `;
        container.appendChild(card);

        // Timer Interval
        const timerId = setInterval(() => {
            const now = new Date().getTime();
            const distance = closesAt - now;
            if (distance < 0) {
                clearInterval(timerId);
                const tEl = document.getElementById(`timer-${item.id}`);
                if (tEl) tEl.innerText = "EXPIRED";
            } else {
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                const tEl = document.getElementById(`timer-${item.id}`);
                if(tEl) tEl.innerText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            }
        }, 1000);
        
        // Connect Live Bidding Websocket
        connectWebSocket(item.id);
    });
}

function connectWebSocket(listingId) {
    const ws = new WebSocket(`ws://localhost:8080/ws/bidding/${listingId}`);
    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.event === "new_bid") {
            const bidDisplay = document.getElementById(`highest-bid-${listingId}`);
            if(bidDisplay) {
                bidDisplay.innerText = `₹${data.amount}`;
                bidDisplay.classList.add("animate-fade");
                setTimeout(() => bidDisplay.classList.remove("animate-fade"), 600);
            }
            showToast(`New Bid of ₹${data.amount} placed on Listing #${listingId}!`, "success");
        }
    };
}

async function placeBid(listingId) {
    const amount = parseFloat(document.getElementById(`bid-input-${listingId}`).value);
    if (!amount) return showToast("Enter a valid bid amount", "danger");

    try {
        const res = await fetchAPI(`/marketplace/${listingId}/bid`, 'POST', { amount });
        if(res.detail) {
            showToast(res.detail, "danger");
        } else {
            // Send socket blast (Ideally server broadcasts instantly after DB commit, we mock socket broadcast here just to test bidirectional if needed)
            const ws = new WebSocket(`ws://localhost:8080/ws/bidding/${listingId}`);
            ws.onopen = () => {
                ws.send(JSON.stringify({ company_id: "Self", bid_amount: amount }));
                ws.close();
            }
            showToast("Bid Placed Successfully!", "success");
        }
    } catch(e) {
        showToast(e.message, "danger");
    }
}

async function topupWallet() {
    const amount = prompt("Enter amount to deposit into wallet:");
    if (!amount || isNaN(amount)) return;
    
    const res = await fetchAPI('/company/wallet/topup', 'POST', { amount: parseFloat(amount) });
    if (res.status === 'success') {
        showToast(`Successfully deposited ₹${amount}`, "success");
        loadCompanyDashboard();
    }
}

async function simulateClose(listingId) {
    try {
        const res = await fetchAPI(`/marketplace/${listingId}/close`, 'POST');
        if (res.status === 'success') {
            showToast(res.message, "success");
            loadCompanyDashboard(); // refresh wallet & stats
            loadMarketplace(); // remove closed listing
        } else {
            showToast(res.detail || res.message || "Failed to close auction", "danger");
        }
    } catch(e) {
        showToast(e.message, "danger");
    }
}

async function loadNotifications() {
    const notifications = await fetchAPI('/company/notifications');
    const container = document.getElementById('notifications-list');
    if (!container) return;
    
    if(!notifications || notifications.length === 0) {
        container.innerHTML = '<p class="text-muted">No new notifications.</p>';
        return;
    }
    
    container.innerHTML = notifications.map(n => `
        <div style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <p style="color: var(--text-main); font-size: 0.95rem;">${n.message}</p>
            <small class="text-muted" style="font-size: 0.75rem;">${new Date(n.created_at).toLocaleString()}</small>
        </div>
    `).join('');
}

async function loadTransactions() {
    const transactions = await fetchAPI('/company/transactions');
    const container = document.getElementById('transactions-list');
    if (!container) return;
    
    if(!transactions || transactions.length === 0) {
        container.innerHTML = '<p class="text-muted">No credits purchased yet.</p>';
        return;
    }
    
    container.innerHTML = transactions.map(tx => `
        <div style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <p style="color: var(--text-main); font-weight: 500;">
                <span class="text-success">Won!</span> Listing #${tx.listing_id}
            </p>
            <p style="font-size: 0.9rem;">${tx.listing?.credit?.weight || '??'} kg of ${tx.listing?.credit?.waste_type || 'Unknown'}</p>
            <p style="font-size: 0.9rem; color: var(--neon-cyan);">Amount Paid: ₹${tx.final_price}</p>
            <p style="font-size: 0.85rem; color: #fff; background: rgba(0,0,0,0.5); padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 5px;">
                🔑 Key: <strong>${tx.listing?.credit?.unique_key || 'Pending Processing'}</strong>
            </p>
        </div>
    `).join('');
}

// --- ADMIN VIEWS ---
async function loadAdminDashboard() {
    const data = await fetchAPI('/admin/dashboard');
    if(data && data.status === 'success') {
        document.getElementById('stat-companies').innerText = data.data.total_companies;
        document.getElementById('stat-fishermen').innerText = data.data.total_fishermen;
        document.getElementById('stat-credits').innerText = `${data.data.total_credits_generated_kg} kg`;
        document.getElementById('stat-revenue').innerText = `₹${data.data.total_platform_revenue.toLocaleString()}`;
        document.getElementById('stat-auctions').innerText = data.data.active_auctions;
    }

    // Load simple tables
    const companies = await fetchAPI('/admin/companies');
    const compGrid = document.getElementById('companies-grid');
    if (compGrid) {
        if (companies.length === 0) {
            compGrid.innerHTML = '<p class="text-muted">No registered companies yet.</p>';
        } else {
            compGrid.innerHTML = companies.map(c => `
                <div class="glass-card" style="padding: 1.25rem; border-left: 3px solid var(--neon-cyan);">
                    <div class="flex-between">
                        <h4 style="margin: 0; display:flex; align-items:center; gap:0.5rem;" class="text-blue">
                           🏢 ${c.name || 'Anonymous User'}
                        </h4>
                        <span class="badge ${c.is_active ? 'badge-active' : 'badge-closed'}">${c.is_active ? 'Active' : 'Suspended'}</span>
                    </div>
                    <div class="flex-between mt-1">
                        <p style="font-size: 0.85rem;" class="text-muted">${c.email}</p>
                        <p style="font-size: 0.85rem;">GST: <strong>${c.gst_number || 'N/A'}</strong></p>
                    </div>
                    <div class="mt-1 flex-between" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.5rem;">
                        <p>Wallet: <strong class="text-success">₹${c.wallet_balance.toLocaleString()}</strong></p>
                        <button class="btn ${c.is_active ? 'btn-outline' : 'btn-primary'}" style="padding: 0.3rem 0.6rem; font-size:0.75rem;" onclick="toggleUserStatus(${c.id})">${c.is_active ? 'Block' : 'Unblock'}</button>
                    </div>
                </div>
            `).join('');
        }
    }

    const fishermen = await fetchAPI('/admin/fishermen');
    const fishGrid = document.getElementById('fishermen-grid');
    if (fishGrid) {
        if (fishermen.length === 0) {
            fishGrid.innerHTML = '<p class="text-muted">No registered fishermen yet.</p>';
        } else {
            fishGrid.innerHTML = fishermen.map(f => `
                <div class="glass-card" style="padding: 1.25rem; border-left: 3px solid var(--success);">
                    <div class="flex-between">
                        <h4 style="margin: 0; display:flex; align-items:center; gap:0.5rem;" class="text-success">
                           🎣 ${f.name || 'Anonymous Fisherman'}
                        </h4>
                        <span class="badge ${f.is_active ? 'badge-active' : 'badge-closed'}">${f.is_active ? 'Active' : 'Suspended'}</span>
                    </div>
                    <div class="flex-between mt-1">
                        <p style="font-size: 0.85rem;" class="text-muted">${f.email}</p>
                        <p style="font-size: 0.85rem;">Role: ${f.role}</p>
                    </div>
                    <div class="mt-1 flex-between" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.5rem;">
                        <p>Wallet Earnings: <strong class="text-success">₹${f.wallet_balance.toLocaleString()}</strong></p>
                        <button class="btn ${f.is_active ? 'btn-outline' : 'btn-primary'}" style="padding: 0.3rem 0.6rem; font-size:0.75rem;" onclick="toggleUserStatus(${f.id})">${f.is_active ? 'Block' : 'Unblock'}</button>
                    </div>
                </div>
            `).join('');
        }
    }

    loadAdminMarketplace();
}

async function toggleUserStatus(userId) {
    if(!confirm("Are you sure you want to change this user's status?")) return;
    
    try {
        const res = await fetchAPI('/admin/users/' + userId + '/toggle-status', 'PATCH');
        if (res.status === 'success') {
            showToast(res.message, "success");
            loadAdminDashboard();
        } else {
            showToast(res.detail || "Failed to toggle status", "danger");
        }
    } catch(e) {
        showToast(e.message, "danger");
    }
}

async function loadAdminMarketplace() {
    const listings = await fetchAPI('/marketplace');
    const container = document.getElementById('admin-marketplace-grid');
    if(!container) return;
    
    container.innerHTML = '';

    if(!listings || listings.length === 0) {
        container.innerHTML = '<p>No active listings available right now.</p>';
        return;
    }

    listings.forEach(item => {
        const card = document.createElement('div');
        card.className = 'glass-card animate-fade';
        card.innerHTML = `
            <div class="flex-between mb-1">
                <span class="badge badge-active">Active</span>
                <span class="text-muted">Listing #${item.id}</span>
            </div>
            <h3>${item.credit.weight} kg ${item.credit.waste_type}</h3>
            <p class="mt-1">📍 ${item.credit.gps_location}</p>
            <p>📅 ${new Date(item.credit.collection_date).toLocaleDateString()}</p>
            <div class="mt-1 p-1" style="background: rgba(0,0,0,0.3); border-radius: 8px;">
                <p>Min Bid: <strong class="text-cyan">₹${item.min_price}</strong></p>
            </div>
            <button class="btn btn-primary mt-1" style="width: 100%;" onclick="simulateAdminClose(${item.id})">Force Close Auction</button>
        `;
        container.appendChild(card);
    });
}

async function simulateAdminClose(listingId) {
    try {
        const res = await fetchAPI(`/marketplace/${listingId}/close`, 'POST');
        if (res.status === 'success') {
            showToast(res.message, "success");
            loadAdminDashboard(); 
        } else {
            showToast(res.detail || res.message || "Failed to close auction", "danger");
        }
    } catch(e) {
        showToast(e.message, "danger");
    }
}

async function simulateNewListing() {
    try {
        const res = await fetchAPI('/admin/simulate-auction', 'POST');
        if (res.status === 'success') {
            showToast(res.message, "success");
            loadAdminDashboard();
        } else {
            showToast(res.detail || "Failed to generate listing", "danger");
        }
    } catch(e) {
        showToast(e.message, "danger");
    }
}

// --- PREFERENCES VIEWS ---
async function openPreferencesManager() {
    document.getElementById('prefs-modal').style.display = 'flex';
    try {
        const res = await fetchAPI('/company/preferences');
        if(res.status === 'success') {
            document.getElementById('pref-email-enabled').checked = res.data.email_notifications_enabled;
            document.getElementById('pref-email-input').value = res.data.notification_email || '';
        }
    } catch(e) {
        showToast('Failed to load preferences', 'danger');
    }
}

function closePreferencesManager() {
    document.getElementById('prefs-modal').style.display = 'none';
}

async function savePreferences() {
    const enabled = document.getElementById('pref-email-enabled').checked;
    const email = document.getElementById('pref-email-input').value;

    try {
        const res = await fetchAPI('/company/preferences', 'POST', {
            email_notifications_enabled: enabled,
            notification_email: email || null
        });
        if(res.status === 'success') {
            showToast('Preferences saved successfully!', 'success');
            closePreferencesManager();
        } else {
            showToast(res.message || 'Failed to save', 'danger');
        }
    } catch(e) {
        showToast(e.message, 'danger');
    }
}

// --- UTILS ---
function showToast(message, type="success") {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
    }
    
    const toast = document.createElement("div");
    toast.className = `toast ${type === 'danger' ? 'border-danger' : ''}`;
    if (type === 'danger') toast.style.borderLeftColor = 'var(--danger)';
    
    toast.innerText = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
