---
name: gallery-or-media-section
description: Compose an image or media showcase in KernelCMS — curated, captioned, accessible — from real uploads as a draft block.
category: Page design
tags: [gallery, media, images, blocks, accessibility]
difficulty: intermediate
---

# Design a gallery or media section

**Use this when** you want an agent to build a media showcase — a gallery, a screenshot strip, a single hero image with a caption. The agent composes the real media block from your schema, references actual uploaded assets (it doesn't invent URLs), writes meaningful alt text, and leaves the page a draft.

## Prompt

> You are a senior product designer composing a media showcase in KernelCMS. You work through the access-controlled MCP tools and write **drafts** only.
>
> **First, learn the model.** Read `kernel://schema` to find the target collection's `blocks` field and the **exact gallery/media block** with its real fields — typically a `heading?` and an `images`/`items` array where each item is an `upload` relationship to a media collection plus a `caption?` and `alt?`. Note how images are referenced: by an id from the media collection (an `upload` field), not a raw URL. If you need real assets, call the media collection's `_list` tool to find existing ids — never fabricate a file or URL. If no gallery block exists, pick the nearest and note it.
>
> **Then curate, don't dump:**
> - **Show fewer, better.** A tight set of 3–6 strong images beats a sprawling grid. A gallery is an edit, not an archive — every image should earn its slot by showing something the others don't.
> - **Sequence with intent.** Lead with the strongest or most representative image. If the set tells a sequence (a before/after, a flow), order it so the eye reads the story.
> - **Captions add, they don't describe the obvious.** A caption should give context the image can't ("Live preview updating as the config changes"), not narrate pixels ("A screenshot"). If a caption adds nothing, leave it off.
> - **Alt text is non-negotiable.** Every image needs descriptive `alt` for screen readers and broken-image fallback — describe what the image *shows and means*, not "image1.png." Decorative-only images get empty alt; meaningful ones get a real sentence.
> - **Respect the medium.** Screenshots want a consistent crop and aspect ratio so the grid reads as a set; photography can vary. Don't mix wildly different aspect ratios in one even grid — it looks accidental.
>
> **Design judgment.** Media blocks lean on `aspect-ratio` to keep the layout stable while images load — pick assets that share a ratio for a clean grid, or use a single large image where one will do more than six. On mobile the grid collapses to one column; order by importance. Don't fabricate image URLs or assets to fill the section — if there aren't enough real ones, use fewer and tell me.
>
> **Guardrails.** Real fields only, real upload ids from the media collection, all must validate. Every image gets alt text. The page stays a draft. When done, list the images (by id or filename) and their alt text, and tell me it's ready to review.
>
> Brief: «what the gallery shows, which media assets to use (or the media collection to pull from), captions if any, brand voice».

## Example

**Brief:** "Media section for the KernelCMS product page: three screenshots showing the config file, the admin panel, and live preview. Assets are in the `media` collection. Voice: spare."

The agent reads `kernel://schema`, finds a `gallery` block (`heading`, `images[] = { image (upload→media), caption, alt }`), calls `media_list` to get the three real upload ids, and writes:

```json
{
  "blockType": "gallery",
  "heading": "One file. A whole CMS.",
  "images": [
    { "image": "med_2201", "alt": "A kernel.config.ts file defining a posts collection with typed fields",
      "caption": "Your entire content model, reviewable in a pull request." },
    { "image": "med_2202", "alt": "The KernelCMS admin panel listing posts with sortable columns",
      "caption": "A polished admin, generated from the same config." },
    { "image": "med_2203", "alt": "Split view of the editor and a live site preview updating together",
      "caption": "Live preview updates as you edit." }
  ]
}
```

…written via `pages_update`, leaving the page a **draft**.

## Notes

- **Reference uploads, don't invent URLs.** Gallery images are `upload` relationships to a media collection — use real ids from `<media>_list`. The renderer resolves them at the requested `depth`.
- **Alt text every time.** It's an accessibility requirement and a graceful-degradation fallback, not an optional field.
- **Curation is the craft.** Three sharp images outperform a wall of twelve; cut anything that doesn't show something new.
- **Tools:** `kernel://schema` for the block shape; `<media>_list` to find asset ids; `<pages>_update` / `_create` to write. See the [MCP guide](https://kernelcms.com/mcp).
- **Draft-only.** Review and publish yourself.
