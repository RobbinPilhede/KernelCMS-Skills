---
name: add-schema-org-jsonld
description: Emit schema.org JSON-LD from your KernelCMS model so search engines and AI answer engines understand your content — map collections to schema.org types, embed the markup, all access-checked and XSS-safe.
category: Retrieval & AI
tags: [json-ld, schema-org, seo, geo, structured-data, rich-results]
difficulty: starter
---

# Add schema.org JSON-LD

**Use this when** you want Google rich results — and AI answer engines — to *understand* your content, not just read it. Structured data spells out "this is an Article by this Person, published on this date" in a machine format. KernelCMS generates valid schema.org JSON-LD straight from your typed model.

This is a configuration + embedding runbook.

## Prompt

This skill is operational — follow the runbook.

### 1. Map collections to schema.org types

```ts
export default defineConfig({
  // …
  structuredData: {
    baseUrl: 'https://acme.com',
    collections: [
      { slug: 'articles', type: 'Article', urlPattern: '/blog/:slug' },
      { slug: 'products', type: 'Product', urlPattern: '/shop/:slug' },
      { slug: 'authors', type: 'Person' },
    ],
  },
})
```

With no explicit `mapping`, **smart defaults** do the work: your title → `name`/`headline`, rich-text body → `articleBody` (+ a `description`), publish/updated dates → `datePublished`/`dateModified`, an author relationship → `author`, an image field → `image`. Override any property:

```ts
{ slug: 'products', type: 'Product', mapping: { name: 'product_name', description: 'tagline', image: 'hero' } }
```

### 2. Embed it in your pages

```ts
const script = await kernel.jsonLdScript({ collection: 'articles', id })
// → '<script type="application/ld+json">{ "@context": "https://schema.org", "@type": "Article", … }</script>'
```

Drop `script` into your page `<head>`. (It's HTML-escaped, so content can't break out of the tag.) Or fetch the raw object: `kernel.jsonLd({ collection, id })`. Over REST: `GET /api/articles/ID/jsonld` returns `application/ld+json`.

### 3. Validate

Paste a rendered page (or the `/jsonld` output) into Google's [Rich Results Test](https://search.google.com/test/rich-results) or the [schema.org validator](https://validator.schema.org/). Fix field mappings until the type validates with the properties you want surfaced.

### 4. Trust the boundaries

Generation runs through the same access-checked read as any public request: a **draft, private, or read-denied** document or field is never emitted — anonymous callers get only published, publicly-readable content. The `<script>` embedding is XSS-safe (content can't escape the tag), and `@id`/`image` URLs are injection-safe.

### 5. Pair it with the rest of the discoverability stack

Structured data completes the trio with [semantic search](#/prompts) (your content as a RAG knowledge base) and [llms.txt / GEO](#/prompts) (citable by AI answer engines). Together they make your content fully machine-understandable for both classic search and the AI-answer era.

Provide: «the collections to expose, the schema.org type for each, and any non-default field mappings».
