const input = document.getElementById('input');
const btn = document.getElementById('btn');
const resultDiv = document.getElementById('result');
const resultValue = document.getElementById('resultValue');
const resultSummary = document.getElementById('resultSummary');

function summarize(data) {
  if (!data) return 'Match found in DugganUSA index';
  const parts = [];
  for (const [idx, hits] of Object.entries(data)) {
    if (!Array.isArray(hits) || !hits.length) continue;
    const f = hits[0];
    if (idx === 'iocs') parts.push((f.malware_family || f.threat_type || '?') + ' (' + (f.source || '?') + ')');
    else if (idx === 'block_events') parts.push('Blocked ' + hits.length + 'x');
    else if (idx === 'pulses') parts.push(hits.length + ' OTX pulse(s)');
    else if (idx === 'cisa_kev') parts.push('CISA KEV');
    else if (idx === 'adversaries') parts.push('APT: ' + (f.name || '?'));
  }
  return parts.join(' · ') || 'Match found';
}

async function doLookup() {
  const value = input.value.trim();
  if (!value) return;

  btn.textContent = '...';
  resultDiv.style.display = 'none';

  chrome.runtime.sendMessage({ type: 'lookup', value }, (result) => {
    btn.textContent = 'Scan';
    resultDiv.style.display = 'block';

    if (result && result.found) {
      resultDiv.className = 'result found';
      resultValue.textContent = value;
      resultSummary.textContent = result.hits + ' hits — ' + summarize(result.data);
    } else {
      resultDiv.className = 'result clean';
      resultValue.textContent = value;
      resultSummary.textContent = 'Not found in the DugganUSA IOC index. Clean.';
    }
  });
}

btn.addEventListener('click', doLookup);
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLookup(); });

// --- On-demand page scan + auto-scan state -------------------------------
// Auto-scan is OFF by default. This button is the explicit, per-page opt-in
// that keeps the extension useful without scanning everything you browse.

const scanPageBtn = document.getElementById('scanPageBtn');
const autoState = document.getElementById('autoState');

function renderAutoState(enabled) {
  autoState.textContent = 'Auto-scan: ';
  const badge = document.createElement('span');
  badge.className = enabled ? 'on' : 'off';
  badge.textContent = enabled ? 'ON' : 'OFF';
  autoState.appendChild(badge);
  autoState.appendChild(document.createTextNode(
    enabled
      ? ' - every page you visit is scanned. Change in options.'
      : ' (default) - nothing is sent until you scan. Enable in options.'
  ));
}

chrome.storage.sync.get(['enabled'], (r) => renderAutoState(r?.enabled === true));

scanPageBtn.addEventListener('click', async () => {
  scanPageBtn.textContent = 'Scanning...';
  scanPageBtn.disabled = true;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    scanPageBtn.textContent = 'No active tab';
    scanPageBtn.disabled = false;
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: 'scan-page-now' }, (res) => {
    scanPageBtn.disabled = false;
    if (chrome.runtime.lastError || !res) {
      scanPageBtn.textContent = 'Cannot scan this page';
      setTimeout(() => { scanPageBtn.textContent = 'Scan this page'; }, 2500);
      return;
    }
    scanPageBtn.textContent = res.threats
      ? res.threats + ' threat(s) highlighted'
      : 'No known threats found';
    setTimeout(() => { scanPageBtn.textContent = 'Scan this page'; }, 2500);
  });
});
