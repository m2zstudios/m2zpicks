(() => {
  const AUTH = { username: 'm2z.ahmed', password: 'TestKey123' };
  const SESSION_KEY = 'm2z_admin_logged_in';
  const API_KEY_STORE = 'm2z_admin_appwrite_api_key';

  const els = {
    loginCard: document.getElementById('loginCard'),
    dashboard: document.getElementById('dashboard'),
    loginForm: document.getElementById('loginForm'),
    loginError: document.getElementById('loginError'),
    logoutBtn: document.getElementById('logoutBtn'),
    baseUrl: document.getElementById('baseUrl'),
    refreshToken: document.getElementById('refreshToken'),
    appwriteApiKey: document.getElementById('appwriteApiKey'),
    saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
    clearApiKeyBtn: document.getElementById('clearApiKeyBtn'),
    apiKeyStatus: document.getElementById('apiKeyStatus'),
    lockedNotice: document.getElementById('lockedNotice'),
    controlsWrap: document.getElementById('controlsWrap'),
    output: document.getElementById('output'),
    summary: document.getElementById('summary')
  };

  const endpoints = { health: '/health', stats: '/stats', categories: '/categories', tools: '/tools', latest: '/latest' };

  const getApiKey = () => localStorage.getItem(API_KEY_STORE) || '';
  const setApiKey = (v) => localStorage.setItem(API_KEY_STORE, v);
  const clearApiKey = () => localStorage.removeItem(API_KEY_STORE);

  function updateAccessState() {
    const hasKey = !!getApiKey().trim();
    els.controlsWrap.classList.toggle('hidden', !hasKey);
    els.lockedNotice.classList.toggle('hidden', hasKey);
    els.apiKeyStatus.textContent = hasKey ? 'API key saved. Full controls unlocked.' : 'No API key saved.';
    if (hasKey) els.appwriteApiKey.value = '••••••••••••••••';
  }

  function showDashboard() { els.loginCard.classList.add('hidden'); els.dashboard.classList.remove('hidden'); updateAccessState(); }
  function showLogin() { els.dashboard.classList.add('hidden'); els.loginCard.classList.remove('hidden'); }

  if (sessionStorage.getItem(SESSION_KEY) === '1') showDashboard();

  els.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value;
    if (u === AUTH.username && p === AUTH.password) {
      sessionStorage.setItem(SESSION_KEY, '1');
      els.loginError.classList.add('hidden');
      showDashboard();
    } else {
      els.loginError.classList.remove('hidden');
    }
  });

  els.logoutBtn.addEventListener('click', () => { sessionStorage.removeItem(SESSION_KEY); showLogin(); });
  els.saveApiKeyBtn.addEventListener('click', () => {
    const value = els.appwriteApiKey.value.trim();
    if (!value || value.includes('•')) return;
    setApiKey(value);
    updateAccessState();
  });
  els.clearApiKeyBtn.addEventListener('click', () => {
    clearApiKey();
    els.appwriteApiKey.value = '';
    updateAccessState();
  });

  async function callBridge(action) {
    const base = els.baseUrl.value.trim().replace(/\/$/, '');
    const endpoint = action === 'refresh' ? '/refresh' : endpoints[action];
    const options = action === 'refresh' ? { method: 'POST', headers: { 'x-refresh-token': els.refreshToken.value.trim() } } : { method: 'GET' };
    const res = await fetch(`${base}${endpoint}`, options);
    const text = await res.text();
    let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return { status: res.status, data };
  }

  async function run(action) {
    els.output.textContent = `Loading ${action}...`;
    try {
      const result = await callBridge(action);
      els.output.textContent = JSON.stringify(result, null, 2);
      if (action === 'tools') {
        const tools = result.data.tools || [];
        els.summary.textContent = `Tools loaded: ${tools.length} | First IDs: ${tools.slice(0, 15).map(t => t.id).join(', ')}`;
      } else if (action === 'categories') {
        els.summary.textContent = `Categories loaded: ${(result.data.categories || []).length}`;
      } else if (action === 'stats') {
        els.summary.textContent = `Stats => Tools: ${result.data.totalTools || 0}, Categories: ${result.data.totalCategories || 0}`;
      } else if (action === 'refresh') {
        els.summary.textContent = result.data.ok ? `Refresh done at ${result.data.refreshedAt}` : 'Refresh failed.';
      }
    } catch (err) {
      els.output.textContent = String(err);
      els.summary.textContent = 'Request failed.';
    }
  }

  async function runDb(action) {
    els.output.textContent = `Loading ${action}...`;
    const result = await callBridge('tools');
    const tools = result.data.tools || [];

    if (action === 'countTools') {
      els.summary.textContent = `Total tools in cache: ${tools.length}`;
      els.output.textContent = JSON.stringify({ total: tools.length }, null, 2);
      return;
    }

    if (action === 'listFirst100') {
      const first100 = tools.slice().sort((a, b) => Number(a.id || 0) - Number(b.id || 0)).slice(0, 100);
      els.summary.textContent = `Showing first 100 tools by numeric id.`;
      els.output.textContent = JSON.stringify(first100, null, 2);
      return;
    }

    if (action === 'validateSequence') {
      const sorted = tools.slice().sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
      const ids = sorted.map(t => Number(t.id)).filter(Number.isFinite);
      const gaps = [];
      for (let i = 1; i < ids.length; i++) {
        if (ids[i] !== ids[i - 1] + 1) gaps.push({ from: ids[i - 1], to: ids[i] });
      }
      els.summary.textContent = gaps.length ? `ID sequence has ${gaps.length} gaps.` : 'ID sequence looks continuous.';
      els.output.textContent = JSON.stringify({ total: ids.length, first: ids[0], last: ids[ids.length - 1], gaps: gaps.slice(0, 30) }, null, 2);
    }
  }

  document.querySelectorAll('[data-action]').forEach((btn) => btn.addEventListener('click', () => run(btn.dataset.action)));
  document.querySelectorAll('[data-db-action]').forEach((btn) => btn.addEventListener('click', () => runDb(btn.dataset.dbAction)));
})();
