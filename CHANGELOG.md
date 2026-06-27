# Changelog

## 1.2.0

- Documented expanded supply-chain coverage behind the corpus: OSV malicious-package ingestion for both npm and PyPI plus daily GitHub Hunt malware-staging-repo detections.
- Added the three live, no-auth validation endpoints (feed-uniqueness, kev-lead, spamhaus-validation) proving novelty, timeliness, and accuracy.
- Corrected for API-key enforcement: the STIX feed returns 401 anonymous. The free tier is a free *registered* key — set it in the options page.
- Aligned IOC count to 1.10M+ indicators.
- Fixed dead `npx dugganusa-lookup` reference to `npx dugganusa-cli`.

## 1.1.0

- Auto page scanning, right-click lookup, popup quick-search, AIPM audit, options page.
