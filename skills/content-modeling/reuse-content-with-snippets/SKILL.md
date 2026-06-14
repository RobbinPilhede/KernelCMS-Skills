---
name: reuse-content-with-snippets
description: Define a piece of content once in KernelCMS (a CTA, a promo banner, legal text) and reference it from many documents with a snippet field — it transcludes the fragment's live content on read, so editing it once updates everywhere, access-checked.
category: Content modeling
tags: [snippets, reusable, transclusion, dry, content-modeling]
difficulty: starter
---

# Reuse content with snippets

**Use this when** the same block of content appears in many places — a signup CTA across every
landing page, a promo banner on a dozen articles, a legal disclaimer on every product — and you
don't want to copy-paste it (and then hunt down every copy when it changes). Define it once as a
**snippet** and reference it; editing the snippet updates every document that uses it.

This is a configuration runbook.

### 1. Make a snippet library

Mark a collection `snippet: true` — its documents are reusable fragments:

```ts
export default defineConfig({
  collections: [
    {
      slug: 'snippets',
      snippet: true,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'body', type: 'richText' },
      ],
    },
    // … the collections that will reference them …
  ],
})
```

### 2. Reference a snippet

Add a `snippet`-typed field pointing at the library:

```ts
{ slug: 'pages', fields: [
  { name: 'title', type: 'text' },
  { name: 'cta', type: 'snippet', snippet: 'snippets' },               // one fragment
  { name: 'banners', type: 'snippet', snippet: 'snippets', hasMany: true }, // an ordered list
] }
```

A `snippet` field may only point at a `snippet: true` collection — a wrong target is caught at
config load.

### 3. Read it transcluded

The snippet inlines on read when you ask for depth (like a relationship):

```ts
const page = await kernel.findByID({ collection: 'pages', id, depth: 1 })
// page.cta is now the full snippet document: { id, label, body, … }
```

Over REST: `GET /api/pages/:id?depth=1`. With `depth: 0` (the default) the field stays the
fragment's id — fetch the snippet separately, or bump the depth to inline it.

Because it transcludes **live** (it's a reference, not a copy), editing the snippet document is
immediately reflected everywhere it's used:

```ts
await kernel.update({ collection: 'snippets', id: ctaId, data: { body: 'New launch copy' } })
// every page whose `cta` points at ctaId now reads the new copy at depth >= 1
```

### 4. Trust the boundaries

- **Edit once, update everywhere.** A snippet field is a live reference resolved on read — never
  a copy — so there's a single source of truth for the fragment.
- **Access-checked transclusion.** The fragment is inlined through the normal access-checked read:
  a reader who can't read the snippet gets its raw id, never the content (and field-access on the
  fragment still applies). It never leaks a fragment you can't see.
- **Cycle- and depth-safe.** Snippet-referencing-snippet graphs are bounded by the populate depth
  cap (10), so a cycle can't infinite-loop, and population is batched (no N+1).
- **Config-validated.** A `snippet` field must reference a `snippet: true` collection — enforced
  at config load, at any nesting depth.

Provide: «the content fragments you repeat across documents (CTAs, banners, disclaimers), and the
collections that should reference them».
