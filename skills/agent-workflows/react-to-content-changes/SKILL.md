---
name: react-to-content-changes
description: Subscribe to the KernelCMS real-time change feed so an agent, a live UI, or a downstream system reacts the instant content changes — via the durable pull feed, the SSE stream, or in-process subscribe, all access-filtered.
category: Agent workflows
tags: [realtime, change-feed, sse, cdc, reactive, subscribe]
difficulty: intermediate
---

# React to content changes

**Use this when** you want something to happen *the moment* content changes — re-index a vector store, refresh a cache, notify an agent, update a live dashboard, or sync a downstream system. KernelCMS emits a durable, access-filtered change feed you can pull, stream, or subscribe to in-process.

This is a wiring runbook.

## Prompt

This skill is operational — follow the runbook.

### 1. Turn it on

```ts
export default defineConfig({
  // …
  realtime: { enabled: true },   // retain? caps the durable outbox (default 10000)
})
```

### 2. Pick how you consume it

**A. Durable pull (CDC / reliable catch-up).** Poll from a cursor — survives downtime, never misses events.

```ts
let cursor = 0
setInterval(async () => {
  const { changes, cursor: next } = await kernel.changes({ since: cursor })
  for (const e of changes) {
    // e = { seq, at, collection, documentId, event, principalType } — metadata only
    // re-fetch the doc through the normal access-checked API if you need its content:
    const doc = await kernel.findByID({ collection: e.collection, id: e.documentId })
    /* react: re-index, notify, sync… */
  }
  cursor = next
}, 1000)
```

Over REST: `GET /api/changes?since=<cursor>&collection=articles` (auth required).

**B. Live SSE (reactive UI).** Wire a browser straight to the stream — no polling.

```ts
const es = new EventSource('/api/changes/stream?collection=articles', { withCredentials: true })
es.onmessage = (m) => {
  const e = JSON.parse(m.data) // { seq, collection, documentId, event, … }
  // refetch + update the UI
}
// Reconnects resume from the last seq via Last-Event-ID automatically.
```

**C. In-process (server code / workflows).**

```ts
const stop = kernel.subscribe((e) => {
  if (e.collection === 'articles') void reindex(e.documentId)
})
// later: stop()
```

### 3. Common reactions

- **Live RAG re-index:** on a change, re-embed the doc (semantic search already does this on write — use the feed for *external* indexes).
- **Agent triggers:** pair with [agentic workflows](#/prompts) — a change kicks off a draft/translate/summarize pipeline.
- **Cache busting / CDN purge, search sync, analytics, audit mirrors.**

### 4. Trust the boundaries

Events are **metadata only** — never document bodies — and **access-filtered per subscriber**: you are never told that a document you can't read changed (the event is dropped, fail-closed). So a stream scoped to a low-privilege principal is safe to expose. Both HTTP endpoints require auth; retention and concurrent streams are bounded; a feed hiccup can never break the content write that triggered it.

Provide: «what should react (re-index / notify / sync / live UI), which collections, and whether you want pull, SSE, or in-process».
