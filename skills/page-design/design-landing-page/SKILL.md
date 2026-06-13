---
name: design-landing-page
description: Compose a complete, conversion-focused landing page from your KernelCMS block library — hero, proof, features, pricing, FAQ, CTA — as a draft.
category: Page design
tags: [landing, blocks, marketing, conversion]
difficulty: intermediate
---

# Design a landing page

**Use this when** you want an agent to assemble a whole landing page in KernelCMS — not fill one field, but choose sections, order them, and write the copy — by composing your `blocks` page-builder field. The page is created as a draft; a human publishes.

## Prompt

> You are a senior product designer and copywriter composing a landing page in KernelCMS. You operate through the access-controlled MCP tools; you write **drafts** only.
>
> **First, learn the model.** Read the `kernel://schema` resource (or call the relevant `*_get`/list tools) to discover the target collection, its `blocks` field, and the **exact block types available** with their fields. Never invent a block type or a field name — use only what the schema exposes. If a block you'd want doesn't exist, choose the closest available one and note the gap.
>
> **Then compose the page.** Build the `blocks` array as an ordered narrative, not a pile of sections. A strong default arc:
> 1. **Hero** — one clear promise (outcome, not feature), a concrete subhead, one primary CTA.
> 2. **Social proof** — logos or a single strong metric/quote, immediately after the hero.
> 3. **Features / value** — 3 grouped benefits, each phrased as a user outcome, with a one-line explanation. Resist listing more than 6.
> 4. **How it works** — 3 steps, if the product needs explaining.
> 5. **Pricing or a secondary proof block** — only if relevant.
> 6. **FAQ** — the 4–6 real objections, answered plainly.
> 7. **Closing CTA** — restate the promise, one action.
>
> **Write like a human.** Specific verbs, no hype, no "revolutionary/seamless/powerful." Headlines earn their place; cut any section that doesn't move the reader forward. Match the brand voice if one is given; otherwise default to calm, confident, concrete.
>
> **Respect the guardrails.** Every block must be a real type from the schema; every field must validate. Set the page status to draft (it will be a draft regardless — you cannot publish). When done, summarize the section order and the single most important line on the page, and tell the human it's ready to review and publish.
>
> Brief: «describe the product, audience, the one action you want, and any brand voice / must-include proof here».

## Example

**Brief:** "Landing page for KernelCMS — audience is TypeScript devs evaluating a headless CMS; the one action is `npm install kernelcms`; voice is precise and a little contrarian; must include that it doesn't lock you to a framework."

The agent reads `kernel://schema`, finds the `pages` collection with a `layout` blocks field offering `hero`, `logo_strip`, `feature_grid`, `steps`, `faq`, `cta`, then writes:

```json
{
  "layout": [
    { "blockType": "hero", "heading": "A headless CMS that doesn't hijack your framework.",
      "subhead": "Config-as-code, end-to-end typed, runs on any container. One kernel.config.ts.",
      "primary_label": "npm install kernelcms", "primary_href": "/docs/quickstart" },
    { "blockType": "logo_strip", "eyebrow": "Shipping in production at" /* … */ },
    { "blockType": "feature_grid", "heading": "Own your stack",
      "items": [ { "title": "No framework lock-in", "body": "A web-standard Request → Response server. Node, edge, any container." }, /* …2 more… */ ] },
    { "blockType": "faq", "items": [ { "q": "Do I have to use Next.js?", "a": "No — unlike Payload, the admin and API are framework-agnostic." }, /* … */ ] },
    { "blockType": "cta", "heading": "Model your content in one file.", "label": "Quickstart", "href": "/docs/quickstart" }
  ]
}
```

…via a `pages_update` (or `pages_create`) tool call, leaving the page a **draft** for review.

## Notes

- **Tools:** `kernel://schema` resource for discovery; `<collection>_create` / `<collection>_update` to write the `blocks` field. See the [MCP guide](https://kernelcms.com/mcp).
- **Blocks are typed.** The agent can only use block types and fields that exist in your config — that's the guardrail that keeps composition on-brand and valid. Add or rename blocks in your `kernel.config.ts`; the agent picks them up from the schema automatically.
- **Draft-only.** The composed page is a draft. Review it in the admin's live preview and publish when you're happy — the agent cannot.
- Pair with **`seo-optimize-page`** (Quality) once the structure is right.
