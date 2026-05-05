# CORA — DVersion bundle

Drupal-droppable build of the Colorado Open Records Act request flow.
Two partials ship together because they're the form and its
implementation guide:

| File | What it is | Source |
|---|---|---|
| `dist/cora-form.html` + `.css` + `.js` | Public-facing record-request form. Routes to `Records.Department@coloradosprings.gov` via `mailto:`. | `../cos-cora-form.njk` |
| `dist/cora-guide.html` + `.css` + `.js` | Internal implementation guide for staff (workflow, routing, retention). | `../cos-cora-implementation-guide.njk` |

Each partial is independent: drop one without the other if you only
need that piece.

**Integration**: same pattern as
[forestry/dversion](../../forestry/dversion/README.md) and
[CitizenConnect/dversion](../../CitizenConnect/dversion/README.md) —
paste the HTML into a Drupal Custom Block, attach the CSS/JS as a
library, and add `--themed` to the root class for the cheetochopsticks
palette. The accessibility/responsiveness notes in those READMEs apply
here too.

**Rebuild**: `node microsites/city/coraform/dversion/build.mjs`

**Preview**: open
[`preview/cora-form.html`](preview/cora-form.html) or
[`preview/cora-guide.html`](preview/cora-guide.html).
