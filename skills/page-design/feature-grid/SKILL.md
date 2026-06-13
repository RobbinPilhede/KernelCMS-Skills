---
name: feature-grid
description: Compose a 3–6 item feature grid in KernelCMS, each item framed as a user outcome — restraint over completeness — as a draft block.
category: Page design
tags: [features, blocks, marketing, layout]
difficulty: starter
---

# Design a feature grid

**Use this when** you want an agent to write the value section of a page: a small grid of features, each phrased as something the reader *gets*, not something the product *has*. The agent composes the real feature block from your schema and stops well before the section turns into a spec sheet.

## Prompt

> You are a senior product designer writing a feature section in KernelCMS. You work through the access-controlled MCP tools and write **drafts** only.
>
> **First, learn the model.** Read `kernel://schema` to find the target collection's `blocks` field and the **exact feature/grid block** with its real fields (often a `heading` plus a repeatable `items` array of `{ title, body, icon? }`). Use only fields the schema exposes; never invent one. If no grid block exists, pick the nearest and note it.
>
> **Then write features the way a good designer edits them:**
> - **3 to 6 items. Aim for 3.** Three strong, parallel benefits beat six weak ones. A grid of nine is a confession that you couldn't choose. If forced past six, the section is doing two jobs — split it.
> - **Title = the outcome, in the reader's words.** "Ship without a build step," not "Zero-config TypeScript runtime." Lead with the result; the mechanism is the body's job.
> - **Body = one tight sentence** that makes the title believable. Concrete nouns and verbs. No "powerful," "seamless," "robust," "cutting-edge."
> - **Make the set parallel.** Same grammatical shape, similar length, one idea each. Parallelism is what makes a grid *read* as a grid.
> - **A section heading** that frames the theme ("Own your stack"), not a label that restates the word "Features."
>
> **Design judgment.** A grid wants an even, scannable rhythm — 3 across, or 2×2/2×3 on wider blocks; on mobile it stacks to one column, so order the items by importance top-to-bottom. If items carry icons, keep them consistent in weight and meaning; don't decorate for the sake of it. Pick a number that divides cleanly (3 or 6, not 5) unless the content truly demands otherwise.
>
> **Guardrails.** Real fields only, all must validate. The page stays a draft — you cannot publish. When done, list the feature titles in order and tell me it's ready to review.
>
> Brief: «product, audience, the 3 things that actually matter most, brand voice».

## Example

**Brief:** "Feature grid for KernelCMS. Audience: backend-leaning full-stack devs. The three things that matter: config-as-code, no framework lock-in, agent-safe AI access. Voice: confident, plain."

The agent reads `kernel://schema`, finds a `feature_grid` block (`heading`, `items[] = { title, body }`), and writes a single, restrained grid:

```json
{
  "blockType": "feature_grid",
  "heading": "Own your stack",
  "items": [
    { "title": "Your whole model in one file",
      "body": "Collections, fields, access, and hooks live in kernel.config.ts — typed end to end, with no codegen step to forget." },
    { "title": "Runs anywhere, locks you to nothing",
      "body": "A web-standard Request → Response server on any container. Node, edge, your own box — pick the database and host you want." },
    { "title": "AI that can't go rogue",
      "body": "Connect an agent over MCP and it inherits your access rules — field-scoped and draft-only, never a privileged back door." }
  ]
}
```

…written via `pages_update`, leaving the page a **draft**.

## Notes

- **Restraint is the skill.** The hard part isn't filling the grid — it's deleting the fourth, fifth, and sixth items that dilute the first three.
- **Mobile order matters.** Grids collapse to a single column on small screens; the first item should be the strongest because it's read first.
- **Tools:** `kernel://schema` to discover the block and its `items` shape; `<collection>_update` / `_create` to write. See the [MCP guide](https://kernelcms.com/mcp).
- **Pair with** `hero-section` above it and `cta-section` below; run `copy-voice-and-tone` over the titles to keep them parallel.
- **Draft-only.** Review in the admin and publish yourself.
