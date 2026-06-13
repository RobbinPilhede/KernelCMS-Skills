---
name: fill-missing-fields
description: Drive an agent to find KernelCMS documents with empty fields and draft completions within its scope — excerpts, SEO copy, alt text — for human review.
category: Agent workflows
tags: [completion, backfill, seo, quality, drafts]
difficulty: intermediate
---

# Fill missing fields

**Use this when** your content has gaps — posts without excerpts, products without meta descriptions, images without alt text — and you want an agent to backfill them. The agent queries for documents missing a field, drafts a value derived from the existing content, and writes it through `*_update` within its scope. Every fill is a draft a human reviews; the agent never publishes.

## Prompt

> You are backfilling missing fields in KernelCMS through the access-controlled MCP tools. You write **drafts** only, and only fields inside your `fieldScope`. You complete what's empty — you don't rewrite what's already there unless asked.
>
> **1. Learn the model.** Read `kernel://schema` for the target collection. Identify the field(s) to backfill and confirm they're in your scope. Note the source fields you'll derive from (e.g. `body` → `excerpt`).
>
> **2. Find the gaps.** Call `<collection>_list` with a `where` filter for documents where the target field is empty/null (and `<collection>_count` to size the job). Page through results; don't assume the first page is all of them.
>
> **3. Derive, don't fabricate.** For each document, read its existing content (`<collection>_get`) and generate the missing field *from that content* — an excerpt that summarizes the real body, alt text that describes the actual image's subject, a meta description grounded in the page. Never invent facts the document doesn't contain. Respect length/format constraints (e.g. ~155 chars for a meta description).
>
> **4. Write only the gap.** Call `<collection>_update` setting only the previously-empty field. Leave every other field as-is. The document stays a draft.
>
> **5. Report.** List documents filled (id + the value you wrote), documents skipped (already had a value, or no source content to derive from), and any you couldn't complete confidently. Tell the human to review the `createdByType: agent` drafts and publish.
>
> Job: «collection, the field to fill, the source field(s) to derive from, any length/format rules».

## Example

**Job:** "Fill the empty `excerpt` on blog posts from the `body`. Keep them under 160 characters, no clickbait."

The agent reads `kernel://schema`, confirms `excerpt` is scoped, then:

```
posts_count where { excerpt: { exists: false } }  → 38
posts_list  where { excerpt: { exists: false } }  → page through ids
```

For each, it `posts_get`s the body and writes:

```json
// posts_update
{ "id": "post_a3", "excerpt": "A field-by-field map and a dry run before you cut over from Contentful." }
```

Only `excerpt` is set; the body and everything else are untouched. All 38 stay **drafts**. Report: *"Filled 36 excerpts; skipped 2 (body too short to summarize). Review createdByType:agent drafts → publish."*

## Notes

- **Filter for emptiness precisely.** Use the collection's actual `where` operators (e.g. `{ field: { exists: false } }` or `{ field: { equals: '' } }`) — the Local API validates operators and rejects unknown ones, so check the schema/operators rather than guessing.
- **Derive from real content.** The agent's job is to *summarize/describe what's there*, not author new claims. Ground every fill in the document's existing fields.
- **Touch only the gap.** Set just the empty field in the update so you don't churn or overwrite human-written values. If a value already exists, skip it unless the brief says to redo it.
- **Stay in scope + draft-only.** The target field must be in `fieldScope.allow`; the fill lands as a draft for review. See **`scope-an-agent-safely`**.
- **Tools:** `kernel://schema` (discovery + operators), `<collection>_count` / `<collection>_list` (find gaps), `<collection>_get` (source content), `<collection>_update` (write the fill).
- Pairs with **`translate-content`** (fill a missing locale) and **`review-agent-drafts`**.
