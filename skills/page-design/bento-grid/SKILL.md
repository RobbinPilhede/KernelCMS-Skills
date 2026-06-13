---
name: bento-grid
description: Compose a modern asymmetric bento grid in KernelCMS — mixed-size cards with one focal tile and a clear reading path — as a draft.
category: Page design
tags: [bento, layout, blocks, grid]
difficulty: intermediate
---

# Design a bento grid

**Use this when** you want an agent to build a bento layout — the asymmetric grid of mixed-size cards that makes a product page feel designed rather than templated. The trick isn't the shapes; it's the hierarchy. The agent composes the real bento block from your schema and assigns sizes with intent.

## Prompt

> You are a senior product designer composing a bento grid in KernelCMS. You work through the access-controlled MCP tools and write **drafts** only.
>
> **First, learn the model.** Read `kernel://schema` to find the target collection's `blocks` field and the **exact bento/grid block** with its real fields — typically a `heading` and a `cells`/`items` array where each item carries content plus a size hint (`span`, `size`, `cols`/`rows`, or a `wide`/`tall` flag). Use only the fields the schema exposes. If the block has no per-cell size control, fall back to even cells and note the limit. If no bento block exists, pick the nearest and say so.
>
> **Then compose the grid as a hierarchy, not a quilt:**
> - **One hero tile.** Exactly one cell is biggest — your strongest message or visual. A bento with two equal giants has no focal point; a bento with all-equal cells is just a grid wearing a costume.
> - **Vary sizes with reason.** Make a cell wide because its content is horizontal (a stat with a label, a quote), tall because it's vertical (a list, an image). Size should follow content, not decoration.
> - **Keep the grid resolvable.** Spans should tile cleanly into the column count (commonly 3 or 4 columns) with no orphan gaps. Plan the layout before writing: e.g. on a 4-col grid, one 2×2 focal tile + two 1×1 + one 2×1.
> - **Mixed content earns its place.** Bento shines when cells differ — a metric, a short feature, an image, a quote. If every cell is the same kind of thing, a plain grid is the honest choice.
> - **Order for the stack.** On mobile the bento collapses to one column in source order — sequence the cells so the most important read first.
>
> **Write the content to the size.** Big tile gets a headline-weight line; small tiles get a label and a number or a three-word benefit. Don't cram a paragraph into a 1×1. Describe any image's intent in words; never fabricate a URL.
>
> **Guardrails.** Real fields and real size values only — match the schema's exact span vocabulary; all must validate. The page stays a draft. When done, sketch the grid layout (cell + span order) and tell me it's ready to review.
>
> Brief: «what the section is selling, the mix of content (stats, features, visuals, quotes), the brand voice».

## Example

**Brief:** "Bento grid for KernelCMS's 'why us' section. Mix: one big tile on config-as-code, a stat (zero native deps), a tile on no-lock-in, a quote. 4-column grid. Voice: assured."

The agent reads `kernel://schema`, finds a `bento` block (`heading`, `cells[] = { title, body, span }` where `span` is `"2x2" | "2x1" | "1x1"`), plans a clean tiling, and writes:

```json
{
  "blockType": "bento",
  "heading": "Why teams pick the boring file over the shiny dashboard",
  "cells": [
    { "title": "Your model is one typed file",
      "body": "Collections, fields, access, and hooks in kernel.config.ts — reviewable in a pull request, not a UI.",
      "span": "2x2" },
    { "title": "0", "body": "native dependencies in core — SQLite ships with Node.", "span": "1x1" },
    { "title": "No lock-in", "body": "Web-standard server, any container, your own database.", "span": "1x1" },
    { "title": "\"One config file we can actually read in review.\"", "body": "— Mara Lind, Staff Eng @ Loop", "span": "2x1" }
  ]
}
```

…written via `pages_update`, leaving the page a **draft**.

## Notes

- **Hierarchy is the whole game.** If you can't point at the one cell that's biggest and say why, the bento isn't done.
- **Tile cleanly.** Spans that don't fill the grid leave ugly gaps — plan the layout on paper (or in your head) before writing the JSON.
- **Source order = mobile order.** The grid linearizes top-to-bottom on small screens.
- **Tools:** `kernel://schema` to discover the block and its exact span values; `<collection>_update` / `_create` to write. See the [MCP guide](https://kernelcms.com/mcp).
- **Draft-only.** Review and publish yourself.
