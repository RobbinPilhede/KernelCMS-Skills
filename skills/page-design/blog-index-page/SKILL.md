---
name: blog-index-page
description: Compose a clean, scannable blog index in KernelCMS — a featured lead, a readable list, real metadata — as a draft.
category: Page design
tags: [blog, index, listing, blocks]
difficulty: intermediate
---

# Design a blog index page

**Use this when** you want an agent to assemble a blog or article listing page: a featured lead post, a scannable list, and just enough metadata to help readers choose. The agent composes the real listing blocks from your schema — and pulls actual posts via the list tools rather than inventing them — leaving the page a draft.

## Prompt

> You are a senior product designer composing a blog index page in KernelCMS. You work through the access-controlled MCP tools and write **drafts** only.
>
> **First, learn the model.** Read `kernel://schema`. Identify two things: (1) the posts/articles collection and its real fields (title, excerpt/summary, date, author, slug, cover), and (2) the page's `blocks` field and the **exact listing blocks** available — e.g. a `featured_post`, a `post_list`/`post_grid`, or a `post_feed` that references the collection. Use only fields and blocks the schema exposes. If listings are rendered dynamically from the collection (a feed block that takes a filter/limit, not hand-listed posts), prefer that. If you need real posts, call `<posts>_list` to fetch them — never invent titles, dates, or slugs.
>
> **Then design a page a reader can scan in five seconds:**
> - **One featured lead.** The newest or most important post gets a larger card with its excerpt and cover. It sets the tone and gives the eye a starting point.
> - **A clean list below.** Title, a one-line excerpt, date, author, reading the same shape down the page. Consistency is what makes a list scannable — same fields, same order, same rhythm.
> - **Date and author earn their place; everything else is noise.** Resist tag clouds, share counts, and three-line summaries. The reader is choosing what to click, not reading the post yet.
> - **Strong, honest titles and excerpts.** Pull the post's real title; if you write or trim an excerpt, make it a true one-sentence promise of the article, not clickbait.
> - **Order intentionally.** Newest-first by default; if the brief wants a curated top, put the evergreen flagship as the featured lead and recent posts below.
>
> **Design judgment.** A listing wants generous vertical rhythm and a single column (or a 2–3 col grid that collapses to one on mobile) — readers scan top-to-bottom. Don't mix card sizes randomly; one featured tile then an even list reads as deliberate. If a cover image is missing on a post, the layout should hold without it — don't fabricate an image URL to fill the gap.
>
> **Guardrails.** Real fields, real posts, all must validate. If the listing block references the collection by query, set a sensible `limit` and `sort`. The page stays a draft. When done, summarize the featured post and how many list items, and tell me it's ready to review.
>
> Brief: «which collection holds the posts, what to feature, sort order, brand voice».

## Example

**Brief:** "Blog index for KernelCMS. Posts live in the `articles` collection. Feature the latest, list the rest newest-first. Voice: calm and technical."

The agent reads `kernel://schema`, sees a `pages` collection whose `layout` blocks include `featured_post` (`article` relationship) and `post_feed` (`collection`, `sort`, `limit`, `exclude`). It calls `articles_list` to confirm the latest article's id, then writes:

```json
{
  "layout": [
    { "blockType": "featured_post", "eyebrow": "Latest", "article": "art_0192" },
    { "blockType": "post_feed",
      "heading": "More from the blog",
      "collection": "articles",
      "sort": "-publishedAt",
      "limit": 12,
      "exclude": ["art_0192"] }
  ]
}
```

…written via `pages_update`, leaving the page a **draft**. The feed renders live from the collection, so it stays current without re-editing the page.

## Notes

- **Prefer a query-driven feed over a hand-typed list.** If the schema offers a feed/list block that references the collection, the index updates itself as new posts publish. Only hand-list posts when no such block exists.
- **Fetch, don't fabricate.** Use `<posts>_list` to get real ids, titles, and dates. Reads are access-filtered, so you only see what the agent principal is allowed to.
- **Tools:** `kernel://schema` for the model; `<posts>_list` to fetch posts; `<collection>_update` / `_create` to write. See the [MCP guide](https://kernelcms.com/mcp).
- **Pair with** `model-a-blog` if the posts collection doesn't exist yet, `blog-post-layout` for the articles themselves, and `internal-linking` to wire the index into the site.
- **Draft-only.** Review and publish yourself.
