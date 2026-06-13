---
name: hero-section
description: Design a high-impact hero block in KernelCMS — one promise, one subhead, one CTA — composed into the blocks page-builder as a draft.
category: Page design
tags: [hero, blocks, marketing, conversion]
difficulty: starter
---

# Design a hero section

**Use this when** you want an agent to write the single most-read block on a page — the hero — by composing your `blocks` field. A hero earns the scroll or loses it. The agent picks the real hero block from your schema, writes the copy, and leaves the page a draft for a human to publish.

## Prompt

> You are a senior product designer writing the hero of a KernelCMS page. You work through the access-controlled MCP tools and write **drafts** only.
>
> **First, learn the model.** Read `kernel://schema` (or `kernel://collections/<slug>`) to find the target collection, its `blocks` field, and the **exact hero block type** with its real field names. Never invent a block or field — use only what the schema exposes. If there is no hero-shaped block, pick the closest one and say so.
>
> **Then write the hero like it's the only thing they'll read** — because for most visitors it is:
> - **Headline = the promise, not the feature.** Lead with the outcome the reader gets, in plain words. One idea. If it has an "and," cut to the stronger half. No "revolutionary / seamless / powerful / next-gen."
> - **Subhead = the proof of the promise.** One concrete sentence: what it is, who it's for, why it's believable. Specifics over adjectives.
> - **One primary CTA.** A verb the reader can act on now (`Start free`, `Read the quickstart`), pointing at a real path. A secondary link is allowed only if it's genuinely lower-commitment (docs, a demo) — never two equal buttons competing for the same click.
> - **Eyebrow / kicker** only if it adds context the headline can't carry alone. Otherwise leave it out.
>
> **Hierarchy is the design.** One dominant line, one supporting line, one action. Don't pad the hero with fields the block offers but the message doesn't need — restraint reads as confidence. If the block has an image/media field, describe the asset's intent in plain words; don't fabricate a URL.
>
> **Guardrails.** Every field must be a real one from the schema and must validate. The page stays a draft — you cannot publish. When done, quote the final headline and CTA back to me and tell me it's ready to review.
>
> Brief: «product, audience, the one action you want, brand voice».

## Example

**Brief:** "Hero for KernelCMS. Audience: TypeScript devs sick of CMSes that own their stack. One action: read the quickstart. Voice: precise, a little contrarian."

The agent reads `kernel://schema`, finds the `pages` collection with a `layout` blocks field exposing a `hero` block (`heading`, `subhead`, `primary_label`, `primary_href`, `secondary_label`, `secondary_href`), and writes one block:

```json
{
  "blockType": "hero",
  "heading": "A headless CMS that never hijacks your framework.",
  "subhead": "Model your content in one kernel.config.ts — typed end to end, REST and GraphQL generated, runs on any container.",
  "primary_label": "Read the quickstart",
  "primary_href": "/docs/quickstart",
  "secondary_label": "See the config",
  "secondary_href": "/docs/configuration"
}
```

…written via `pages_update` (or `pages_create`), leaving the page a **draft**.

## Notes

- **One block, done well.** This skill writes the hero only. Pair it with `feature-grid`, `testimonials-section`, and `cta-section` to build out the page, or use `design-landing-page` for the whole arc.
- **`blockType` is the stored discriminator.** In `kernel.config.ts` a block is declared with a `slug`; in the stored JSON it appears as `blockType`. Match whatever the schema's block defines for its fields — don't guess `title` when the field is `heading`.
- **Tools:** `kernel://schema` to discover blocks; `<collection>_create` / `<collection>_update` to write. See the [MCP guide](https://kernelcms.com/mcp).
- **Draft-only.** Agents can't publish. Review in the admin's live preview and ship it yourself.
