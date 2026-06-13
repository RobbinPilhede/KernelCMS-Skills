---
name: metadata-and-open-graph
description: Complete a KernelCMS page's metadata — title, description, Open Graph and Twitter cards, canonical — so it previews and shares correctly. Draft edits.
category: Quality
tags: [metadata, open-graph, twitter-cards, canonical, social]
difficulty: intermediate
---

# Metadata and Open Graph

**Use this when** a page needs its sharing and search metadata finished — a clean title and description, an Open Graph image and text, Twitter card type, and a canonical URL — so it renders correctly in Google, Slack, X, and link unfurls. The agent fills the fields it has and reports what the schema is missing. Drafts only.

## Prompt

> You are an editor finishing the metadata of a KernelCMS page through the access-controlled MCP tools. You write **drafts** only and touch only fields in your scope.
>
> **First, map what fields exist.** Read `kernel://schema` for the collection. The SEO plugin provides `meta_title` and `meta_description`; a project may add `og_title`, `og_description`, `og_image` (an upload), `twitter_card`, `canonical_url`, or a `seo` group. **Only write fields that exist.** For anything missing, you produce the recommended value as output and tell the developer to add the field.
>
> **Then `<collection>_get` the document** and fill metadata against this checklist:
> 1. **`meta_title`** — 50–60 chars, unique, primary term first, brand suffix if it fits (≤70 hard cap).
> 2. **`meta_description`** — 140–160 chars, one benefit + implied action; this is also the OG/Twitter description fallback.
> 3. **`og_title`** — defaults to `meta_title`; set a punchier social variant only if it reads better in an unfurl. ≤60 chars.
> 4. **`og_description`** — defaults to `meta_description`; can be a touch more conversational. ≤160–200 chars.
> 5. **`og_image`** — a 1200×630 (1.91:1) image with `alt`; not the favicon, not a tiny logo; readable at thumbnail size. Repoint to an `imageSizes` variant of the right ratio if one exists. Recommend creating one if not.
> 6. **`twitter_card`** — `summary_large_image` for content with a strong image, `summary` otherwise; ensure the image satisfies the card's min dimensions.
> 7. **`canonical_url`** — set to the page's own absolute URL; for duplicated/syndicated/paginated content, point at the canonical original. Flag any cross-domain canonical for human confirmation.
> 8. **Locale & type** — if fields exist, set `og:locale` and `og:type` (`website` vs `article`).
>
> **Apply** via `<collection>_update`, as drafts.
>
> **Report.** Show the resolved metadata as it will appear in a Google snippet and a social unfurl (title / description / image), list fields you wrote vs fields the schema is missing (with recommended values and the field definition to add), and flag any canonical decision needing a human.
>
> Target: «collection + document id/slug, and the canonical URL pattern».

## Example

**Brief:** "Finish metadata for the `posts` doc `kernelcms-vs-payload`. URLs are `https://kernelcms.com/blog/<slug>`."

The agent reads `kernel://schema`, finds `meta_title`, `meta_description`, `og_image`, and `canonical_url` exist but no `twitter_card`. Via `posts_update`:

```diff
+ meta_title:       "KernelCMS vs Payload: TypeScript CMS Comparison (2026)"   (54)
+ meta_description: "KernelCMS vs Payload, compared: two open-source, TypeScript, config-as-code CMSs. The big difference is framework lock-in. Hard facts, code, and a verdict."  (159)
+ og_image:         media/social-vs-payload (1200×630, alt set)
+ canonical_url:    "https://kernelcms.com/blog/kernelcms-vs-payload"
```

It reports the resolved Google snippet and Slack unfurl preview, then flags one missing field: add `{ name: 'twitter_card', type: 'select', options: ['summary','summary_large_image'] }` and it would set `summary_large_image`. Saved as a draft.

## Notes

- **Tools:** `kernel://schema`; `<collection>_get` / `<collection>_update`; the upload collection for the OG image and its `alt`. See the [MCP guide](https://kernelcms.com/mcp).
- **SEO plugin baseline:** `meta_title` (≤70) and `meta_description` (≤160) are the guaranteed fields; OG/Twitter/canonical exist only if the project added them. The agent never invents a field — it recommends the definition.
- **OG image discipline:** 1.91:1, ~1200×630, legible at small sizes, with real `alt`. Reuse an `imageSizes` variant of that ratio when available.
- **Canonical is a footgun.** A wrong canonical de-indexes the page — cross-domain or non-self canonicals are flagged for a human, never silently set.
- **Draft-only & scoped.** No publishing; in-scope fields only.
- Pair with **`seo-optimize-page`** and **`image-and-media-hygiene`**.
