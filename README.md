# DugganUSA Threat Intel Scanner — Chrome Extension

**Every webpage is an IOC scanner. 1.10M+ indicators. Free (registered key).**

Scans any webpage for IPs, domains, SHA256 hashes, and CVEs. Highlights known threats with enrichment tooltips. Right-click any selected text for instant lookup. AIPM audit any domain. Popup quick-search.

## What's New (v1.2.0)

- **Backed by deeper supply-chain coverage** — the corpus now ingests OSV malicious-package feeds for **both npm and PyPI** (named-malicious, zero-heuristic) plus daily GitHub Hunt detections of malware-staging repos, so package names and repo references on a page can light up too.
- **Three live, no-auth validation endpoints** prove feed quality: [feed-uniqueness](https://analytics.dugganusa.com/api/v1/feed-uniqueness) (novelty, ~75%+ unique vs ThreatFox), [kev-lead](https://analytics.dugganusa.com/api/v1/kev-lead) (timeliness, ~31 days ahead of CISA KEV), and [spamhaus-validation](https://analytics.dugganusa.com/api/v1/spamhaus-validation) (accuracy).
- **STIX feed is now API-key-enforced** — set a **free registered key** in the options page (anonymous requests get 401). Register at [analytics.dugganusa.com/stix/register](https://analytics.dugganusa.com/stix/register).

## Install

Load as unpacked extension (Chrome Web Store submission pending):

1. Clone this repo
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" → select this folder

## Features

- Auto-scan every page for IOCs (toggleable)
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
