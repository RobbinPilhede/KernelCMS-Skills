---
name: stats-band
description: Compose a punchy metrics band in KernelCMS — 3–4 real numbers with clear labels — as a draft block.
category: Page design
tags: [stats, metrics, social-proof, blocks]
difficulty: starter
---

# Design a stats band

**Use this when** you want an agent to write a metrics band — the short horizontal strip of numbers that makes a claim concrete. A great stats band is three or four real figures that each say something a paragraph couldn't. The agent composes the real stats block from your schema and never invents a number, leaving the page a draft.

## Prompt

> You are a senior product designer composing a stats band in KernelCMS. You work through the access-controlled MCP tools and write **drafts** only.
>
> **First, learn the model.** Read `kernel://schema` to find the target collection's `blocks` field and the **exact stats/metrics block** with its real fields — typically a `heading?` and a `stats`/`items` array of `{ value, label, suffix? }`. Use only fields the schema exposes. If no stats block exists, pick the nearest and note it.
>
> **Then make each number earn its place:**
> - **3 or 4 stats. Not five, not seven.** A band reads in one glance; past four, the eye stops counting and starts skimming. Pick the figures that matter most and cut the rest.
> - **The value is the hero; the label is the proof.** Big bold number, short label beneath. "40k" / "lines of config replaced," "0" / "native dependencies," "<2 min" / "to a typed API." The number lands first, the label tells you what it means.
> - **Make them concrete and verifiable.** A real, specific figure ("12,000 deploys") beats a round vanity number ("thousands of happy users"). If a metric is soft or you're not sure of it, leave it out — a band of three solid numbers beats four with a weak link.
> - **Vary what the numbers measure.** Scale, speed, simplicity, savings — different dimensions tell a fuller story than four flavors of the same brag.
> - **Labels are tight.** Three or four words. The number does the talking.
>
> **Design judgment.** A stats band wants even spacing and equal visual weight — same value size, same label size, balanced across the row. On mobile it stacks (or goes 2×2), so order by impact. Keep the formatting consistent: pick a style for big numbers (`40k`, `12,000`, `99.9%`) and use it across the set. Don't decorate; the restraint is the point.
>
> **Guardrails.** Real fields only, all must validate. **Never invent figures** — use only numbers from the brief; if I haven't given you one for a slot, drop the slot and tell me. The page stays a draft. When done, list the stats you used and tell me it's ready to review.
>
> Brief: «the real numbers and what each measures, optional heading, brand voice».

## Example

**Brief:** "Stats band for KernelCMS. Real figures: 0 native deps in core, replaces ~40k lines of typical CMS config, under 2 minutes to a typed API, 1 file for the whole model. Voice: confident, spare."

The agent reads `kernel://schema`, finds a `stats_band` block (`heading`, `stats[] = { value, label }`), and writes:

```json
{
  "blockType": "stats_band",
  "heading": "Less, on purpose",
  "stats": [
    { "value": "1", "label": "file for your whole model" },
    { "value": "0", "label": "native dependencies in core" },
    { "value": "~40k", "label": "lines of config it replaces" },
    { "value": "<2 min", "label": "to a typed API" }
  ]
}
```

…written via `pages_update`, leaving the page a **draft**.

## Notes

- **Three solid numbers beat four with a soft one.** If a figure is vanity or unverified, cut it.
- **Consistent formatting reads as designed.** Pick one number style and hold it across the band.
- **Tools:** `kernel://schema` to discover the block and `stats` shape; `<collection>_update` / `_create` to write. See the [MCP guide](https://kernelcms.com/mcp).
- **Pair with** `testimonials-section` (numbers plus voices is stronger proof than either alone) and place it right after the hero in `design-landing-page`.
- **Draft-only.** Review and publish yourself.
