# DugganUSA Threat Intel Scanner — Chrome Extension

**Any webpage, on demand. 1.9M+ indicators. Free (registered key). Auto-scan off by default.**

Scans any webpage for IPs, domains, SHA256 hashes, and CVEs. Highlights known threats with enrichment tooltips. Right-click any selected text for instant lookup. AIPM audit any domain. Popup quick-search.

## Privacy — auto-scan is OFF by default (v1.2.3)

**Correction to earlier versions.** Up to and including v1.2.2 this extension auto-scanned
every page on a fresh install, before you had touched a single setting. That is fixed:
auto-scan is now **opt-out by default in the strict sense — it does nothing until you turn it on.**

**Nothing is read from a page and nothing leaves your browser until you explicitly act.**

### What is collected when you enable auto-scan

With auto-scan ON, for every page you visit the extension reads the rendered text
(`document.body.innerText`), extracts up to **30** indicators, and sends **those extracted
values** to `https://analytics.dugganusa.com/api/v1/search/correlate` to check them against
the threat feed:

- IPv4 addresses
- Domain names
- SHA256 hashes
- CVE identifiers
- `.onion` addresses

That set **includes internal hostnames, private IP addresses, and staging domains** that
happen to be rendered on the page — including on intranet, HR, banking and healthcare
portals. We do not send page contents, URLs, form fields, or credentials; but the extracted
indicators alone are enough to leak internal network naming out of an organisation. Treat
enabling auto-scan as an organisational decision, not a personal preference.

The page text is processed **locally**; only the extracted indicator values are transmitted.
Requests carry your API key if you have set one. Results are cached in memory for 5 minutes.

### What happens with auto-scan OFF (the default)

Nothing is extracted and nothing is transmitted on page load. The extension stays fully
usable on demand:

- **Popup → "Scan this page"** — scans the current page once, when you click it
- **Right-click selected text → DugganUSA lookup** — sends only the text you selected
- **Popup quick-search** — sends only the value you type

The popup always shows the current auto-scan state (ON/OFF) so it is never ambiguous.

### Turning auto-scan on

It is a deliberate action: open the extension's options page and tick
**"Auto-scan every page for IOCs"**. The box is unchecked on a fresh install, and a
missing or unset preference is treated as OFF (fail-closed).

## What's New (v1.2.1)

- **Backed by deeper supply-chain coverage** — the corpus now ingests OSV malicious-package feeds for **both npm and PyPI** (named-malicious, zero-heuristic) plus daily GitHub Hunt detections of malware-staging repos, so package names and repo references on a page can light up too.
- **Four live, no-auth validation endpoints** prove feed quality: [feed-uniqueness](https://analytics.dugganusa.com/api/v1/feed-uniqueness) (novelty, ~75%+ unique vs ThreatFox), [kev-lead](https://analytics.dugganusa.com/api/v1/kev-lead) (timeliness — a live ledger of how far ahead of CISA KEV we flagged each exploited CVE, with positive leads, same-day, and no-receipt all shown honestly), [spamhaus-validation](https://analytics.dugganusa.com/api/v1/spamhaus-validation) (accuracy), and [feed-efficacy](https://analytics.dugganusa.com/api/v1/feed-efficacy) (liveness — opt-in consumer reports of when our indicators actually fire on real traffic, proof the feed is operationally live, not just large).
- **STIX feed is now API-key-enforced** — set a **free registered key** in the options page (anonymous requests get 401). Register at [analytics.dugganusa.com/stix/register](https://analytics.dugganusa.com/stix/register).

## Install

Load as unpacked extension (Chrome Web Store submission pending):

1. Clone this repo
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" → select this folder

## Features

- On-demand page scan from the popup ("Scan this page") — no background collection
- Optional auto-scan of every page (**off by default**, opt in via the options page)
- Red underline + tooltip on known-bad indicators
- Right-click context menu lookup
- Popup quick-search with shimmer button
- Options page for API key configuration (register a free key — the feed is key-enforced)
- Works on competitor blogs — see OUR enrichment on THEIR IOCs

## Part of the DugganUSA Ecosystem

- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=DugganUSALLC.dugganusa-threat-intel)
- [CLI Tool](https://github.com/pduggusa/dugganusa-cli) — `npx dugganusa-cli`
- [GitHub Action](https://github.com/pduggusa/dugganusa-action)
- [STIX Feed](https://analytics.dugganusa.com/api/v1/stix-feed)
- [AIPM](https://aipmsec.com)
- [dugganusa.com](https://www.dugganusa.com)

## License

MIT — [DugganUSA LLC](https://www.dugganusa.com)

---

<!-- DUGGANUSA-FAMILY-FOOTER-V1 -->
## DugganUSA Defender Family

Same threat corpus, surfaced wherever you live. Open source, MIT licensed, receipts on every repo.

| Plugin | Surface |
|---|---|
| [dugganusa-scanner-core](https://github.com/pduggusa/dugganusa-scanner-core) | Core IOC scanning engine |
| [dugganusa-vscode](https://github.com/pduggusa/dugganusa-vscode) | VS Code extension |
| [dugganusa-splunk](https://github.com/pduggusa/dugganusa-splunk) | Splunk Technology Add-on |
| [dugganusa-slack](https://github.com/pduggusa/dugganusa-slack) | Slack bot |
| [dugganusa-raycast](https://github.com/pduggusa/dugganusa-raycast) | Raycast extension |
| [dugganusa-sentinel](https://github.com/pduggusa/dugganusa-sentinel) | Microsoft Sentinel TAXII connector |
| [dugganusa-obsidian](https://github.com/pduggusa/dugganusa-obsidian) | Obsidian plugin |
| [dugganusa-nvim](https://github.com/pduggusa/dugganusa-nvim) | Neovim plugin |
| [dugganusa-elastic](https://github.com/pduggusa/dugganusa-elastic) | Elastic / OpenSearch integration |
| [dugganusa-edge-shield](https://github.com/pduggusa/dugganusa-edge-shield) | Cloudflare Worker |
| [dugganusa-cli](https://github.com/pduggusa/dugganusa-cli) | CLI scanner |
| **dugganusa-chrome** _(this repo)_ | Chrome extension |
| [dugganusa-action](https://github.com/pduggusa/dugganusa-action) | GitHub Action |
| [dredd-mcp](https://github.com/pduggusa/dredd-mcp) | Pre-flight MCP security (this repo) |

Backed by the live DugganUSA threat intel platform: [analytics.dugganusa.com](https://analytics.dugganusa.com).

_Jeevesus saves. Dredd judges._
