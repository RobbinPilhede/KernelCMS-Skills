---
name: design-tokens-and-consistency
description: Keep KernelCMS sections on-system — consistent block types, spacing, variants, and copy patterns; eliminate one-off styles and ad-hoc layouts. Draft edits.
category: Quality
tags: [design-system, consistency, blocks, tokens, variants]
difficulty: intermediate
---

# Design tokens and consistency

**Use this when** a page works but feels off-system — a hero with a one-off layout, three different button styles, inconsistent section spacing, a feature grid that doesn't match the others — and you want an agent to bring every section back to the block conventions and design tokens, replacing bespoke choices with the standard variant. Drafts only.

## Prompt

> You are a design-systems editor enforcing consistency in KernelCMS through the access-controlled MCP tools. You write **drafts** only and touch only fields in your scope. You make the page match the **system**, not your taste — you only use block types, variants, and token values the schema already exposes.
>
> **First, learn the system.** Read `kernel://schema` to enumerate the available block types and, for each, its variant/option fields (e.g. a block's `variant`, `theme`, `align`, `spacing`, `columns` select fields and their allowed values). Optionally `<collection>_list` a few well-formed reference pages to learn the house pattern. **You may only set values the field's options allow** — no invented variants.
>
> **Then audit the target page against this checklist:**
> 1. **Block-type fit** — each section uses the *intended* block for its job (don't fake a feature grid out of stacked text blocks when a `feature_grid` exists).
> 2. **Variant consistency** — repeated section types use the same variant/theme/alignment unless there's a deliberate reason; flag the odd one out.
> 3. **Spacing & rhythm** — section spacing uses the standard token values, not a one-off; consistent vertical rhythm down the page.
> 4. **Column counts & item counts** — grids use a standard column option; sibling grids match (don't mix a 3-col and a 4-col feature grid for no reason).
> 5. **Button/CTA style** — CTAs use the standard variant set (primary/secondary), not three different ad-hoc styles; one primary action emphasis per section.
> 6. **Eyebrow / heading / body pattern** — sections follow the same internal copy structure the system expects (eyebrow → heading → body), not improvised arrangements.
> 7. **Token-bound color/theme** — section themes come from the allowed `theme` options (light/dark/accent), never a raw one-off color where the schema doesn't permit it.
> 8. **No orphan/empty fields** — required structural fields are set; no half-filled blocks.
>
> **Apply** by normalizing the offending blocks' option fields via `<collection>_update`, as drafts. Where the *content* is fine but it's in the wrong block type, propose the swap (and do it if the target block exists and the fields map cleanly).
>
> **Report.** A list of inconsistencies found and what you normalized them to (the standard value), anything that needed a *new* schema option to fix properly (dev-fix — name the field and value), and any deliberate-looking exception you left alone for a human to confirm.
>
> Target: «collection + document id/slug».

## Example

**Brief:** "Consistency-pass the `pages` doc `home`."

The agent reads `kernel://schema`, sees `feature_grid` offers `columns: 2 | 3 | 4` and `cta` offers `variant: primary | secondary`, then `pages_get`s the page. It finds two feature grids (one 3-col, one 4-col) and three CTAs using mixed variants. Via `pages_update`:

```diff
blocks[features-a].columns: 4 → 3   (match the other feature grid + the house default)
blocks[cta-mid].variant:    (unset/ad-hoc) → secondary
blocks[cta-end].variant:    primary   (the page's single primary action — kept)
blocks[proof].spacing:      "tight" → "default"   (match section rhythm)
```

It reports normalizing two grids to 3 columns, three CTAs down to one primary / two secondary, and one spacing token aligned. It flags one section that wants a "split" hero layout the schema doesn't offer — recommend adding a `variant: 'split'` option rather than faking it with two blocks. Saved as a draft.

## Notes

- **Tools:** `kernel://schema` to enumerate block types and their allowed option values; `<collection>_list` for reference pages; `<collection>_update` to normalize. See the [MCP guide](https://kernelcms.com/mcp).
- **The schema is the design system.** Because blocks and their option fields are typed, "on-system" means "a value the field allows." The agent literally cannot set an invalid variant — that's the guardrail.
- **Consistency, not flattening.** Deliberate exceptions are flagged for a human, not bulldozed.
- **Draft-only & scoped.** No publishing; in-scope fields only.
- Pair with **`design-landing-page`** (Page design) for composition and **`accessibility-pass`** for token-level contrast.
