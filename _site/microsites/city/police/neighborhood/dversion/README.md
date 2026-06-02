# CSPD neighborhood data — DVersion bundle

Drupal-droppable build of the CSPD crash-data and weekly-blotter
accessibility cluster. Five partials ship together — each is
independent, drop only what you need:

| File | What it is | Source |
|---|---|---|
| `dist/cspd-audit-bjpt.{html,css,js}` | Accessibility & data-quality audit of the bjpt-tkzq crash dataset. | `../audit-bjpt-tkzq.njk` |
| `dist/cspd-audit-memo.{html,css,js}` | Consolidated audit memo across the seven CSPD chart portfolio pages. | `../audit-memo-12C-consolidated.njk` |
| `dist/cspd-blotter-weekly.{html,css,js}` | Weekly blotter chart snippet (large dataset embedded). | `../chart_snippet-cspdblotter-weekly.njk` |
| `dist/cspd-five-questions.{html,css,js}` | "What residents actually ask" — CSPD data reorganized around five questions. | `../cspd_five_questions.njk` |
| `dist/cspd-fatality-register.{html,css,js}` | CSPD Fatality Register (474 deaths / 4 years of zeros). | `../fatality_register_bjpt-tkzq.njk` |

**Integration**: same pattern as
[forestry/dversion](../../../forestry/dversion/README.md) and
[CitizenConnect/dversion](../../../CitizenConnect/dversion/README.md).
The accessibility/responsiveness notes in those READMEs apply here too.

**Rebuild**: `node microsites/city/police/neighborhood/dversion/build.mjs`

**Preview**: each partial has its own `preview/<name>.html`.
