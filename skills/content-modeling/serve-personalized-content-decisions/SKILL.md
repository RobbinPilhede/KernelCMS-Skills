---
name: serve-personalized-content-decisions
description: Serve the right published content per visitor in KernelCMS — define a decision slot that picks the best audience-targeted document with a sticky per-viewer choice, published-only and access-checked, in one request.
category: Content modeling
tags: [decisions, personalization, delivery, audiences, sticky, published-only]
difficulty: intermediate
---

# Serve personalized content decisions

**Use this when** a slot on your site needs ONE piece of content chosen at request time — the hero promo for this viewer, the banner for their segment, the "featured" card — and you want the CMS to pick it: audience-targeted, highest-priority, the same choice every time that viewer returns. A content **decision** composes your published content + audiences into a single delivery call, so the frontend (or an agent) asks "what should I show here?" and gets an access-checked answer.

This is a configuration + usage runbook. Pairs with [personalize-and-ab-test-content](#/prompts) (which authors the per-segment variants a decision picks between).

## Prompt

This skill is operational — follow the runbook.

### 1. Declare the decision slot

```ts
export default defineConfig({
  audiences: { segments: ['default', 'vip'], default: 'default' }, // needed only if you use audienceField
  collections: [
    {
      slug: 'promos',
      access: { read: () => true }, // decisions are PUBLIC, published-only — the read rule still applies
      versions: { drafts: true },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'segment', type: 'select', options: ['default', 'vip'] }, // the audience a promo targets
        { name: 'priority', type: 'number' },
      ],
    },
  ],
  decisions: [
    {
      slug: 'hero_promo',        // addressed at GET /api/_decide/hero_promo
      collection: 'promos',
      sort: '-priority',         // consider highest-priority candidates first
      audienceField: 'segment',  // narrow to candidates targeting the caller's segment
      fallback: 'default',       // no segment match → fall back to default-segment promos ('any' | 'none' also valid)
      // where: { active: { equals: true } },  // optional candidate filter
    },
  ],
})
```

### 2. Ask for a decision

```bash
# audience selects the segment; viewer makes the pick STICKY for that visitor
curl "$BASE/api/_decide/hero_promo?audience=vip&viewer=visitor-123"
```

```ts
// Local API
const decision = await kernel.decide({ slug: 'hero_promo', viewerKey: visitorId, req })
// → { slug, collection, audience, candidateIds, chosenId, reason, document } | null
```

`reason` tells you how it was picked: `audience-match`, `audience-fallback`, `single`, or `rotation`. `document` is the chosen, fully access-checked doc. A `null` (unknown slug / no candidate) is a `404` over REST.

### 3. How the pick works

1. **Load** the published, access-checked candidates from `collection` (your `where`/`sort`, top 100).
2. **Narrow** to candidates whose `audienceField` targets the caller's segment; if none, apply `fallback`.
3. **Pick one, stickily** — a deterministic hash of `slug:viewer` selects the same document for the same viewer every time, while traffic spreads across candidates. Pair it with `kernel.assignVariant(...)` to feed an A/B variant in as the `?audience=`.

### 4. Trust the boundaries

- **Published-only + access-checked.** Candidates load through the normal read path — a decision can **never** surface a draft, a private document, or a field the caller can't read. A non-public collection simply yields no decision.
- **Sticky, no PII.** Only the **hash** of `viewer` is used — the raw key is never stored. The same viewer is sticky; the impression is auto-captured as a `variant_impression` (no principal, no raw key) when analytics auto-capture is on.
- **Audience-safe.** An unknown or hostile `?audience=` collapses to the default segment (segment keys are guarded against prototype pollution).
- **Per-viewer.** The response is personalized, so it's sent `cache-control: private, no-store` — never shared-cached.

Provide: «the slot(s) you need to fill, the collection + how a candidate declares its audience, the sort/priority, and the fallback when a segment has no match».
