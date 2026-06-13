---
name: migrate-content-from-another-cms
description: Drive an agent to map and import content from Contentful, Sanity, or WordPress into KernelCMS collections as reviewable drafts.
category: Agent workflows
tags: [migration, contentful, sanity, wordpress, import, drafts]
difficulty: advanced
---

# Migrate content from another CMS

**Use this when** you're moving off Contentful, Sanity, or WordPress and want an agent to do the field-by-field mapping and the import — landing everything in KernelCMS as drafts you review before cutover. The agent reads your target schema, builds an explicit mapping from the source export, and creates documents through `*_create`. Nothing publishes until a human says so.

There are two paths. For a large, trusted, one-shot migration, the **CLI bulk import** (`kernel import --file`) is faster and runs server-side. For an *agent-driven, reviewed, transform-as-you-go* migration — the case this skill covers — the agent maps and creates documents over MCP, so every row is a draft you can audit.

## Prompt

> You are migrating content into KernelCMS from another CMS, through the access-controlled MCP tools. Everything you create is a **draft** — review happens before any cutover. You can only write fields inside your `fieldScope`.
>
> **1. Learn the target model.** Read `kernel://schema` and the relevant `kernel://collections/<slug>` descriptors. For each target collection, list its fields, types, required fields, and which are in your scope.
>
> **2. Build an explicit field map — and show it before importing.** For each source content type, produce a table: `source field → target field`, with the transform (rename, type coercion, rich-text → the target's body format, asset reference handling, relationship resolution). Flag every source field that has **no** target home and every required target field with **no** source — do not guess. Get the human's sign-off on the map before creating anything.
>
> **3. Import in dependency order.** Create referenced collections first (authors, categories, media records) so relationships can resolve, then the documents that point at them. For each row, call `<collection>_create` with the mapped, validated payload. Preserve the source slug where possible so URLs survive. Keep a source-id → new-id table to wire relationships.
>
> **4. Handle the messy cases explicitly.** Rich text: convert to the target field's format, don't paste raw HTML into a plain-text field. Assets: create the media record / set the reference per the target schema; if you can't fetch a binary, record the source URL and flag it. Dates and enums: coerce to the target types or flag mismatches.
>
> **5. Report.** Output: rows created per collection (with ids), rows skipped/flagged (and why), and the unresolved-mapping list. Tell the human to review the drafts (filter to `createdByType: agent`), spot-check relationships and assets, then publish in the admin. Migration completes when a human publishes — not when you finish creating.
>
> Source: «which CMS, the export format/location, and the content types to migrate».

## Example

**Source:** a Contentful export with `blogPost { title, slug, body (rich text), author (ref), heroImage (asset), publishedAt }`.

The agent reads `kernel://schema`, finds `posts` and `authors` collections, and proposes:

```
blogPost.title       → posts.title
blogPost.slug        → posts.slug          (preserve)
blogPost.body        → posts.body          (rich text → portable blocks)
blogPost.author      → posts.author        (resolve ref via authors import)
blogPost.heroImage   → posts.hero          (create media record, set reference)
blogPost.publishedAt → (no scoped target — flag; human sets on publish)
```

You approve. The agent imports `authors` first, then loops `posts_create`, keeping a `cfId → kernelId` map to resolve the `author` references. Every post lands as a **draft**. Report:

```
authors: 12 created. posts: 240 created, 3 flagged (missing heroImage binary).
publishedAt unmapped — set at publish time. Review createdByType:agent drafts, then publish.
```

## Notes

- **Two import paths.** Agent-over-MCP (this skill) gives you per-row transforms and reviewable drafts. `npx kernel import --file <export.json>` is the CLI bulk path for a portable `{ "<slug>": [rows] }` export — faster for trusted, large one-shots, but it's a human/CLI action, not an agent one. Choose per migration; you can combine (CLI for the bulk, agent for the tricky transforms).
- **Map before you import.** The schema is the contract — an unmapped source field or an unsatisfied required target field is a decision, not a default. Surface them.
- **Order matters.** Import referenced collections first so relationship fields resolve; keep a source-id → new-id table.
- **Draft-only.** Agents can't publish, so a botched migration is a pile of reviewable drafts, never a broken live site. Cutover is the human's publish step.
- **Stay in scope.** Lifecycle and ownership fields (`_status`, `author` if unscoped) are stripped from agent writes — assign them at the human review/publish step. See **`scope-an-agent-safely`**.
- **Tools:** `kernel://schema` + `kernel://collections/<slug>` (target model), `<collection>_create` (each row), `<collection>_list` / `_count` (idempotency on re-runs).
- Hand off to **`review-agent-drafts`** for the cutover gate.
