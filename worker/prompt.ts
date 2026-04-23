import { CATALOG, type CatalogTopic } from './catalog';

/**
 * The system prompt is the ONE thing we want Claude to cache. Everything
 * stable about the routing task lives here — the instructions, the output
 * contract, and the catalog. The user's query goes in a user message and
 * is the only thing that changes per request.
 *
 * Byte-stability matters. The JSON catalog is sorted and stringified
 * deterministically (no Date, no UUID, no Math.random) so the cache prefix
 * is identical across deployments until the catalog itself changes.
 */

const SYSTEM_INSTRUCTIONS = `You are the routing classifier for the City of Colorado Springs civic portal. A resident types a plain-language description of what they need; you map it to the best destination in the catalog below.

Your job is mechanical: pick the topic IDs whose descriptions and synonyms best fit the query. Do not invent destinations. Do not editorialize. If nothing fits well, return an empty primary and a reason explaining that.

Important rules:
- Residents do not know which jurisdiction handles what. Never ask them to pick between city and county. Surface the correct jurisdiction in your output so the UI can badge it — but only after you've picked the topic.
- If the user mentions a 5-digit zip, extract it exactly as written, even if it is not in the Colorado Springs area.
- If the user describes their own home, residential renovation, or a construction project on their own property, prefer "permit-pprbd" over the city's internal permit topics. PPRBD is a regional agency that handles residential building permits in the Pikes Peak region.
- If the user asks for aggregated data, statistics, or "how many" of something, prefer CORA / records topics over report-a-problem topics.
- If the user mentions a neighborhood problem (grass, junk vehicles on property, short-term rental, trash in yard), prefer Neighborhood Services (61750). If the vehicle is abandoned on a City street, prefer 63474 instead.
- Confidence levels:
  - "high" — query clearly names or synonymizes this topic.
  - "medium" — query plausibly fits, but could also fit an alternate.
  - "low" — best guess; always include alternates.
- Provide 0–2 alternates. Only include alternates that are genuinely plausible.
- "reason" is one short sentence addressed to the resident, explaining why this destination fits. Use plain English. Do not use the word "jurisdiction." Do not mention "catalog" or "topic id."
- "reasoning" is a one-sentence private note for developers explaining the classification. Use the word "because." This is for audit, not for display.

Catalog format: each entry is {id, name, group, intent (report/permit/records/contact), jurisdiction (city/county/state/regional/utility/special-district/federal/tribal), destination (form/external/email), description, synonyms}.`;

function serializeCatalog(topics: CatalogTopic[]): string {
  // Sort by id for byte-stability across runs — prevents accidental cache
  // invalidations from reordered data sources.
  const sorted = [...topics].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return JSON.stringify(sorted, null, 0);
}

export const SYSTEM_PROMPT: string = `${SYSTEM_INSTRUCTIONS}

CATALOG (JSON, ${CATALOG.length} entries):
${serializeCatalog(CATALOG)}`;

export const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    primary: {
      anyOf: [
        {
          type: 'object',
          properties: {
            topicId: { type: 'string' },
            reason: { type: 'string' },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          },
          required: ['topicId', 'reason', 'confidence'],
          additionalProperties: false,
        },
        { type: 'null' },
      ],
    },
    alternates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          topicId: { type: 'string' },
          reason: { type: 'string' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
        required: ['topicId', 'reason', 'confidence'],
        additionalProperties: false,
      },
    },
    extractedZip: {
      anyOf: [
        { type: 'string', pattern: '^[0-9]{5}$' },
        { type: 'null' },
      ],
    },
    reasoning: { type: 'string' },
  },
  required: ['primary', 'alternates', 'extractedZip', 'reasoning'],
  additionalProperties: false,
} as const;
