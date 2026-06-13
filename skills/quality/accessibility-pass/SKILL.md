---
name: accessibility-pass
description: WCAG 2.1 AA audit of a KernelCMS page — alt text, heading order, contrast, labels, focus, reduced motion, semantics — with scoped draft fixes.
category: Quality
tags: [accessibility, wcag, a11y, alt-text, contrast]
difficulty: intermediate
---

# Accessibility pass

**Use this when** you want an agent to take an existing KernelCMS page to WCAG 2.1 AA — the content-side fixes an editor can actually make (alt text, heading order, link text, captions) plus a clear list of the structural/CSS issues that need a developer. Edits land as drafts.

## Prompt

> You are an accessibility specialist auditing a KernelCMS page to **WCAG 2.1 AA** through the access-controlled MCP tools. You write **drafts** only and only touch fields in your scope.
>
> **First, read the model and the document.** Read `kernel://schema` to find the content fields (`blocks`, `richText`) and the upload/media collection — expect an `alt` field (often `required`) and possibly a `focalPoint` on uploads. Then `<collection>_get` the page and the referenced media docs. Use only fields the schema exposes.
>
> **Audit against this checklist**, marking each item pass / content-fix / dev-fix:
> 1. **Images (1.1.1)** — every meaningful image has descriptive `alt` (what it conveys, not "image of"); decorative images have `alt=""`; no alt text starting with "picture of"; complex images (charts) have a longer description nearby.
> 2. **Heading order (1.3.1, 2.4.6)** — one H1, no skipped levels, headings reflect structure, not visual size.
> 3. **Contrast (1.4.3, 1.4.11)** — compute the ratio from the resolved foreground/background hex values: body text ≥ 4.5:1, large text (≥24px, or ≥18.66px bold) ≥ 3:1, UI components and meaningful icons/borders ≥ 3:1. Text over an image or gradient is unknowable from tokens alone — flag it for human/dev verification. You can usually only fix the *content* choice (swap a hero image with poor focal contrast); the token fix is a dev-fix.
> 4. **Link & button text (2.4.4)** — anchors make sense out of context; no bare "click here" / "read more" / raw URLs; buttons describe their action.
> 5. **Labels (1.3.1, 4.1.2)** — any form/CTA block field has a real label, not placeholder-only. Flag inputs missing labels for the developer.
> 6. **Focus & keyboard (2.1.1, 2.4.7, 2.5.8)** — interactive blocks are reachable in DOM order, have a visible `:focus-visible` state, no keyboard traps, and touch targets are ≥24×24px (AA). This is usually a dev-fix; report the specific element and criterion.
> 7. **Motion (2.3.3, 2.2.2)** — autoplaying/looping or parallax blocks respect `prefers-reduced-motion` and can be paused. Report any motion block that can't.
> 8. **Semantics (1.3.1)** — content uses real structure (lists, headings, landmarks) not styled `div`s; tables have headers; language is set.
> 9. **Text alternatives for media (1.2)** — video/audio blocks have captions/transcripts; flag missing ones.
> 10. **Reflow & resize (1.4.10, 1.4.4)** — content reflows to a single column at 320px wide / 400% zoom without horizontal scroll, and survives 200% text zoom without clipping. Fixed-width blocks or text baked into images are dev-fixes; flag them with the element.
>
> **Apply content fixes.** Write/improve `alt` text on media docs, fix heading levels and link text in the blocks, add captions where a field exists — all via `<collection>_update`, as drafts.
>
> **Report.** Separate **fixed in draft** from **needs a developer** (contrast tokens, focus styles, missing input labels, motion controls). For each dev item, name the WCAG criterion and the specific element.
>
> Target: «collection + document id/slug».

## Example

**Brief:** "Accessibility-pass the `pages` doc `home`."

The agent `pages_get`s the page, follows the hero `upload` relationship, and finds `alt` empty and a "Learn more" link. Via `media_update` and `pages_update`:

```diff
media (hero):
- alt: ""
+ alt: "A developer's terminal running `npx kernel dev`, the KernelCMS admin open beside it."

pages.blocks[hero]:
- cta_label: "Learn more"
+ cta_label: "Read the 3-step quickstart"

pages.blocks (features): heading level H4 → H2 (skipped level fixed)
```

It then reports three dev-fixes: the eyebrow text on the hero gradient measures ~3.1:1 (needs ≥4.5:1), the testimonial carousel autoplays with no reduced-motion guard, and the newsletter input has placeholder-only labelling. All content edits saved as drafts.

## Notes

- **Tools:** `kernel://schema`; `<collection>_get` / `<collection>_update`; the media/upload collection's `alt` (and `focalPoint`) fields. See the [MCP guide](https://kernelcms.com/mcp).
- **The agent can't see rendered pixels.** Contrast and focus are computed from tokens/markup or flagged for human/dev verification — the agent fixes content (alt, headings, link text, captions), not CSS it can't reach.
- **`alt` is often required.** If the media collection marks `alt` required, uploads already have *some* value — the job is to make it *good*, not just present.
- **Draft-only & scoped.** No publishing; only in-scope fields are written.
- Pair with **`image-and-media-hygiene`** for focal points and licensing, and **`design-tokens-and-consistency`** for the token-level contrast fixes.
