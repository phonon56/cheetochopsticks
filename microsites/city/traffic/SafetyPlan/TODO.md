# SAP microsite — outstanding manual steps

## 1. Patch the audit document

`SAP_Accessibility_Audit.docx` cites the original DOJ Title II compliance
deadline of **April 24, 2026**. The Interim Final Rule signed April 16, 2026
(effective April 20, 2026) extended this to:

- **April 26, 2027** — large public entities (population 50,000+, includes
  Colorado Springs)
- **April 26, 2028** — smaller entities and special districts (was
  April 26, 2027)

WCAG 2.1 AA is unchanged. Title II's underlying "equally effective
communication" obligation still applies regardless of rulemaking date.

### To apply the patch

The audit `.docx` was generated in another sandbox, so it isn't local yet.
Once you save it into this folder:

```sh
cd microsites/city/traffic/SafetyPlan
pip3 install python-docx        # one time
python3 patch_audit_deadline.py # auto-detects the .docx in this folder
```

The script:
- Backs up the original to `*.bak-YYYY-MM-DD.docx`
- Replaces every "April 24, 2026" with "April 26, 2027" across paragraphs,
  tables, headers, and footers (preserves run-level formatting)
- Appends a "Compliance deadline update" paragraph acknowledging the IFR
  if one isn't already present
- Reports how many occurrences it touched

If your audit uses a different filename pattern, pass the path explicitly:

```sh
python3 patch_audit_deadline.py path/to/SAP_Accessibility_Audit.docx
```
