(() => {
  const AUTH = { username: 'm2z.ahmed', password: 'TestKey123' };
  const SESSION_KEY = 'm2z_admin_logged_in';
  const API_KEY_STORE = 'm2z_admin_appwrite_api_key';

  const $ = (id) => document.getElementById(id);
  const els = {
    loginCard: $('loginCard'), dashboard: $('dashboard'), loginForm: $('loginForm'), loginError: $('loginError'), logoutBtn: $('logoutBtn'),
    awEndpoint: $('awEndpoint'), awProject: $('awProject'), awDatabase: $('awDatabase'), awToolsCollection: $('awToolsCollection'), awCreatorsCollection: $('awCreatorsCollection'), awRanksCollection: $('awRanksCollection'),
    appwriteApiKey: $('appwriteApiKey'), saveApiKeyBtn: $('saveApiKeyBtn'), clearApiKeyBtn: $('clearApiKeyBtn'), apiKeyStatus: $('apiKeyStatus'),
    lockedNotice: $('lockedNotice'), adminTabsWrap: $('adminTabsWrap'), summary: $('summary'), output: $('output')
  };

  const getApiKey = () => localStorage.getItem(API_KEY_STORE) || '';

  function stateConfig() {
    return {
      endpoint: els.awEndpoint.value.trim(),
      project: els.awProject.value.trim(),
      database: els.awDatabase.value.trim(),
      collections: { tools: els.awToolsCollection.value.trim(), creators: els.awCreatorsCollection.value.trim(), ranks: els.awRanksCollection.value.trim() }
    };
  }

  function showDashboard() { els.loginCard.classList.add('hidden'); els.dashboard.classList.remove('hidden'); updateAccessState(); }
  function showLogin() { els.dashboard.classList.add('hidden'); els.loginCard.classList.remove('hidden'); }

  function updateAccessState() {
    const has = !!getApiKey().trim();
    els.adminTabsWrap.classList.toggle('hidden', !has);
    els.lockedNotice.classList.toggle('hidden', has);
    els.apiKeyStatus.textContent = has ? 'API key saved. CRUD unlocked.' : 'No API key saved.';
    if (has) els.appwriteApiKey.value = '••••••••••••••••';
  }

  function headers() {
    return {
      'x-appwrite-project': stateConfig().project,
      'x-appwrite-key': getApiKey(),
      'content-type': 'application/json'
    };
  }

  async function appwriteRequest(path, method='GET', body=null) {
    const { endpoint } = stateConfig();
    const res = await fetch(`${endpoint}${path}`, { method, headers: headers(), body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
    if (!res.ok) throw new Error(JSON.stringify({ status: res.status, data }));
    return data;
  }

  function collectionPath(name) {
    const cfg = stateConfig();
    return `/databases/${cfg.database}/collections/${cfg.collections[name]}/documents`;
  }

  async function listDocs(name) { return appwriteRequest(`${collectionPath(name)}?limit=100`); }
  async function getDoc(name, id) { return appwriteRequest(`${collectionPath(name)}/${id}`); }
  async function createDoc(name, payload) { return appwriteRequest(`${collectionPath(name)}`, 'POST', { documentId: 'unique()', data: payload }); }
  async function updateDoc(name, id, payload) { return appwriteRequest(`${collectionPath(name)}/${id}`, 'PATCH', { data: payload }); }
  async function deleteDoc(name, id) { return appwriteRequest(`${collectionPath(name)}/${id}`, 'DELETE'); }

  function parseJsonArea(id) {
    const raw = $(id).value.trim();
    if (!raw) return {};
    return JSON.parse(raw);
  }

  function setResult(label, data) {
    els.summary.textContent = label;
    els.output.textContent = JSON.stringify(data, null, 2);
  }

  if (sessionStorage.getItem(SESSION_KEY) === '1') showDashboard();

  els.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const u = $('username').value.trim(), p = $('password').value;
    if (u === AUTH.username && p === AUTH.password) { sessionStorage.setItem(SESSION_KEY, '1'); els.loginError.classList.add('hidden'); showDashboard(); }
    else els.loginError.classList.remove('hidden');
  });

  els.logoutBtn.addEventListener('click', () => { sessionStorage.removeItem(SESSION_KEY); showLogin(); });
  els.saveApiKeyBtn.addEventListener('click', () => { const v = els.appwriteApiKey.value.trim(); if (!v || v.includes('•')) return; localStorage.setItem(API_KEY_STORE, v); updateAccessState(); });
  els.clearApiKeyBtn.addEventListener('click', () => { localStorage.removeItem(API_KEY_STORE); els.appwriteApiKey.value=''; updateAccessState(); });

  document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`.tab-panel[data-panel="${tab.dataset.tab}"]`).classList.add('active');
  }));

  document.querySelectorAll('[data-overview]').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const a = btn.dataset.overview;
      if (a === 'count-tools') { const r = await listDocs('tools'); return setResult(`Tools: ${r.total || r.documents?.length || 0}`, r); }
      if (a === 'count-creators') { const r = await listDocs('creators'); return setResult(`Creators: ${r.total || r.documents?.length || 0}`, r); }
      if (a === 'count-ranks') { const r = await listDocs('ranks'); return setResult(`Ranks: ${r.total || r.documents?.length || 0}`, r); }
      if (a === 'list-first-tools') { const r = await listDocs('tools'); return setResult('First 50 tools fetched.', { total: r.total, documents: (r.documents || []).slice(0, 50) }); }
    } catch (e) { setResult('Action failed.', { error: String(e) }); }
  }));

  const bindCrud = (entity, docInputId, payloadId) => {
    document.querySelectorAll(`[data-${entity}]`).forEach((btn) => btn.addEventListener('click', async () => {
      try {
        const action = btn.dataset[entity];
        const docId = $(docInputId).value.trim();
        const payload = parseJsonArea(payloadId);
        if (action === 'list') return setResult(`${entity} list loaded.`, await listDocs(entity));
        if (action === 'get') return setResult(`${entity} document loaded.`, await getDoc(entity, docId));
        if (action === 'create') return setResult(`${entity} created.`, await createDoc(entity, payload));
        if (action === 'update') return setResult(`${entity} updated.`, await updateDoc(entity, docId, payload));
        if (action === 'delete') return setResult(`${entity} deleted.`, await deleteDoc(entity, docId));
      } catch (e) { setResult(`${entity} action failed.`, { error: String(e) }); }
    }));
  };

  bindCrud('tools', 'toolsDocId', 'toolsPayload');
  bindCrud('creators', 'creatorsDocId', 'creatorsPayload');
  bindCrud('ranks', 'ranksDocId', 'ranksPayload');
})();
