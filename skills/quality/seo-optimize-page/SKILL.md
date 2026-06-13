---
name: seo-optimize-page
description: Run an SEO pass over a KernelCMS page — title, meta description, heading hierarchy, internal links, structured data — and apply scoped draft fixes.
category: Quality
tags: [seo, meta, headings, structured-data, internal-links]
difficulty: intermediate
---

# SEO-optimize a page

**Use this when** a page or post already exists and you want an agent to make it rank and read well in search — tightening the title and meta description, fixing the heading hierarchy, adding internal links, and emitting structured data — by editing the SEO fields and `blocks`/`richText` content as a draft. A human publishes.

## Prompt

> You are a technical SEO editor working in KernelCMS through the access-controlled MCP tools. You write **drafts** only — you cannot publish, and you only touch fields in your scope.
>
> **First, read the model and the document.** Read `kernel://schema` to find the collection's fields — expect `meta_title` (text, ≤70) and `meta_description` (textarea, ≤160) from the SEO plugin, stored as top-level columns under an "SEO" tab, plus the content fields (`blocks`, `richText`, `title`, `slug`). Then `<collection>_get` the target document. Never invent a field; use only what the schema exposes.
>
> **Audit against this checklist** and record each finding as pass / fix / can't-fix-in-scope:
> 1. **Title (`meta_title`)** — 50–60 chars, primary keyword near the front, brand suffix only if it fits, unique across the site, not a duplicate of the H1.
> 2. **Meta description (`meta_description`)** — 140–160 chars, one concrete benefit + an implied action, contains the primary term naturally, no truncation mid-word, no keyword stuffing.
> 3. **Heading hierarchy** — exactly one H1 (usually the hero/title), no skipped levels (H2→H4), headings describe content not styling, keyword in the H1 and at least one H2.
> 4. **Internal links** — at least 2–3 contextual links to related collection docs using real slugs (verify with a `_list`/`_get`); descriptive anchor text, never "click here"; no orphan page.
> 5. **Structured data** — propose the right schema.org type (`Article`, `Product`, `FAQPage`, `BreadcrumbList`) as JSON-LD; only if a field/block exists to hold it, otherwise report it as a recommendation for the developer.
> 6. **Slug** — short, hyphenated, keyword-bearing, stable. Flag (don't silently change) slug edits on published URLs — they break links.
> 7. **Content signals** — first 100 words state what the page is about; the primary term appears in the first paragraph and is not over-repeated.
>
> **Apply scoped fixes.** Rewrite `meta_title`/`meta_description`, fix heading levels in the content blocks, and add internal links via `<collection>_update`. Leave everything a draft. If `meta_title` is blank, note that the SEO plugin will seed it from the title source field — only override when you can do better.
>
> **Report.** List every finding, the before/after for each edit you made, and anything that needs a developer (a missing JSON-LD field, a risky slug change, an orphan that needs a link from elsewhere).
>
> Target: «collection + document id/slug, and the primary keyword/intent».

## Example

**Brief:** "SEO-pass the `posts` doc `migrations-that-dont-scare`. Primary intent: headless CMS migrations."

The agent reads `kernel://schema` and `posts_get`, finds `meta_title` empty and a generic H1, then via `posts_update`:

```diff
- meta_title:       (empty → would seed to "Migrations that don't scare you")
+ meta_title:       "Headless CMS Migrations That Don't Scare You | KernelCMS"   (54 chars)
- meta_description: "Read about how migrations work in our CMS."
+ meta_description: "Diff-based, additive, deterministic schema migrations in KernelCMS. Preview every change before it runs and never lose data by surprise."  (151 chars)
```

In the body blocks it changes the second-level heading from an H4 to an H2 (fixing a skipped level), adds a contextual link `[diff-based migrations](/docs/migrations)` to the docs collection, and recommends an `Article` JSON-LD block to the developer because no field exists to hold it. Saved as a draft for review.

## Notes

- **Tools:** `kernel://schema` for fields; `<collection>_get` to read, `<collection>_update` to write `meta_title`, `meta_description`, and content blocks. See the [MCP guide](https://kernelcms.com/mcp).
- **SEO plugin shape:** `@kernel/plugin-seo` adds `meta_title` (≤70) and `meta_description` (≤160) as **top-level columns** under an "SEO" tab, and can auto-seed them from a source field (`generateTitleFrom`). They're real columns, so they're queryable and the length limits are enforced.
- **Draft-only & scoped.** The agent can only edit fields in its `fieldScope` and can never publish. If SEO fields aren't in scope, it reports the recommended values instead of writing them.
- **Don't break URLs.** Slug changes on a live page are a redirect problem — flag, never auto-apply.
- Pair with **`metadata-and-open-graph`** for social cards and **`internal-linking`** for the site-wide graph.
