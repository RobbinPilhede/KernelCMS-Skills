---
name: compose-page-from-brief
description: Drive an agent to read `kernel://schema`, discover your block library, and compose a page's blocks field from a plain-language brief — as a draft.
category: Agent workflows
tags: [blocks, page-builder, compose, schema, draft]
difficulty: intermediate
---

# Compose a page from a brief

**Use this when** you want an agent to build a whole page in KernelCMS from a short brief — choosing sections, ordering them, and writing the copy — not just filling one field. The agent discovers your block library from the schema, then writes the page's `blocks` field in one `*_create` / `*_update`. The page lands as a draft for a human to publish.

This is the agent-driving counterpart to the **Page design** skills: those encode the design judgment, this one encodes the *MCP mechanics* of doing it safely as a scoped agent.

## Prompt

> You are composing a page in KernelCMS through the access-controlled MCP tools. You write **drafts** only — you cannot publish, and you can only write fields inside your `fieldScope`.
>
> **1. Learn the model.** Read the `kernel://schema` resource (or `kernel://collections/<slug>`) to find the target collection and its page-builder field — a `blocks`-type field holding an array of `{ blockType, …fields }`. Enumerate the **exact block types available and each one's fields**. Never invent a block type or field name; use only what the schema exposes. If the brief wants something with no matching block, pick the closest one and note the gap rather than fabricating.
>
> **2. Plan the arc.** Turn the brief into an ordered narrative, not a pile of sections — hero → proof → value → how-it-works → FAQ → closing CTA, cutting anything that doesn't move the reader forward. Match the brand voice if given.
>
> **3. Write the field.** Build the `blocks` array in order, each entry an object `{ blockType, …fields }` whose `blockType` is a real block slug and whose fields are filled and valid. Set it in a single call: `<collection>_update` (id required; it's a partial patch, so you can write just the blocks field) on an existing page, or `<collection>_create` for a new one. If a field you'd want isn't in your scope, leave it and say so.
>
> **4. Confirm.** The page is a draft regardless of what you set — you can't publish it. When done, summarize the section order, the single most important line on the page, and any block types or fields you wanted but couldn't use. Tell the human it's ready to review and publish.
>
> Brief: «product, audience, the one action you want, brand voice, any must-include proof».

## Example

**Brief:** "A launch page for the 0.5 release — a hero, three feature columns, and a call to action. Voice: precise, a little contrarian."

The agent reads `kernel://schema`, finds the `pages` collection with a `layout` blocks field offering `hero`, `feature_grid`, `cta`, then calls `pages_update`:

```json
{
  "id": "launch-0-5",
  "layout": [
    { "blockType": "hero", "eyebrow": "Release 0.5",
      "heading": "Field scoping, now per-agent.",
      "sub": "Draft freely. Publishing stays yours." },
    { "blockType": "feature_grid", "columns": 3, "items": [
      { "title": "Per-agent scope", "body": "Each agent gets its own field allow-list." },
      { "title": "Draft-only brake", "body": "Agents author; humans publish." },
      { "title": "One pipeline", "body": "Same access rules as a human caller." }
    ] },
    { "blockType": "cta", "label": "Read the 0.5 notes", "href": "/changelog" }
  ]
}
```

The page stays a **draft**. The agent reports: *"3 sections — hero, feature_grid, cta. Strongest line: 'Field scoping, now per-agent.' Ready to review and publish."*

## Notes

- **The block library is the guardrail.** The agent can only use `blockType`s and fields that exist in your config — unknown blocks and bad fields fail validation before anything is written. Add or rename blocks in `kernel.config.ts`; the schema (and the agent) pick them up automatically.
- **Scope must include the blocks field.** Composition needs the page-builder field (e.g. `layout`) in `fieldScope.allow`. A permitted blocks field passes every block's subfields through, so the agent can fill them. See **`scope-an-agent-safely`**.
- **Tools:** `kernel://schema` for discovery; `<collection>_create` / `<collection>_update` to write the field. Hidden/auth collections aren't introspectable.
- **Draft-only.** Review the result in the admin's live preview and publish when you're happy — the agent can't.
- Pair with the **Page design** skills for the design arc, and **`review-agent-drafts`** for the publish gate.
