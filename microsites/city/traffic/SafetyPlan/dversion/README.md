# Traffic SafetyPlan — DVersion bundle

Drupal-droppable build of the Vision Zero / Safety Plan dashboards.
Three partials ship together — each is independent, drop only what
you need:

| File | What it is | Source |
|---|---|---|
| `dist/cos-signal-timing.{html,css,js}` | "Your intersection, your voice" signal-timing action dashboard. | `../cos-signal-timing-action.njk` |
| `dist/cos-traffic-hub.{html,css,js}` | Colorado Springs Traffic Safety & Funding hub. | `../cos-traffic-hub.njk` |
| `dist/red-light-data.{html,css,js}` | Red-light camera citation data and trends. | `../red-light-data.njk` |

**Integration**: same pattern as
[forestry/dversion](../../../forestry/dversion/README.md) and
[CitizenConnect/dversion](../../../CitizenConnect/dversion/README.md).

**Rebuild**: `node microsites/city/traffic/SafetyPlan/dversion/build.mjs`

**Preview**: each partial has its own `preview/<name>.html`.
