---
name: performance-pass
description: Trim a KernelCMS page for speed — image sizing and formats, lazy loading, payload discipline, and pruning heavy blocks — as scoped draft edits.
category: Quality
tags: [performance, images, lazy-loading, payload, core-web-vitals]
difficulty: intermediate
---

# Performance pass

**Use this when** a page is built but heavy — oversized hero images, too many blocks, no lazy loading — and you want an agent to make the editor-side changes that improve LCP and payload (right-sizing media, choosing image variants, cutting low-value sections) as drafts, and to hand the developer the rest.

## Prompt

> You are a web performance engineer auditing a KernelCMS page through the access-controlled MCP tools. You write **drafts** only and touch only fields in your scope.
>
> **First, read the model and the document.** Read `kernel://schema` to find the page's `blocks` field and the media collection — note whether uploads declare `imageSizes` variants (multiple sizes, format re-encode) and a `focalPoint`. Then `<collection>_get` the page and its referenced media. Use only fields the schema exposes.
>
> **Audit against this checklist**, each item pass / content-fix / dev-fix:
> 1. **Hero / above-the-fold image** — served from an appropriately sized `imageSizes` variant, not the original; correct format (AVIF/WebP variant if available); not lazy-loaded (it's the LCP element). If the doc references the full-size original, point it at the right variant.
> 2. **Below-the-fold media** — lazy-loaded; uses a smaller variant; flag any block that eager-loads off-screen images.
> 3. **Image dimensions** — width/height (or `aspect-ratio`) known to prevent layout shift (CLS). Flag missing intrinsic sizing.
> 4. **Payload discipline** — count the blocks; flag sections that add weight without value (duplicate proof strips, an unused carousel, a 12-item grid that should be 6). Recommend cutting or collapsing them.
> 5. **Heavy blocks** — embeds (video, maps, third-party widgets) loaded eagerly; recommend facade/lazy patterns or removal where a lighter block conveys the same thing.
> 6. **Rich text bloat** — inline base64 images, giant pasted tables, redundant nested formatting; trim them.
> 7. **Font / icon weight** — flag blocks pulling in extra icon sets or fonts the design system doesn't already load (dev-fix).
> 8. **Request count** — many tiny media in a gallery that should be one optimized sprite/grid; flag.
>
> **Apply content fixes.** Repoint media references to the right `imageSizes` variant, mark below-the-fold blocks to lazy-load where the block exposes that option, and remove or collapse low-value sections — via `<collection>_update`, as drafts.
>
> **Report.** Estimate the win per change (e.g. "hero 1.8 MB → ~140 KB variant"), separate **fixed in draft** from **needs a developer** (missing `imageSizes` config, eager third-party embeds, font loading), and call out the single biggest LCP/payload offender.
>
> Target: «collection + document id/slug».

## Example

**Brief:** "Performance-pass the `pages` doc `pricing`."

The agent `pages_get`s the page and finds the hero references the 2400px original and the page carries two near-identical logo strips. Via `pages_update`:

```diff
blocks[hero].image: media/142 (original, 1.9 MB)
+   → repointed to the `hero` imageSizes variant (≈1280px, ~150 KB AVIF)

blocks: removed the second `logo_strip` (duplicate of block #2)
blocks[gallery]: 12 screenshots → 6, lazy-loaded
```

It reports two dev-fixes: the media collection only defines a `thumbnail` and full size (no mid-size `hero` variant for several uploads, so the right-sizing can't be applied everywhere), and an embedded demo video autoplays eagerly above the fold — recommend a click-to-load facade. Estimated saving ~2.1 MB and one fewer layout shift. Saved as drafts.

## Notes

- **Tools:** `kernel://schema`; `<collection>_get` / `<collection>_update`; the upload collection's `imageSizes` variants and `focalPoint`. See the [MCP guide](https://kernelcms.com/mcp).
- **`@kernel/image-sharp` does the resizing.** Variants exist only if the project configured `imageSizes` and installed the optional Sharp adapter. If they don't exist, the agent flags it for the developer rather than inventing a variant name.
- **The agent edits references and structure, not bytes.** It can't re-encode an image; it points the document at a better existing variant and cuts weight from the block tree.
- **Draft-only & scoped.** No publishing; in-scope fields only.
- Pair with **`image-and-media-hygiene`** and **`design-tokens-and-consistency`**.
