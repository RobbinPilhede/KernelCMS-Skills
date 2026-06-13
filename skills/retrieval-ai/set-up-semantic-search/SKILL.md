---
name: set-up-semantic-search
description: Make your KernelCMS content AI-retrievable — wire a pluggable embedder, mark collections semantic, and query with built-in semantic + hybrid (RRF) search over REST or the Local API. Your CMS becomes your RAG knowledge base.
category: Retrieval & AI
tags: [rag, embeddings, semantic-search, hybrid, vector, ai]
difficulty: intermediate
---

# Set up semantic search

**Use this when** you want your content to be retrievable by meaning, not just keywords — to power a RAG app, an AI assistant grounded in your content, "related content", or smarter site search. KernelCMS indexes content for retrieval natively, on the same typed, access-controlled engine — no separate vector database to stitch in.

This is a human runbook: you wire it up once, then your app (or an agent) queries it.

## Prompt

This skill is operational — follow the runbook.

### 1. Bring an embedder

KernelCMS has no hard embedding dependency — you supply an `embed` function that maps strings to vectors. Use any provider (OpenAI, Cohere, a local model). Source keys from the environment, never hardcode them.

```ts
import { defineConfig, memorySearch } from 'kernelcms'

async function embed(texts: string[]): Promise<number[][]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: texts }),
  })
  const json = await res.json()
  return json.data.map((d: { embedding: number[] }) => d.embedding)
}

export default defineConfig({
  // …secret, db, …
  search: memorySearch(),                 // full-text adapter (powers hybrid's keyword half)
  embeddings: { embed, dimensions: 1536 }, // the pluggable embedder
  // …collections
})
```

The built-in `memoryVector()` store is used automatically when `embeddings` is set — great for a single node. (A pgvector-backed `VectorAdapter` is the documented production follow-up; the interface is ready.)

### 2. Mark the collections you want retrievable

On each collection, list the text fields to index and turn on `semantic`. Those fields are embedded on **every write** — real-time, not a nightly batch (which matters when AI agents read your content).

```ts
{
  slug: 'articles',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'summary', type: 'text' },
    { name: 'body', type: 'richText' },
  ],
  search: { fields: ['title', 'summary'], semantic: true },
}
```

### 3. Query it

**Local API (server code / agents):**

```ts
const byMeaning = await kernel.semanticSearch({ collection: 'articles', query: 'how do I cancel my plan', limit: 5 })
const best = await kernel.hybridSearch({ collection: 'articles', query: 'cancel subscription', limit: 5 })
```

**REST:**

```bash
curl "$BASE/api/articles/semantic?q=how%20do%20I%20cancel%20my%20plan&limit=5"
curl "$BASE/api/articles/hybrid?q=cancel%20subscription&limit=5"
```

- **`semanticSearch`** ranks by vector similarity (meaning). Use it for "find content like this" and RAG retrieval.
- **`hybridSearch`** fuses keyword + vector results with Reciprocal Rank Fusion (RRF) — the 2026-standard retrieval that beats pure-semantic for most site/app search. Prefer it for general search boxes.

### 4. Trust the guarantees

- **Access-checked, always.** Every hit is loaded through the same access-control pipeline as a normal read — a semantic match for a document the caller can't read is dropped, never leaked. Pass `req` (the request principal) so results are scoped to that user.
- **Resilient.** An embedder that throws is logged (never with your text or key) and never breaks a content write — the doc still saves, it's just not vector-indexed until the next successful write.
- **Bounded.** `limit` is clamped (max 100); a `filter` is validated against real columns.

### 5. Wire it into RAG

For a grounded AI answer: `hybridSearch` (or `semanticSearch`) for the top-K passages → pass their content as context to your model → cite the documents. Because KernelCMS also tracks provenance and can sign published content, your retrieved context carries trust metadata for free.

Provide: «the collection(s) to make retrievable, your embedding provider, and whether you're building site search, related-content, or a RAG assistant».
