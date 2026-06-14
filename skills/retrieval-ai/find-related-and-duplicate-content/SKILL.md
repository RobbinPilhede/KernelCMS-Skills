---
name: find-related-and-duplicate-content
description: Use KernelCMS content intelligence to power "related content" recommendations and to find near-duplicate / redundant content for a quality cleanup — straight from the embeddings you index for search, access-checked.
category: Retrieval & AI
tags: [related-content, duplicates, embeddings, content-quality, recommendations]
difficulty: intermediate
---

# Find related and duplicate content

**Use this when** you want "related articles" / "more like this" rails, or you want to clean up a content library — find accidental re-publishes, overlapping pages to merge, and stale duplicates. KernelCMS does both from the vectors it already indexes for semantic search.

This is a usage runbook (requires `embeddings` configured — see *set-up-semantic-search*).

## Prompt

This skill is operational — follow the runbook.

### 1. "More like this"

```ts
const { docs } = await kernel.relatedContent({ collection: 'articles', id, limit: 5 })
```

Returns the documents most semantically similar to the seed (re-embedded from its current content, excluding itself), access-checked. Drop them into a "Related" rail or internal-linking suggestions. Over REST: `GET /api/articles/ID/related?limit=5`.

### 2. Find near-duplicates

```ts
const { pairs } = await kernel.findDuplicates({ collection: 'articles', threshold: 0.9 })
// pairs: [{ a, b, score }, …] — documents whose embeddings are near-identical
```

Tune `threshold` (cosine, default 0.9): higher = only very close matches. Use it to:
- catch accidental re-publishes / copy-paste duplicates,
- find overlapping pages to consolidate (better for SEO and for AI retrieval — fewer redundant chunks),
- spot stale content that duplicates newer pages.

Over REST (admin/editor): `GET /api/_admin/duplicates?collection=articles&threshold=0.92`.

### 3. Act on the pairs

For each `{ a, b, score }`: open both, decide keep/merge/redirect. High-score pairs (0.97+) are usually true duplicates; mid-range (0.9–0.95) are overlapping topics worth a human look. Pair it with [the time-machine](#/prompts) to see which came first, and [releases](#/prompts) to publish the consolidation atomically.

### 4. Trust the boundaries

Every result is access-checked: a related document you can't read is dropped, and a duplicate pair is returned **only** when you can read both documents — so dedup never reveals the id or existence of hidden content. The scan is bounded (it's an admin operation), the threshold is clamped to `[0,1]`, and the embedding provider's key/text never leaks.

Provide: «whether you want related-content rails, a duplicate cleanup, or both — and the collection(s) and similarity threshold».
