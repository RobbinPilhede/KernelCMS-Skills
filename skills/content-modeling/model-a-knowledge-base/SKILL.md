---
name: model-a-knowledge-base
description: Model a help center / knowledge base in KernelCMS — articles, categories, and full-text search — as typed config-as-code with the search adapter wired in.
category: Content modeling
tags: [knowledge-base, help-center, search, articles, categories]
difficulty: intermediate
---

# Model a knowledge base

**Use this when** you want an agent to model a help center or knowledge base in KernelCMS: `articles` organized into `categories`, with real **full-text search** wired through the search adapter so it respects access. The output is a typed `kernel.config.ts` with `search` configured.

## Prompt

> You are modeling a knowledge base in KernelCMS as config-as-code with `defineConfig`. Use only real field types: `text`, `textarea`, `slug`, `number`, `boolean`, `date`, `select`, `richText`, `group`, `array`, `relationship`, `upload`, and the `join`. Relationship fields take `relationTo`, `hasMany`, `onDelete`.
>
> **Model it like this:**
> 1. **`kb_categories`** — `name` (text, required), `slug` (slug, unique), `description` (textarea), `icon` (select or text), `order` (number, integer, index) with `admin.defaultSort: 'order'` for a curated category list. A `join` named `articles` (`on: 'category'`) lists members.
> 2. **`articles`** — `title` (text, required), `slug` (slug, unique, index), `summary` (textarea — also the search snippet and meta description source), `body` (richText, full), `category` (relationship → kb_categories, `onDelete: 'setNull'`), `keywords` (select hasMany or text array — extra search terms / synonyms), `helpful_count` (number — feedback signal), `updated_at` (automatic via timestamps).
> 3. **Search — the defining feature.** Add a search adapter at the config root (`search: memorySearch()` for dev; a real adapter in prod) and mark `articles` searchable: `search: { fields: ['title', 'summary', 'body', 'keywords'] }`. Then query with `kernel.searchDocs({ collection: 'articles', query })`. **Search results are loaded through the access-checked read path**, so search never surfaces an article the caller can't read — internal/draft articles stay hidden automatically.
> 4. **Drafts.** Give `articles` `versions: { drafts: true }` so an article is staged before going live. **Draft-hiding is automatic:** on a drafts collection the read path returns published documents only unless the caller explicitly passes `draft: true` (a privileged, authenticated path) — you do *not* hand-roll a `{ _status: { equals: 'published' } }` filter to keep drafts out of public reads. Use `access.read` for *who/what kind* of content a caller may see, not for the draft/published split.
> 5. **Internal vs. public articles.** This is the access concern (orthogonal to drafts). If some articles are staff-only, add an `audience` select (`public` | `internal`) and a row-level `access.read` that returns a `Where` filtering internal ones out for anonymous users. Because search runs through the same read path, internal articles never leak through search — and neither do drafts.
>
> **Admin.** `useAsTitle: 'title'`, `defaultColumns`, `defaultSort: '-updated_at'`. Consider `cache: true` on read-heavy public collections (requires `config.cache`).
>
> Output the config, then justify: the category+order model, the searchable field set, why search inherits access, and the public/internal handling.

## Example

**Brief:** "A help center: categorized articles, fast search, a feedback 'was this helpful' count, and some internal-only runbooks that must never show up in public search."

The agent emits (excerpt):

```ts
import { defineConfig } from 'kernelcms'
import { sqliteAdapter } from 'kernelcms/sqlite'
import { memorySearch } from 'kernelcms'

const isStaff = (req) => Boolean(req.user?.roles?.includes('staff') || req.user?.roles?.includes('admin'))

export default defineConfig({
  secret: process.env.KERNEL_SECRET ?? 'dev-only-secret',
  db: sqliteAdapter({ url: 'file:./content.db' }),
  search: memorySearch(), // swap for a production adapter when scaling
  collections: [
    {
      slug: 'kb_categories',
      labels: { singular: 'Category', plural: 'Categories' },
      admin: { useAsTitle: 'name', defaultSort: 'order' },
      access: { read: () => true },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'slug', type: 'slug', required: true, unique: true },
        { name: 'description', type: 'textarea' },
        { name: 'order', type: 'number', integer: true, index: true, defaultValue: 0 },
        { type: 'join', name: 'articles', collection: 'articles', on: 'category', limit: 200 },
      ],
    },
    {
      slug: 'articles',
      versions: { drafts: true },
      cache: true, // read-through cache (requires config.cache); invalidated on write
      search: { fields: ['title', 'summary', 'body', 'keywords'] },
      admin: { useAsTitle: 'title', defaultColumns: ['title', 'category', 'updatedAt'], defaultSort: '-updatedAt' },
      access: {
        // Public sees only PUBLIC articles; staff see everything. (Drafts are already
        // hidden from non-`draft` reads by the drafts read path — this Where is purely
        // the public/internal split.) Search inherits this rule.
        read: ({ req }) => (isStaff(req) ? true : { audience: { equals: 'public' } }),
        update: ({ req }) => Boolean(req.user),
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'slug', type: 'slug', required: true, unique: true, index: true },
        { name: 'summary', type: 'textarea', maxLength: 280 },
        { name: 'body', type: 'richText', preset: 'full' },
        { name: 'category', type: 'relationship', relationTo: 'kb_categories', onDelete: 'setNull' },
        { name: 'keywords', type: 'select', hasMany: true,
          options: ['billing', 'account', 'api', 'security', 'getting-started'] },
        { name: 'audience', type: 'select', options: ['public', 'internal'], defaultValue: 'public', index: true },
        { name: 'helpful_count', type: 'number', integer: true, min: 0, defaultValue: 0 },
      ],
    },
  ],
})
```

Querying search (results are access-checked, so a public caller never gets an internal runbook):

```ts
const { docs } = await kernel.searchDocs({
  collection: 'articles',
  query: 'reset my password',
  req: { user: null }, // anonymous → public articles only
  limit: 10,
})
```

**Rationale (abridged):** Categories carry an indexed `order` + `defaultSort: 'order'` for a curated, deterministic list. `articles.search.fields` indexes title/summary/body/keywords — `keywords` lets editors add synonyms the prose doesn't contain. The killer property: `searchDocs` loads hits through the normal access-checked read path, and `access.read` returns a `Where` scoping anonymous callers to `audience: 'public'` — so internal runbooks are excluded from search *for free*, no separate search-ACL to maintain. Drafts stage articles; `cache: true` makes the read-heavy public surface fast and self-invalidates on write.

## Notes

- **Search is access-checked.** `kernel.searchDocs` runs hits through the same read path — it can never surface a document the caller can't read. That's why internal/draft articles stay out of public search with zero extra wiring.
- **Wire two things:** a root `search:` adapter (`memorySearch()` in dev — imported from `kernelcms`) **and** `search: { fields: [...] }` on the collection. One without the other does nothing.
- **`keywords`** (select hasMany or text array) adds searchable synonyms beyond the body text.
- **Drafts hide themselves.** `versions: { drafts: true }` makes the read path published-only unless a caller passes `draft: true` — so anonymous readers never see drafts without any `access.read` rule. Reserve the `access.read` `Where` for the public/internal split, a separate concern.
- **`cache: true`** needs `config.cache` (e.g. `memoryCache()`, also exported from `kernelcms`); it serves reads read-through and invalidates on any write. Run `kernel generate:types` when done.
