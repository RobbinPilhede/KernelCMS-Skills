---
name: internal-linking
description: Build a sane internal link graph across KernelCMS content — connect related docs, fix orphans, use real slugs and descriptive anchors — as draft edits.
category: Quality
tags: [internal-links, seo, site-structure, anchors, orphans]
difficulty: intermediate
---

# Internal linking

**Use this when** your content exists but doesn't link to itself well — orphan pages, dead-end posts, vague "click here" anchors — and you want an agent to weave a deliberate internal link graph across collections: relevant, reciprocal where it makes sense, with descriptive anchor text and verified slugs. Drafts only.

## Prompt

> You are an information architect building KernelCMS's internal link graph through the access-controlled MCP tools. You write **drafts** only and touch only fields in your scope. **You only link to documents you've verified exist** — never to a guessed slug.
>
> **First, build the inventory.** Read `kernel://schema` for the linkable collections (`posts`, `pages`, `docs`, …) and their `slug` and `richText`/`blocks` fields. Then `<collection>_list` each to build a map of `{ slug, title, topic }`. This is your source of truth for valid link targets.
>
> **Then analyze the graph** for the target document(s):
> 1. **Orphans** — a doc no other doc links to. Find 2–3 thematically related docs and add contextual links *to* it from them.
> 2. **Dead ends** — a doc that links out to nothing. Add 2–4 relevant outbound links to related docs.
> 3. **Relevance** — link only where the destination genuinely helps the reader at that point; no link farms, no forcing.
> 4. **Anchor text** — descriptive and keyword-bearing ("diff-based migrations"), never "click here" / "this page" / a bare URL; vary anchors that point to the same target.
> 5. **Slug validity** — every `href` resolves to a real slug from the inventory; flag any link to a missing or draft-only target.
> 6. **Hub & cluster** — pillar/overview docs link down to their cluster, and cluster docs link back up to the pillar.
> 7. **Density** — a few high-value contextual links beat many. Don't over-link the same destination repeatedly in one doc.
> 8. **No self-links / no broken anchors** — within the same doc, use section anchors, not the page's own URL.
>
> **Apply** by editing the `richText`/`blocks` body via `<collection>_update`, inserting links inline where the text already mentions the concept (preferred) rather than bolting on a "Related" list — though a related-links block is fine if the schema has one. Drafts only.
>
> **Report.** A small before/after link map (which docs now link to which), the orphans you resolved, and any link you couldn't make because the target doesn't exist (with a suggestion to create it).
>
> Target: «the document(s) or "the whole `posts` collection"».

## Example

**Brief:** "Internal-link the `posts` collection; `lean-by-default` is a new post nobody links to."

The agent `posts_list`s the collection, builds the topic map, and finds `lean-by-default` is an orphan while `kernelcms-vs-payload` and `migrations-that-dont-scare` both discuss dependency weight in passing. Via `posts_update` on those two:

```diff
kernelcms-vs-payload body:
  "...a lighter dependency tree..."
+ → "...a [lighter dependency tree](/blog/lean-by-default)..."

migrations-that-dont-scare body:
  "...the SQLite default..."
+ → "...the [zero-dependency SQLite default](/blog/lean-by-default)..."
```

And on `lean-by-default` itself it adds an outbound link to `/docs/installation` where the post mentions setup. It reports the orphan resolved (now 2 inbound links), one dead end fixed, and flags that the post references a "benchmarks" page that doesn't exist yet. Saved as drafts.

## Notes

- **Tools:** `kernel://schema`; `<collection>_list` to inventory valid slugs; `<collection>_get` / `<collection>_update` to edit bodies. See the [MCP guide](https://kernelcms.com/mcp).
- **Verify before you link.** The inventory built from `_list` is the allowlist of targets — a link to anything not in it is a flag, not a write. This is the guardrail against fabricated URLs.
- **Inline contextual links beat appended lists.** Link the concept where it's already named in the prose.
- **Draft-only & scoped.** No publishing; in-scope fields only. A link to a target that's still a draft is flagged (it won't resolve publicly).
- Pair with **`seo-optimize-page`** (per-page links) and **`readability-pass`** (so added links don't disrupt flow).
