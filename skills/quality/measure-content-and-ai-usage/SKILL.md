---
name: measure-content-and-ai-usage
description: Track content engagement and — uniquely — how AI answer engines retrieve your content in KernelCMS, then read privacy-first aggregate insights. No third-party tracker, no PII.
category: Quality
tags: [analytics, insights, ai-usage, ab-testing, privacy, observability]
difficulty: intermediate
---

# Measure content and AI usage

**Use this when** you want to know what content performs — and the new question that matters in the AI era: *which of your content do AI/RAG features and answer engines actually retrieve and cite?* KernelCMS captures both, from the same model, with no third-party tracker and no PII.

This is a wiring + querying runbook.

## Prompt

This skill is operational — follow the runbook.

### 1. Turn it on

```ts
export default defineConfig({
  analytics: { enabled: true, autoCapture: true }, // autoCapture is opt-in
})
```

`autoCapture` makes every semantic/hybrid/graph search emit an `ai_retrieval` event for the documents it returned, and every A/B assignment emit a `variant_impression` — automatically, with zero added latency. That's your "how AI uses my content" signal.

### 2. Track your own events

```ts
await kernel.track({ type: 'view', collection: 'articles', documentId: id })
await kernel.track({ type: 'search', query: 'pricing' })
await kernel.track({ type: 'conversion', experiment: 'hero', variant: 'vip', value: 1 })
```

Types: `view`, `search`, `ai_retrieval`, `citation`, `variant_impression`, `conversion`, `custom`. Over REST: `POST /api/_analytics/track`. `track` never throws into your code. **Don't put PII in `meta`** — it's stripped, but `meta` is for non-PII dimensions (`source`, `locale`, `placement`) only.

### 3. Read the insights

```ts
await kernel.insights({ metric: 'top_content', type: 'view' })           // most-viewed docs
await kernel.insights({ metric: 'top_queries' })                          // what people search
await kernel.insights({ metric: 'ai_retrieval_leaderboard' })            // what AI retrieves most ★
await kernel.insights({ metric: 'variant_performance' })                 // A/B impressions + conversion rate
await kernel.insights({ metric: 'activity', from, to })                  // volume over time
```

Over REST (admin/editor): `GET /api/_admin/insights?metric=ai_retrieval_leaderboard`.

### 4. Act on it

- **`ai_retrieval_leaderboard`** tells you which content your RAG assistant and answer-engine integrations lean on — double down on it, and notice gaps where AI *should* be finding content but isn't.
- **`variant_performance`** closes the A/B loop (track a `conversion` per goal, read the rate).
- **`top_queries`** surfaces demand your content doesn't yet answer.

### 5. Trust the privacy model

There is no user/IP/visitor/email/token column — the event row physically can't hold PII; the authenticated principal is never recorded; `meta` is stripped of PII-ish and unsafe keys. `track` can only ever write the analytics table. Insights are aggregates only, filtered to collections you can read (a hidden collection's counts never leak), with bounded retention. No third-party analytics, nothing to GDPR-audit.

Provide: «what to measure (engagement / AI retrieval / A/B), which collections, and whether to auto-capture AI retrievals».
