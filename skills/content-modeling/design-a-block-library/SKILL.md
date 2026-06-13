---
name: design-a-block-library
description: Design a reusable KernelCMS blocks page-builder set — hero, feature_grid, cta — so agents and editors compose on-brand pages from typed sections.
category: Content modeling
tags: [blocks, page-builder, design-system, sections, marketing]
difficulty: intermediate
---

# Design a block library

**Use this when** you want an agent to design the **set of blocks** behind a `blocks` page-builder field — the reusable, typed sections (hero, feature grid, CTA, testimonial, FAQ…) that editors and agents compose pages from. A good block library is a content design system: tight, named, on-brand by construction. The output is the `blocks` definition in `kernel.config.ts`.

## Prompt

> You are designing a reusable block library for a KernelCMS `blocks` page-builder field. Output a `blocks` field definition (the `BlockDef[]`) using only real field types: `text`, `textarea`, `slug`, `number`, `boolean`, `select`, `richText`, `group`, `array`, `relationship`, `upload`, `point`. Each block is `{ slug, labels?, admin?: { group, description, thumbnail }, fields: [...] }`. Blocks are stored as `{ blockType, ...fields }`.
>
> **Design principles — this is a design system, not a dumping ground:**
> 1. **Tight set.** Ship the 6–10 sections a brand actually uses. Each block you add is a thing an editor/agent can place, so restraint *is* the on-brand guarantee — only fields you define can be set.
> 2. **One job per block.** A `hero` is one promise + one CTA. A `feature_grid` is N uniform feature cards. Don't build a god-block with 20 optional fields; build distinct, single-purpose blocks.
> 3. **Constrain repetition.** Repeated items inside a block are an `array` with `minRows`/`maxRows` (a feature grid of 2–6, not unbounded). This is where layout quality is enforced.
> 4. **Curate, don't free-form.** Prefer a `select` of variants (`align: left|center`, `theme: light|dark`, `width: contained|full`) over arbitrary inputs. Bound choices keep pages consistent.
> 5. **Real links & media.** CTAs are `{ label, href }` (or a `relationship` to a `pages` collection for internal links). Images are `upload` → media. Never a bare URL where a typed link belongs.
> 6. **Library affordances.** Give every block `admin.group` (so the section picker is organized) and a one-line `admin.description` (the library card copy). A `thumbnail` URL helps editors choose.
>
> **A strong default marketing set:** `hero`, `logo_strip`, `feature_grid`, `feature_split` (image + copy, alternating), `steps`, `testimonial`/`quote`, `stat_row`, `pricing`, `faq`, `cta`, `rich_text` (an escape hatch for prose). Adapt to the brief — drop what isn't needed.
>
> Output the `blocks` field, then a short note on which blocks you included/excluded and why, and the variant `select`s you used to keep composition on-brand. Note how an agent composing pages discovers these via `kernel://schema` and can only use these exact types/fields.

## Example

**Brief:** "A block library for a SaaS marketing site: a hero, social proof, a benefits grid, an alternating feature/screenshot section, an FAQ, and a closing CTA. Keep it consistent — limited alignment/theme options."

The agent emits (excerpt):

```ts
const marketingBlocks = [
  {
    slug: 'hero',
    labels: { singular: 'Hero', plural: 'Heroes' },
    admin: { group: 'Header', description: 'One promise, one primary action.' },
    fields: [
      { name: 'eyebrow', type: 'text' },
      { name: 'heading', type: 'text', required: true },
      { name: 'subhead', type: 'textarea' },
      { name: 'primary_label', type: 'text' },
      { name: 'primary_href', type: 'text' },
      { name: 'image', type: 'upload', relationTo: 'media' },
      { name: 'theme', type: 'select', options: ['light', 'dark'], defaultValue: 'light' },
    ],
  },
  {
    slug: 'logo_strip',
    admin: { group: 'Proof', description: 'Row of customer/partner logos.' },
    fields: [
      { name: 'eyebrow', type: 'text', defaultValue: 'Trusted by' },
      { name: 'logos', type: 'upload', relationTo: 'media', hasMany: true },
    ],
  },
  {
    slug: 'feature_grid',
    admin: { group: 'Body', description: '3–6 benefit cards in a grid.' },
    fields: [
      { name: 'heading', type: 'text' },
      { name: 'items', type: 'array', minRows: 3, maxRows: 6, fields: [
        { name: 'icon', type: 'select', options: ['zap', 'shield', 'globe', 'lock', 'chart', 'gear'] },
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'textarea' },
      ] },
    ],
  },
  {
    slug: 'feature_split',
    admin: { group: 'Body', description: 'Copy beside a screenshot; alternate sides.' },
    fields: [
      { name: 'heading', type: 'text', required: true },
      { name: 'body', type: 'richText', preset: 'minimal' },
      { name: 'image', type: 'upload', relationTo: 'media', required: true },
      { name: 'media_side', type: 'select', options: ['left', 'right'], defaultValue: 'right' },
    ],
  },
  {
    slug: 'faq',
    admin: { group: 'Body', description: '4–8 real questions answered plainly.' },
    fields: [
      { name: 'heading', type: 'text', defaultValue: 'Questions' },
      { name: 'items', type: 'array', minRows: 1, maxRows: 8, fields: [
        { name: 'q', type: 'text', required: true },
        { name: 'a', type: 'textarea', required: true },
      ] },
    ],
  },
  {
    slug: 'cta',
    admin: { group: 'Footer', description: 'Closing call to action.' },
    fields: [
      { name: 'heading', type: 'text', required: true },
      { name: 'label', type: 'text', required: true },
      { name: 'href', type: 'text', required: true },
      { name: 'theme', type: 'select', options: ['light', 'dark'], defaultValue: 'dark' },
    ],
  },
] as const

// used on a pages collection:
// { name: 'layout', type: 'blocks', minRows: 1, blocks: marketingBlocks }
```

**Rationale (abridged):** Six blocks, each single-purpose. `feature_grid` caps items at 3–6 (`minRows`/`maxRows`) so the grid never breaks layout. Variation is bounded `select`s (`theme: light|dark`, `media_side: left|right`) — no free-form alignment, which keeps every page on-brand. CTAs carry `{ label, href }`, not loose text. `admin.group` sorts the section picker (Header / Proof / Body / Footer); `admin.description` is the card copy editors read. A `rich_text` escape hatch was omitted here because the brief's sections were all structured — add it only when editors need free prose.

## Notes

- **The block set is the guardrail.** An agent composing pages (see **`design-landing-page`** in Page design) reads `kernel://schema`, sees exactly these blocks and fields, and *cannot* invent a section or a field — that's what keeps automated composition on-brand and valid.
- **Bound everything:** `minRows`/`maxRows` on item arrays, `select` for variants, `maxLength` on headlines. Constraints are the design system.
- **`admin.group` / `description` / `thumbnail`** drive the section library UI — fill them in; they're the difference between a usable picker and a wall of slugs.
- **Reuse the set** across collections (`pages`, `case_studies`, `landing_pages`) by defining `blocks` once and referencing it.
- **Don't over-build.** Every block is a permanent affordance. Start with the sections the brand uses today; add when a real page needs one.
