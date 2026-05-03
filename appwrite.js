(() => {
  'use strict';
  const ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
  const PROJECT_ID = 'm2zpicks';
  const DATABASE_ID = 'm2zpicks-db';
  const COLLECTIONS = { tools: 'tools', ranks: 'ranks', creators: 'creators' };
  const TTL_MS = 10 * 60 * 1000;

  // Note: the `creators` table/collection must be created manually in Appwrite console before use.

  const { Client, Databases, Query } = window.Appwrite;
  const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID);
  const db = new Databases(client);

  const readCache = (key) => {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.ts || !Array.isArray(parsed?.data)) return null;
      if (Date.now() - parsed.ts > TTL_MS) return null;
      return parsed.data;
    } catch { return null; }
  };
  const writeCache = (key, data) => sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));

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

  const fetchAllTools = () => fetchAllPaginated(COLLECTIONS.tools, 'mz_tools_cache');
  const fetchAllRanks = () => fetchAllPaginated(COLLECTIONS.ranks, 'mz_ranks_cache');
  const fetchAllCreators = () => fetchAllPaginated(COLLECTIONS.creators, 'mz_creators_cache');

  async function fetchRankedTools() {
    const [tools, ranks] = await Promise.all([fetchAllTools(), fetchAllRanks()]);
    const rankById = new Map(ranks.map(r => [Number(r.id), r]));
    return tools.filter(t => rankById.has(Number(t.id))).map(t => ({ ...t, ...rankById.get(Number(t.id)) })).sort((a,b)=>a.rank-b.rank);
  }

  async function fetchToolById(numericId) {
    const res = await db.listDocuments(DATABASE_ID, COLLECTIONS.tools, [Query.equal('id', [Number(numericId)]), Query.limit(1)]);
    return res.documents[0] || null;
  }

  async function fetchToolsByCategory(category, limit = 24) {
    const res = await db.listDocuments(DATABASE_ID, COLLECTIONS.tools, [Query.equal('category', [category]), Query.orderDesc('$createdAt'), Query.limit(limit)]);
    return res.documents;
  }


  async function fetchToolsPage(limit = 48, cursorAfter = null) {
    const queries = [Query.limit(limit), Query.orderDesc('$createdAt')];
    if (cursorAfter) queries.push(Query.cursorAfter(cursorAfter));
    const res = await db.listDocuments(DATABASE_ID, COLLECTIONS.tools, queries);
    return {
      documents: res.documents,
      total: res.total,
      nextCursor: res.documents.length ? res.documents[res.documents.length - 1].$id : null
    };
  }

  async function fetchFeaturedTools(limit = 24) {
    const res = await fetchToolsPage(limit, null);
    return res.documents;
  }

  async function fetchHomepageStats() {
    const key = 'mz_home_stats_cache';
    const cached = readCache(key);
    if (cached) return cached;
    const tools = await fetchAllTools();
    const catMap = {};
    tools.forEach((t) => { catMap[t.category] = (catMap[t.category] || 0) + 1; });
    const stats = {
      totalTools: tools.length,
      totalCategories: Object.keys(catMap).length,
      topCategories: Object.entries(catMap).sort((a,b)=>b[1]-a[1]).map(([category,count])=>({category,count}))
    };
    writeCache(key, stats);
    return stats;
  }

  async function fetchToolsByIds(ids) {
    const uniq = [...new Set((ids || []).map((id) => Number(id)).filter(Boolean))];
    if (!uniq.length) return [];
    const chunks = [];
    for (let i = 0; i < uniq.length; i += 100) chunks.push(uniq.slice(i, i + 100));
    const out = [];
    for (const chunk of chunks) {
      const res = await db.listDocuments(DATABASE_ID, COLLECTIONS.tools, [Query.equal('id', chunk), Query.limit(100)]);
      out.push(...res.documents);
    }
    return out;
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

  window.AppwriteLayer = { fetchAllTools, fetchAllRanks, fetchRankedTools, fetchToolById, fetchToolsByCategory, fetchToolsByIds, fetchToolsPage, fetchFeaturedTools, fetchHomepageStats, fetchAllCreators, getCreatorPickLookup };
})();
