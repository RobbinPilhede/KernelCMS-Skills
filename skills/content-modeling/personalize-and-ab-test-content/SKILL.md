---
name: personalize-and-ab-test-content
description: Serve audience-targeted content variants and run A/B experiments in KernelCMS — mark fields personalized, write per-segment variants, and bucket visitors deterministically, all access-checked and PII-free.
category: Content modeling
tags: [personalization, ab-testing, experiments, audiences, variants]
difficulty: intermediate
---

# Personalize and A/B test content

**Use this when** you want content that adapts to who's asking — a different hero for VIPs, a beta banner for early-access users — or you want to A/B test a headline. KernelCMS does it like localization, but keyed by audience instead of locale: same typed model, no separate personalization platform.

This is a configuration + usage runbook.

## Prompt

This skill is operational — follow the runbook.

### 1. Declare your audiences and personalize fields

```ts
export default defineConfig({
  audiences: { segments: ['default', 'vip', 'beta'], default: 'default' },
  collections: [
    {
      slug: 'pages',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'hero_headline', type: 'text', personalized: true }, // one variant per segment
      ],
    },
  ],
})
```

A `personalized` field stores `{ [segment]: value }` — exactly like a `localized` field stores per-locale values. (A field can be `localized` **or** `personalized`, not both.)

### 2. Write and read variants

Target a segment with `?audience=` (or `req.audience`). Writing one segment **merges** — it never clobbers the others.

```bash
# default variant
curl -XPOST $BASE/api/pages -H "$AUTH" -d '{"title":"Home","hero_headline":"Welcome"}'
# vip variant of the same field
curl -XPATCH "$BASE/api/pages/ID?audience=vip" -H "$AUTH" -d '{"hero_headline":"Welcome back, VIP"}'

# reads resolve to the audience (unknown audience → default segment)
curl "$BASE/api/pages/ID?audience=vip"      # → "Welcome back, VIP"
curl "$BASE/api/pages/ID?audience=default"  # → "Welcome"
```

### 3. Run an A/B experiment

```ts
experiments: [{ slug: 'hero', variants: ['default', 'vip'], weights: [50, 50] }]
```

Bucket each visitor deterministically by a stable key (a session id, a logged-in user id):

```ts
const { variant } = await kernel.assignVariant({ experiment: 'hero', key: visitorId })
// same visitorId → same variant, always; distribution matches weights.
```

The `variant` **is a segment** — set it as the request audience (`?audience=${variant}`) and the visitor sees that variant's personalized content. Over REST: `GET /api/_experiments/hero/assign?key=<visitorId>`. Only a hash of the key is ever stored — no raw visitor id, no PII.

### 4. Let an agent author the variants

Pair this with [agentic workflows](#/prompts): an agent can draft a `vip` or `beta` variant of a field (scoped + draft-only), a human approves it, and it goes live for that audience only.

### 5. Trust the boundaries

A personalized field still passes field-level read access (a read-denied variant is stripped for every audience). An untrusted `?audience=` is honored only if it's a configured segment (unknown → default), segment keys are guarded against prototype pollution, and per-segment writes never lose other segments.

Provide: «the audiences/segments, which fields vary by audience, and any A/B experiments (variants + weights)».
