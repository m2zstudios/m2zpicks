(() => {
  'use strict';

  const CACHE_BRIDGE_BASE = 'https://m2zpicks-cache-bridge.m2zinnovative.workers.dev';
  const ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
  const PROJECT_ID = 'm2zpicks';
  const DATABASE_ID = 'm2zpicks-db';
  const COLLECTIONS = { tools: 'tools', ranks: 'ranks', creators: 'creators' };
  const TTL_MS = 10 * 60 * 1000;

  const { Client, Databases, Query } = window.Appwrite;
  const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID);
  const db = new Databases(client);

  const readCache = (key) => {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.ts) return null;
      if (Date.now() - parsed.ts > TTL_MS) return null;
      return parsed.data;
    } catch { return null; }
  };

  const writeCache = (key, data) => sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));

  async function fetchBridge(path, cacheKey) {
    const cached = readCache(cacheKey);
    if (cached) return cached;

    const res = await fetch(`${CACHE_BRIDGE_BASE}${path}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Cache bridge failed: ${res.status} ${path}`);

    const json = await res.json();
    writeCache(cacheKey, json);
    return json;
  }

  async function fetchAllPaginated(collectionId, cacheKey) {
    const cached = readCache(cacheKey);
    if (cached) return cached;

    const all = [];
    let offset = 0;
    let total = Infinity;

    while (offset < total) {
      const res = await db.listDocuments(DATABASE_ID, collectionId, [Query.limit(100), Query.offset(offset)]);
      total = res.total;
      all.push(...res.documents);
      offset += res.documents.length;
      if (!res.documents.length) break;
    }

    writeCache(cacheKey, all);
    return all;
  }

  const fetchAllTools = async () => (await fetchBridge('/tools', 'mz_tools_cache_bridge')).tools || [];
  const fetchCategories = async () => (await fetchBridge('/categories', 'mz_categories_cache_bridge')).categories || [];
  const fetchBridgeStats = async () => fetchBridge('/stats', 'mz_stats_cache_bridge');
  const fetchLatestTools = async () => (await fetchBridge('/latest', 'mz_latest_cache_bridge')).latest || [];

  const fetchAllRanks = () => fetchAllPaginated(COLLECTIONS.ranks, 'mz_ranks_cache');
  const fetchAllCreators = () => fetchAllPaginated(COLLECTIONS.creators, 'mz_creators_cache');

  async function fetchRankedTools() {
    const [tools, ranks] = await Promise.all([fetchAllTools(), fetchAllRanks()]);
    const rankById = new Map(ranks.map(r => [Number(r.id), r]));
    return tools.filter(t => rankById.has(Number(t.id))).map(t => ({ ...t, ...rankById.get(Number(t.id)) })).sort((a, b) => a.rank - b.rank);
  }

  async function fetchToolById(numericId) {
    const tools = await fetchAllTools();
    return tools.find(t => Number(t.id) === Number(numericId)) || null;
  }

  async function fetchToolsByCategory(category, limit = 24) {
    const tools = await fetchAllTools();
    return tools
      .filter((t) => String(t.category) === String(category))
      .sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt))
      .slice(0, limit);
  }

  async function fetchToolsPage(limit = 48, cursorAfter = null) {
    const tools = (await fetchAllTools()).slice().sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
    let start = 0;

    if (cursorAfter) {
      const idx = tools.findIndex((t) => t.$id === cursorAfter);
      start = idx >= 0 ? idx + 1 : 0;
    }

    const documents = tools.slice(start, start + limit);
    const nextCursor = documents.length === limit ? documents[documents.length - 1].$id : null;

    return { documents, total: tools.length, nextCursor };
  }

  async function fetchFeaturedTools(limit = 24) {
    const latest = await fetchLatestTools();
    return latest.slice(0, limit);
  }

  async function fetchHomepageStats() {
    const stats = await fetchBridgeStats();
    const categories = await fetchCategories();

    return {
      totalTools: stats.totalTools || 0,
      totalCategories: stats.totalCategories || 0,
      topCategories: categories
    };
  }

  async function fetchToolsByIds(ids) {
    const uniq = [...new Set((ids || []).map((id) => Number(id)).filter(Boolean))];
    if (!uniq.length) return [];
    const tools = await fetchAllTools();
    const idSet = new Set(uniq);
    return tools.filter((t) => idSet.has(Number(t.id)));
  }

  async function getCreatorPickLookup() {
    const creators = await fetchAllCreators();
    const map = new Map();
    creators.forEach((c) => (c.pick_ids || []).forEach((id) => {
      const k = Number(id);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(c);
    }));
    return map;
  }

  window.AppwriteLayer = {
    fetchAllTools,
    fetchCategories,
    fetchAllRanks,
    fetchRankedTools,
    fetchToolById,
    fetchToolsByCategory,
    fetchToolsByIds,
    fetchToolsPage,
    fetchFeaturedTools,
    fetchHomepageStats,
    fetchAllCreators,
    getCreatorPickLookup
  };
})();
