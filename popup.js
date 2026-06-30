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
      resultSummary.textContent = 'Not found in 1.5M+ IOC index. Clean.';
    }
  });
}

btn.addEventListener('click', doLookup);
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLookup(); });
