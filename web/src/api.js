export const API_URL = 'http://localhost:8080';

export async function login(email, password, roleInput) {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  });

  if (!res.ok) throw new Error('Invalid credentials');
  const data = await res.json();

  localStorage.setItem('token', data.access_token);
  localStorage.setItem('role', roleInput);

  return { ok: true, role: roleInput };
}

export async function register(email, password, role, name) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      role,
      name,
      gst_number: 'GST-' + Math.floor(Math.random() * 10000),
    }),
  });
  if (!res.ok) throw new Error('Registration failed. Email might exist.');
  return { ok: true };
}

export function logout() {
  localStorage.clear();
}

export async function fetchAPI(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/';
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  if (res.status === 401 || res.status === 403) {
    logout();
    window.location.href = '/';
    return;
  }

  return res.json();
}

export async function verifyCreditPublic(key) {
  const res = await fetch(`${API_URL}/marketplace/verify/${encodeURIComponent(key)}`);
  const data = await res.json();
  return { ok: res.ok, data };
}

export function connectWebSocket(listingId, onMessage) {
  const ws = new WebSocket(`ws://localhost:8080/ws/bidding/${listingId}`);
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };
  return () => {
    ws.close();
  };
}

export async function placeBidRequest(listingId, amount) {
  return fetchAPI(`/marketplace/${listingId}/bid`, 'POST', { amount });
}

export async function sendBidSocketPing(listingId, amount) {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://localhost:8080/ws/bidding/${listingId}`);
    ws.onopen = () => {
      ws.send(JSON.stringify({ company_id: 'Self', bid_amount: amount }));
      ws.close();
      resolve();
    };
    ws.onerror = () => resolve();
  });
}
