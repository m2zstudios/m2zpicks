(() => {
  const AUTH = { username: 'm2z.ahmed', password: 'TestKey123' };
  const sessionKey = 'm2z_admin_logged_in';

  const loginCard = document.getElementById('loginCard');
  const dashboard = document.getElementById('dashboard');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const output = document.getElementById('output');
  const summary = document.getElementById('summary');
  const baseUrl = document.getElementById('baseUrl');
  const refreshToken = document.getElementById('refreshToken');

  const endpoints = {
    health: '/health',
    stats: '/stats',
    categories: '/categories',
    tools: '/tools',
    latest: '/latest'
  };

  function showDashboard() {
    loginCard.classList.add('hidden');
    dashboard.classList.remove('hidden');
  }

  function showLogin() {
    dashboard.classList.add('hidden');
    loginCard.classList.remove('hidden');
  }

  if (sessionStorage.getItem(sessionKey) === '1') showDashboard();

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value;
    if (u === AUTH.username && p === AUTH.password) {
      sessionStorage.setItem(sessionKey, '1');
      loginError.classList.add('hidden');
      showDashboard();
    } else {
      loginError.classList.remove('hidden');
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem(sessionKey);
    showLogin();
  });

  async function runAction(action) {
    const base = baseUrl.value.trim().replace(/\/$/, '');
    const endpoint = action === 'refresh' ? '/refresh' : endpoints[action];
    if (!endpoint) return;

    const options = action === 'refresh'
      ? { method: 'POST', headers: { 'x-refresh-token': refreshToken.value.trim() } }
      : { method: 'GET' };

    output.textContent = `Loading ${action}...`;

    try {
      const res = await fetch(`${base}${endpoint}`, options);
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
      output.textContent = JSON.stringify({ status: res.status, data }, null, 2);

      if (action === 'tools') {
        const tools = data.tools || [];
        summary.textContent = `Tools loaded: ${tools.length}. First IDs: ${tools.slice(0, 10).map(t => t.id).join(', ')}`;
      }
      if (action === 'categories') {
        const categories = data.categories || [];
        summary.textContent = `Categories loaded: ${categories.length}.`;
      }
      if (action === 'stats') {
        summary.textContent = `Stats: tools=${data.totalTools || 0}, categories=${data.totalCategories || 0}`;
      }
      if (action === 'refresh') {
        summary.textContent = data.ok ? `Refresh complete at ${data.refreshedAt || 'unknown time'}` : 'Refresh failed.';
      }
    } catch (err) {
      output.textContent = String(err);
      summary.textContent = 'Request failed.';
    }
  }

  document.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => runAction(btn.dataset.action));
  });
})();
