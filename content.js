/**
 * Content script — scans page text for IOCs and highlights matches.
 * Runs on every page. Lightweight: only scans visible text, capped at 30 lookups.
 */

const PATTERNS = {
  ipv4: /\b(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\b/g,
  domain: /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|net|org|io|ai|dev|xyz|info|biz|co|me|app|cloud|online|site|tech|ru|cn|ir|kp|de|fr|nl|uk|au|br|jp|kr|sg|il|sa|ae)\b/gi,
  sha256: /\b[a-fA-F0-9]{64}\b/g,
  cve: /CVE-\d{4}-\d{4,7}/gi,
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
});

/**
 * Main scan — runs on page load.
 */
async function scanPage() {
  // Check if scanning is enabled
  const settings = await new Promise(r => chrome.storage.sync.get(['enabled'], r));
  if (settings.enabled === false) return;

  const text = document.body?.innerText || '';
  if (text.length < 10) return;

  const iocs = extractIOCs(text);
  if (!iocs.length) return;

  // Batch lookup via background service worker (max 30)
  const values = iocs.slice(0, 30).map(i => i.value);
  chrome.runtime.sendMessage({ type: 'batch-lookup', values }, (results) => {
    if (!results) return;
    const threats = results.filter(r => r.found);
    if (!threats.length) return;

    // Highlight each threat on the page
    for (const threat of threats) {
      const nodes = findTextNodes(document.body, threat.value);
      nodes.forEach(n => highlightIOC(n, threat.value, threat));
    }

    // Badge: show count
    chrome.runtime.sendMessage({ type: 'set-badge', count: threats.length });
  });
}

// Run scan after page settles
if (document.readyState === 'complete') {
  setTimeout(scanPage, 1000);
} else {
  window.addEventListener('load', () => setTimeout(scanPage, 1000));
}
