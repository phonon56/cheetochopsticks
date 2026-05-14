// System prompt for the plain-language router.
//
// Calls Cloudflare Workers AI (Llama 3.3 70B Instruct), not Claude. Llama
// follows instructions less precisely than Claude did, so the prompt is
// slightly more directive about the JSON output shape, and the worker
// validates + repairs the response before returning to the client.
//
// The catalog is serialized deterministically (sorted by id, no whitespace)
// so the system prompt is byte-stable across requests. Workers AI doesn't
// have an Anthropic-style explicit prompt cache, but a stable prefix still
// helps any future provider-level caching and keeps the prompt diff-friendly.

import { CATALOG } from './catalog.js';

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

OUTPUT FORMAT — return a single JSON object, nothing else. No prose before or after. No markdown fences. No code blocks. The object must have exactly these keys:
{
  "primary": { "topicId": "<id from catalog>", "reason": "<one sentence to the resident>", "confidence": "high"|"medium"|"low" } OR null,
  "alternates": [ up to 2 objects with the same shape as primary ],
  "extractedZip": "<5-digit zip from the user's text, exactly as written>" OR null,
  "reasoning": "<one private developer-facing sentence beginning with 'because'>"
}

If nothing in the catalog fits, set "primary": null, "alternates": [], and put the explanation in "reason" of a null primary is not possible — instead, return the closest-but-poor match with confidence "low" and explain in "reasoning" that it is a low-confidence guess.

Catalog format: each entry is {id, name, group, intent (report/permit/records/contact), jurisdiction (city/county/state/regional/utility/special-district/federal/tribal), destination (form/external/email), description, synonyms}.`;

function serializeCatalog(topics) {
  // Sort by id for byte-stability — prevents accidental cache misses
  // from reordered source data.
  const sorted = [...topics].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return JSON.stringify(sorted, null, 0);
}

export const SYSTEM_PROMPT = `${SYSTEM_INSTRUCTIONS}

CATALOG (JSON, ${CATALOG.length} entries):
${serializeCatalog(CATALOG)}`;

// JSON Schema for response_format. Workers AI's structured-output mode
// will enforce this on supported models; if the model returns invalid
// JSON anyway, the worker parses defensively and falls back to keyword.
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
};
