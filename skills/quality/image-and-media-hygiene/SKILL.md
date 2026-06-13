---
name: image-and-media-hygiene
description: Audit KernelCMS media — alt text, focal points, right-sized variants, captions, and licensing — so images render well and accessibly. Draft edits.
category: Quality
tags: [media, images, alt-text, focal-point, licensing]
difficulty: starter
---

# Image and media hygiene

**Use this when** a page's media needs cleaning up — missing or weak alt text, wrong focal point cropping faces out of the hero, the full-size original used where a variant should be, no captions, unclear licensing — and you want an agent to fix the media-side metadata across the uploads a page uses. Drafts only.

## Prompt

> You are a media editor doing hygiene on KernelCMS uploads through the access-controlled MCP tools. You write **drafts** only and touch only fields in your scope.
>
> **First, read the model and the references.** Read `kernel://schema` for the upload/media collection — expect `alt` (often `required`), maybe `focalPoint`, `caption`, `credit`/`license`, and configured `imageSizes` variants. Read the page (`<collection>_get`) to find which media docs it references, then `<collection>_get` each media doc. Use only fields the schema exposes.
>
> **Audit each image against this checklist:**
> 1. **Alt text** — present, descriptive (what the image *conveys* in context, not "image of"); ≤~125 chars; decorative images use `alt=""`; no "photo of" / filename-as-alt; complex images get a longer description in a caption.
> 2. **Focal point** — set so automated crops keep the subject (face, product, logo) in frame across variants; flag images where the default center crop loses the subject.
> 3. **Right-sized variant** — the *reference* points at an `imageSizes` variant appropriate to its placement (hero vs thumbnail), not the raw original; flag oversized originals used inline.
> 4. **Format & ratio** — aspect ratio suits the slot (16:9 hero, 1:1 avatar, 1.91:1 OG); flag mismatches that will be awkwardly cropped.
> 5. **Caption** — present where the image needs context or attribution; concise; not a duplicate of the alt text.
> 6. **Licensing / credit** — a `credit`/`license` field is filled for any third-party or stock image; flag images with unknown provenance (don't guess a license).
> 7. **Duplicates & dead refs** — the same asset uploaded multiple times, or a reference pointing at a deleted media doc; flag for cleanup.
> 8. **Filename hygiene** — descriptive, hyphenated filenames help (minor SEO); note egregiously generic ones (`IMG_4821.jpg`).
>
> **Apply** by writing `alt`, `focalPoint`, `caption`, and `credit` on the media docs, and repointing references to the right variant on the page — via `<collection>_update`, as drafts.
>
> **Report.** Per image: what you fixed and what still needs a human (unknown licensing, a missing variant the project doesn't generate, a focal point you can't verify without seeing the crop). Call out any image you'd remove (duplicate / unlicensed).
>
> Target: «the page (collection + id/slug) or a list of media ids».

## Example

**Brief:** "Media-hygiene the `pages` doc `home`."

The agent `pages_get`s the page, collects its three media references, and `media_get`s each. It finds the hero has empty `alt`, a center focal point that crops the developer out, and the reference uses the 2400px original. Via `media_update` and `pages_update`:

```diff
media (hero):
- alt:        ""
+ alt:        "A developer running `npx kernel dev`, the KernelCMS admin open beside the terminal."
- focalPoint: { x: 0.5, y: 0.5 }
+ focalPoint: { x: 0.35, y: 0.4 }   (keeps the subject in frame on the square + thumb crops)
- credit:     ""
+ credit:     "Unsplash — Jane Doe (license: Unsplash)"

pages.blocks[hero].image: → repointed from the original to the `hero` imageSizes variant
```

It reports two items for a human: a stock photo on the pricing section has no provenance recorded (flag — don't assume a license), and an avatar is 4:3 in a 1:1 slot but the project doesn't generate a square variant (dev-fix). Saved as drafts.

## Notes

- **Tools:** `kernel://schema`; the upload collection's `alt` / `focalPoint` / `caption` / `credit` fields; `<collection>_get` / `<collection>_update`; `imageSizes` variants. See the [MCP guide](https://kernelcms.com/mcp).
- **Variants come from `@kernel/image-sharp`.** Focal point and resized variants exist only if the project configured `imageSizes` and installed the Sharp adapter — otherwise the agent flags it.
- **Never guess a license.** Unknown provenance is always a human flag, never an invented credit.
- **The agent can't see the crop.** Focal-point suggestions are best-effort from subject position and flagged for visual confirmation.
- **Draft-only & scoped.** No publishing; in-scope fields only.
- Pair with **`accessibility-pass`** (alt as a11y) and **`performance-pass`** (variant right-sizing).
