/**
 * Content script — scans page text for IOCs and highlights matches.
 *
 * PRIVACY: auto-scanning is OFF BY DEFAULT. Nothing is extracted from the page
 * and nothing is sent to the API until the user explicitly opts in by enabling
 * "Auto-scan pages for IOCs" in the options page. Missing/undefined settings are
 * treated as DISABLED (fail-closed). On-demand scanning stays available at any
 * time via the popup's "Scan this page" button and the right-click context menu.
 */

const PATTERNS = {
  ipv4: /\b(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\b/g,
  domain: /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|net|org|io|ai|dev|xyz|info|biz|co|me|app|cloud|online|site|tech|ru|cn|ir|kp|de|fr|nl|uk|au|br|jp|kr|sg|il|sa|ae)\b/gi,
  sha256: /\b[a-fA-F0-9]{64}\b/g,
  cve: /CVE-\d{4}-\d{4,7}/gi,
  onion: /\b[a-z2-7]{56}\.onion\b/g,
};

const SKIP_IPS = new Set(['0.0.0.0','127.0.0.1','255.255.255.255','10.0.0.1','192.168.0.1','192.168.1.1','172.16.0.1','8.8.8.8','8.8.4.4','1.1.1.1','1.0.0.1','9.9.9.9']);
const SKIP_DOMAINS = new Set(['github.com','google.com','microsoft.com','apple.com','amazon.com','cloudflare.com','mozilla.org','example.com','localhost','npmjs.com','nodejs.org','w3.org','schema.org','youtube.com','twitter.com','linkedin.com','facebook.com','instagram.com','reddit.com','wikipedia.org','dugganusa.com']);

function extractIOCs(text) {
  const iocs = [];
  for (const [type, regex] of Object.entries(PATTERNS)) {
    for (const m of text.matchAll(regex)) {
      if (type === 'ipv4' && SKIP_IPS.has(m[0])) continue;
      if (type === 'domain' && SKIP_DOMAINS.has(m[0].toLowerCase())) continue;
      iocs.push({ value: m[0], type });
    }
  }
  const seen = new Set();
  return iocs.filter(i => { if (seen.has(i.value.toLowerCase())) return false; seen.add(i.value.toLowerCase()); return true; });
}

function summarize(data) {
  if (!data) return '';
  const parts = [];
  for (const [idx, hits] of Object.entries(data)) {
    if (!Array.isArray(hits) || !hits.length) continue;
    const f = hits[0];
    if (idx === 'iocs') parts.push((f.malware_family || f.threat_type || '?') + ' (' + (f.source || '?') + ')');
    else if (idx === 'block_events') parts.push('Blocked ' + hits.length + 'x');
    else if (idx === 'pulses') parts.push(hits.length + ' pulse(s)');
    else if (idx === 'cisa_kev') parts.push('CISA KEV');
    else if (idx === 'adversaries') parts.push('APT: ' + (f.name || '?'));
  }
  return parts.join(' · ');
}

/**
 * Highlight a text node's IOC matches with a tooltip span.
 */
function highlightIOC(textNode, value, result) {
  const text = textNode.textContent;
  const idx = text.indexOf(value);
  if (idx === -1) return;

  const before = document.createTextNode(text.slice(0, idx));
  const after = document.createTextNode(text.slice(idx + value.length));

  const span = document.createElement('span');
  span.className = 'dugganusa-ioc-highlight';
  span.textContent = value;
  span.title = 'DugganUSA: ' + summarize(result.data) + ' (' + result.hits + ' hits)';
  span.dataset.dugganusaHits = result.hits;

  const parent = textNode.parentNode;
  parent.insertBefore(before, textNode);
  parent.insertBefore(span, textNode);
  parent.insertBefore(after, textNode);
  parent.removeChild(textNode);
}

/**
 * Walk the DOM and find text nodes containing IOC values.
 */
function findTextNodes(root, value) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      if (node.parentElement?.closest('script,style,noscript,dugganusa-ioc-highlight,.dugganusa-ioc-highlight')) return NodeFilter.FILTER_REJECT;
      return node.textContent.includes(value) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}

// Listen for lookup results from background (context menu)
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'lookup-result' && msg.result?.found) {
    const nodes = findTextNodes(document.body, msg.value);
    nodes.forEach(n => highlightIOC(n, msg.value, msg.result));
  }
  if (msg.type === 'tor-relay-result') {
    const r = msg.result;
    if (r && r.isRelay) {
      const info = [
        r.nickname ? 'Nickname: ' + r.nickname : null,
        r.flags ? 'Flags: ' + r.flags : null,
        r.country ? 'Country: ' + r.country : null,
        r.asn ? 'ASN: ' + r.asn : null,
        r.bandwidth ? 'Bandwidth: ' + r.bandwidth : null,
      ].filter(Boolean).join(' | ');
      alert('DugganUSA Tor Relay: ' + msg.value + ' IS a relay.\n' + info);
    } else {
      alert('DugganUSA Tor: ' + msg.value + ' is NOT a known Tor relay.');
    }
  }
});

/**
 * Auto-scan gate — DEFAULT OFF.
 *
 * Returns true ONLY when the user has explicitly stored enabled === true.
 * undefined (fresh install), {}, null, and false all return false. This is the
 * opposite of the old `enabled !== false` test, which scanned every page on a
 * fresh install before the user had ever seen a setting.
 */
async function isAutoScanEnabled() {
  const settings = await new Promise(r => chrome.storage.sync.get(['enabled'], r));
  return settings?.enabled === true;
}

/**
 * Main scan.
 *
 * On page load this runs ONLY if the user explicitly opted in. A manual scan
 * ({ manual: true }) is an explicit user action (popup button) and bypasses the
 * auto-scan preference by design — the user asked for this page, right now.
 */
async function scanPage(opts = {}) {
  const manual = opts.manual === true;

  if (!manual && !(await isAutoScanEnabled())) return { scanned: false, reason: 'auto-scan-disabled' };

  const text = document.body?.innerText || '';
  if (text.length < 10) return { scanned: true, threats: 0 };

  const iocs = extractIOCs(text);
  if (!iocs.length) return { scanned: true, threats: 0 };

  // Batch lookup via background service worker (max 30)
  const values = iocs.slice(0, 30).map(i => i.value);
  const results = await new Promise(r => chrome.runtime.sendMessage({ type: 'batch-lookup', values }, r));
  if (!results) return { scanned: true, threats: 0 };

  const threats = results.filter(r => r.found);
  if (!threats.length) return { scanned: true, threats: 0 };

  // Highlight each threat on the page
  for (const threat of threats) {
    const nodes = findTextNodes(document.body, threat.value);
    nodes.forEach(n => highlightIOC(n, threat.value, threat));
  }

  // Badge: show count
  chrome.runtime.sendMessage({ type: 'set-badge', count: threats.length });
  return { scanned: true, threats: threats.length };
}

// On-demand scan requested by the user from the popup. Explicit user action, so
// it runs regardless of the auto-scan preference.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'scan-page-now') {
    scanPage({ manual: true })
      .then(sendResponse)
      .catch(e => sendResponse({ scanned: false, error: e.message }));
    return true; // async response
  }
});

// Auto-scan on page load — gated on explicit opt-in inside scanPage().
if (document.readyState === 'complete') {
  setTimeout(() => scanPage({ manual: false }), 1000);
} else {
  window.addEventListener('load', () => setTimeout(() => scanPage({ manual: false }), 1000));
}
