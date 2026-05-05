# CSPD requests — DVersion bundle

Drupal-droppable build of the CSPD records-request and field-entry
redesigns. Four partials ship together — each is independent, drop
only what you need:

| File | What it is | Source |
|---|---|---|
| `dist/cos-portal-redesign.{html,css,js}` | "Tell us what you need" plain-language portal routing. | `../cos-portal-redesign.njk` |
| `dist/cspd-records-redesign.{html,css,js}` | CSPD records request page redesign. | `../cospd_records_page_redesign.njk` |
| `dist/cspd-field-entry-prototype.{html,css,js}` | Crash-report field-entry prototype (officer-facing). | `../cspd-field-entry-prototype.njk` |
| `dist/cspd-field-entry.{html,css,js}` | Field entry v8 with drag-drop and lightbox attachments. | `../cspd-field-entry.njk` |

**Integration**: same pattern as
[forestry/dversion](../../../forestry/dversion/README.md) and
[CitizenConnect/dversion](../../../CitizenConnect/dversion/README.md).

**Rebuild**: `node microsites/city/police/requests/dversion/build.mjs`

**Preview**: each partial has its own `preview/<name>.html`.
