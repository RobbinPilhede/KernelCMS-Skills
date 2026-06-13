---
name: make-content-ai-discoverable
description: Make your KernelCMS site ingestible and citable by AI answer engines (ChatGPT, Claude, Perplexity, Google AI) — generate llms.txt / llms-full.txt, RAG chunks, and per-document GEO markdown, all published-only.
category: Retrieval & AI
tags: [geo, llms-txt, ai-search, discoverability, citations, rag]
difficulty: intermediate
---

# Make content AI-discoverable

**Use this when** you want AI answer engines to find, ingest, and *cite* your content. People increasingly get answers from ChatGPT/Claude/Perplexity/Google AI instead of clicking links — Generative Engine Optimization (GEO) is SEO for that world, and `llms.txt` is the emerging standard. KernelCMS generates the whole layer from your live, published content.

This is a human runbook: enable it once, then point crawlers (and your own RAG pipeline) at the endpoints.

## Prompt

This skill is operational — follow the runbook.

### 1. Enable discoverability in `kernel.config.ts`

```ts
export default defineConfig({
  // …
  discoverability: {
    title: 'Acme Docs',
    description: 'Everything about the Acme platform.',
    baseUrl: 'https://acme.com',
    collections: [
      { slug: 'articles', titleField: 'title', descriptionField: 'summary', urlPattern: '/blog/:slug' },
      { slug: 'docs', urlPattern: '/docs/:slug' },
    ],
    // optional caps (defaults: 1000 per collection, 5000 total)
    maxDocsPerCollection: 1000,
  },
})
```

Only collections you list (with a public read rule) are exposed. Auth, upload, and system collections are never exposed unless you explicitly set `include: true`.

### 2. Serve the files

The endpoints are public and emit **only published, publicly-readable** content:

```bash
curl https://acme.com/api/llms.txt          # the index (titles + links + summaries)
curl https://acme.com/api/llms-full.txt     # the full corpus as markdown
curl "https://acme.com/api/content-chunks?collection=articles"   # JSON chunks for RAG
curl https://acme.com/api/articles/ID/geo   # one doc as GEO markdown + citation block
```

Crawlers look for `llms.txt` at the **site root**, so proxy it there. Next.js example:

```ts
// next.config.js
async rewrites() {
  return [
    { source: '/llms.txt', destination: 'https://acme.com/api/llms.txt' },
    { source: '/llms-full.txt', destination: 'https://acme.com/api/llms-full.txt' },
  ]
}
```

(Or generate the files at build time from the Local API: `await kernel.llmsTxt()` / `await kernel.llmsFullTxt()` and write them to `public/`.)

### 3. Trust the guarantee

Every generator reads through KernelCMS's access pipeline as an **anonymous principal**, filtered to `_status === 'published'`. Drafts, scheduled-but-unpublished documents, access-restricted collections, and read-denied fields can **never** appear in any output — there's no `overrideAccess` anywhere in this path. So you can turn it on without auditing for accidental exposure.

### 4. Strengthen citations with provenance

If you've enabled content credentials (signing), `geoDocument` and `llms-full.txt` carry a provenance/citation footer — author, last-updated, canonical URL, and a "verified" note when the published content still matches its signature. That's exactly the source/author/update metadata GEO best-practice asks for, so answer engines cite you with confidence.

### 5. Feed your own RAG too

`content-chunks` (or `kernel.contentChunks()`) returns the same corpus as retrieval-ready chunks `{ id, title, url, text, tokensEstimate, provenance }` — drop them straight into a vector store or pair with the built-in [semantic search](#/prompts) for a grounded, citable assistant over your own content.

Provide: «your `baseUrl`, which collections to expose and their URL patterns, and where you'll proxy `llms.txt` (site root)».
