/**
 * Background service worker — handles API calls and context menu.
 * Runs in MV3 service worker context (no DOM access).
 */

const API_URL = 'https://analytics.dugganusa.com/api/v1';
const cache = new Map();
const CACHE_TTL = 300000; // 5 min

// Context menu: right-click selected text → look up
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'dugganusa-lookup',
    title: 'DugganUSA: Look up "%s"',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: 'dugganusa-tor-relay',
    title: 'DugganUSA: Check Tor Relay "%s"',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === 'dugganusa-lookup' && info.selectionText) {
    const result = await lookupIOC(info.selectionText.trim());
    // Send result to content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'lookup-result',
        value: info.selectionText.trim(),
        result
      });
    }
  }
  if (info.menuItemId === 'dugganusa-tor-relay' && info.selectionText) {
    const result = await checkTorRelay(info.selectionText.trim());
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'tor-relay-result',
        value: info.selectionText.trim(),
        result
      });
    }
  }
});

// Listen for lookup requests from content script and popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'lookup') {
    lookupIOC(msg.value).then(sendResponse);
    return true; // async response
  }
  if (msg.type === 'batch-lookup') {
    batchLookup(msg.values).then(sendResponse);
    return true;
  }
  if (msg.type === 'check-tor-relay') {
    checkTorRelay(msg.value).then(sendResponse);
    return true;
  }
  if (msg.type === 'get-stats') {
    sendResponse({ cacheSize: cache.size });
    return true;
  }
});

async function getApiKey() {
  return new Promise(resolve => {
    chrome.storage.sync.get(['apiKey'], (r) => resolve(r.apiKey || ''));
  });
}

async function lookupIOC(value) {
  const key = value.toLowerCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.result;

  const apiKey = await getApiKey();
  const url = API_URL + '/search/correlate?q=' + encodeURIComponent(value);
  const headers = {};
  if (apiKey) headers['Authorization'] = 'Bearer ' + apiKey;

  try {
    const res = await fetch(url, { headers });
    const json = await res.json();
    const correlations = json.data?.correlations || {};
    const hits = Object.values(correlations)
      .reduce((s, h) => s + (Array.isArray(h) ? h.length : 0), 0);
    const result = hits > 0
      ? { found: true, hits, data: correlations }
      : { found: false, hits: 0 };
    cache.set(key, { ts: Date.now(), result });
    return result;
  } catch (e) {
    return { found: false, hits: 0, error: e.message };
  }
}

async function checkTorRelay(ip) {
  const apiKey = await getApiKey();
  const url = API_URL + '/tor/relays?q=' + encodeURIComponent(ip) + '&limit=1';
  const headers = {};
  if (apiKey) headers['Authorization'] = 'Bearer ' + apiKey;

  try {
    const res = await fetch(url, { headers });
    const json = await res.json();
    const relays = json.data?.relays || json.data || [];
    if (Array.isArray(relays) && relays.length > 0) {
      const r = relays[0];
      return {
        isRelay: true,
        nickname: r.nickname || null,
        flags: Array.isArray(r.flags) ? r.flags.join(', ') : r.flags || null,
        country: r.country || null,
        asn: r.as_number || r.asn || null,
        bandwidth: r.bandwidth || null,
      };
    }
    return { isRelay: false };
  } catch (e) {
    return { isRelay: false, error: e.message };
  }
}

async function batchLookup(values) {
  const results = [];
  for (const value of values.slice(0, 30)) {
    const r = await lookupIOC(value);
    results.push({ value, ...r });
  }
  return results;
}
