# Changelog

## [1.2.3] - 2026-07-19

### Security / Privacy
- **Auto-scan is now OFF by default.** Through v1.2.2 the content script ran on
  `<all_urls>` and scanned every page on load unless `enabled` was explicitly `false`,
  so a fresh install with no stored settings scanned everything and shipped up to 30
  extracted indicators per page to the API before the user had seen a setting. Internal
  hostnames, private IPs and staging domains rendered on intranet, HR, banking and
  healthcare pages left the browser by default. The gate is now fail-closed: auto-scan
  requires an explicit stored `enabled === true`; undefined, `{}` and `false` all disable it.
- Options page checkbox now defaults to unchecked and states plainly what is transmitted
  when it is turned on.

### Added
- Popup "Scan this page" button for explicit, per-page on-demand scanning, so the
  extension stays useful with auto-scan off.
- Popup shows the current auto-scan state (ON/OFF).

### Changed
- README documents exactly what is collected when auto-scan is enabled, and explicitly
  corrects the earlier default-on behaviour rather than quietly changing it.

## [1.2.2] - 2026-06-30

### Fixed
- Aligned in-tool/runtime IOC-count strings to 1.5M+ (the v1.2.1 docs refresh updated the README but missed the strings the tool prints at runtime).

## [1.2.1] - 2026-06-30

### Added
- Documented the fourth live validation axis — Liveness (/api/v1/feed-efficacy).

### Changed
- Refreshed IOC corpus copy to 1.5M+ IOCs (~1.57M live).
- Reworded the Timeliness validation bullet to point at the live kev-lead ledger instead of a fixed "~31 days ahead" average.

## 1.2.0

- Documented expanded supply-chain coverage behind the corpus: OSV malicious-package ingestion for both npm and PyPI plus daily GitHub Hunt malware-staging-repo detections.
- Added the three live, no-auth validation endpoints (feed-uniqueness, kev-lead, spamhaus-validation) proving novelty, timeliness, and accuracy.
- Corrected for API-key enforcement: the STIX feed returns 401 anonymous. The free tier is a free *registered* key — set it in the options page.
- Aligned IOC count to 1.10M+ indicators.
- Fixed dead `npx dugganusa-lookup` reference to `npx dugganusa-cli`.

## 1.1.0

- Auto page scanning, right-click lookup, popup quick-search, AIPM audit, options page.
