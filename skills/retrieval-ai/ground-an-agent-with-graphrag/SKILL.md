---
name: ground-an-agent-with-graphrag
description: Ground an AI agent on a connected subgraph of your KernelCMS content using GraphRAG — semantic search finds seed documents, the typed relationship graph expands them into context, all access-checked and bounded.
category: Retrieval & AI
tags: [graphrag, knowledge-graph, rag, retrieval, relationships, context]
difficulty: advanced
---

# Ground an agent with GraphRAG

**Use this when** flat RAG isn't enough — when an answer needs not just the matching document but the things it's *connected to* (an article and its author, its category, the related pieces). GraphRAG retrieves a connected subgraph. KernelCMS builds it from your typed relationships, no separate graph database.

This is a retrieval runbook — you assemble the context; your model writes the answer.

## Prompt

This skill is operational — follow the runbook.

### 1. Have relationships + embeddings

GraphRAG needs two things you already model: **relationships** between collections (the edges) and **semantic search** (to find seeds). Enable `embeddings` and mark the seed collection `search: { fields, semantic: true }` (see the *set-up-semantic-search* skill).

### 2. Walk the graph around a document

```ts
const { nodes, edges } = await kernel.graph({ collection: 'articles', id, depth: 2 })
// nodes: [{ ref:'articles:ID', collection, id, label }, …]
// edges: [{ from, to, field, relationTo, kind:'relationship'|'reverse' }, …]
```

`graph` walks **outbound** relationship fields and **inbound** reverse-relationships (a `join` field), up to `depth` hops — so from an author you reach their posts, and from a post you reach its categories. Over REST: `GET /api/articles/ID/graph?depth=2`.

### 3. Retrieve connected context for a question (GraphRAG)

```ts
const { seeds, nodes, edges, context } = await kernel.graphSearch({
  collection: 'articles',
  query: 'how does our billing handle proration',
  depth: 1,
})
// context: [{ ref, label, text }, …]  ← ground your model on this
```

`graphSearch` semantic-searches for the best **seed** documents, then expands each through the graph to pull in their connected neighbors, returning a `context` array (label + text per reachable node). Over REST: `GET /api/graph-search?q=…&collection=articles`.

### 4. Hand the context to your model

```ts
const grounding = context.map((c) => `## ${c.label}\n${c.text}`).join('\n\n')
// → your LLM call: "Answer using ONLY this context: …" + cite by label/ref
```

GraphRAG typically beats flat RAG when relationships carry meaning (org charts, product catalogs, docs with cross-references) — the connected context fills gaps a single chunk would miss.

### 5. Trust the boundaries

Every node loads through KernelCMS's access control: a document the requester can't read is dropped **and the edge to it is omitted** — the graph never even reveals a hidden document is connected, and read-denied fields never appear in labels or context. Depth (max 10), node count (cap 500), per-node fan-out, and cycles are all bounded, so a hub or a deep graph can't blow up. It's the **retrieval** half — the generation is yours.

Provide: «the seed collection + the question, how deep to expand, and which relationships carry the meaningful context».
