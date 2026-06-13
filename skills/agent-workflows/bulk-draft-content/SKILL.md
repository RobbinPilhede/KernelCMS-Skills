---
name: bulk-draft-content
description: Drive an agent to generate many drafts (e.g. 20 blog posts) in KernelCMS — each scoped, deduped, and queued for human review before publish.
category: Agent workflows
tags: [bulk, drafts, batch, blog, review]
difficulty: intermediate
---

# Bulk-draft content

**Use this when** you want an agent to produce a batch of content — twenty blog posts from a topic list, a stack of product descriptions, a set of FAQ entries — without it going anywhere near publish. Each item is created as a draft through `*_create`, within the agent's field scope, and a human reviews the batch before anything goes live.

The safety here is structural: an agent can author a hundred drafts and still not publish one. The work is making the batch *good and non-duplicative*, not making it safe — the engine already does that.

## Prompt

> You are bulk-drafting content in KernelCMS through the access-controlled MCP tools. Everything you create is a **draft** — you cannot publish, and you can only write fields inside your `fieldScope`.
>
> **1. Learn the model.** Read `kernel://schema` (or `kernel://collections/<slug>`) for the target collection. Note its required fields, the slug/title fields, and exactly which fields are in your scope. Write only those.
>
> **2. Check for duplicates first.** Before creating anything, call `<collection>_count` (cheap) or `<collection>_list` with a `where` filter (e.g. `{ slug: { in: [...] } }` or `{ title: { contains: '...' } }`) to see what already exists. The Local API validates `where` operators and rejects unknown ones, so use real operators from the schema. Skip topics already covered; don't recreate a post whose slug or title exists.
>
> **3. Draft one at a time, idempotently.** For each item in the batch, call `<collection>_create` with a complete, valid payload — a unique slug, a real title, body copy that stands on its own. Vary structure and angle across the batch; don't template-fill the same three paragraphs with synonyms. If a create fails validation, fix that item and continue — don't abort the whole batch.
>
> **4. Pace and report.** Keep a running list of what you created (id, title, slug) and what you skipped (and why). Do **not** retry a successful create. When the batch is done, output the full manifest and tell the human exactly how to review: filter the collection to `createdByType: agent` drafts, read them in the admin preview, and publish the keepers.
>
> Batch spec: «collection, the list of topics/items, target count, voice, any must-cover angles».

## Example

**Spec:** "Draft 20 blog posts for our launch series from this topic list [...]. Voice: practical, no hype."

The agent reads `kernel://schema`, finds `posts` with `fieldScope.allow: ['title', 'slug', 'excerpt', 'body']`. It calls `posts_count` to see 4 of the 20 topics already exist, skips those, then loops `posts_create` for the remaining 16:

```json
{ "title": "Migrating from Contentful in an afternoon",
  "slug": "migrating-from-contentful",
  "excerpt": "A field-by-field map and a dry run before you cut over.",
  "body": "…" }
```

Each lands as a **draft**, attributed `createdByType: agent`. Final report:

```
Created 16 drafts (ids + slugs listed). Skipped 4 (already exist).
Review: filter posts to createdByType:agent drafts → admin preview → publish the keepers.
```

## Notes

- **Draft-only is the whole safety story.** No matter the batch size, nothing publishes. The reviewer is the gate — the agent can't bypass it.
- **Dedup before write.** `*_count` / `*_list` with a `where` filter is cheap; use it so a re-run of the same prompt doesn't double-create. Slugs that must be unique will also fail at validation, but checking first is cleaner.
- **Stay in scope.** Fields outside `fieldScope.allow` are stripped silently — don't waste tokens setting `author` or `seo`; they won't land. `_status` isn't even in the generated tool schema (it's omitted by the mapper, and the schema is `additionalProperties: false`), so there's no way to set it. See **`scope-an-agent-safely`**.
- **One create per item.** `create` is *not* idempotent — each call makes a new row. Track ids and never retry a success, or you'll get duplicate drafts.
- **Tools:** `kernel://schema` (discovery), `<collection>_count` / `<collection>_list` (dedup), `<collection>_create` (each draft).
- Hand off to **`review-agent-drafts`** for the human publish workflow.
