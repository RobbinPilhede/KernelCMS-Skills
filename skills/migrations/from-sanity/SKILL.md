---
name: from-sanity
description: Migrate a Sanity project into KernelCMS — documents, references, image assets, and Portable Text — mapped field-by-field and imported as drafts.
category: Migrations
tags: [migration, sanity, portable-text, groq]
difficulty: advanced
brand: Sanity
color: '#F03E2F'
logo: sanity
---

# Migrate from Sanity to KernelCMS

**Use this when** you're moving a Sanity Content Lake dataset into KernelCMS and want an agent to do the real work: export the dataset, parse the NDJSON, map every `_type` to a collection and every field to a KernelCMS field, convert Portable Text to `richText`, turn `_ref` values into relationships, pull image/file assets into an upload collection, and land everything as **reviewable drafts**. Sanity's model (schemaless-at-rest documents, references by `_id`, the `drafts.` prefix, asset documents with deterministic IDs, Portable Text as block JSON) maps cleanly to KernelCMS once you know the rules below — this skill encodes them so the agent doesn't guess.

Nothing publishes. The agent creates drafts; a human reviews and publishes.

## Prompt

> You are migrating a **Sanity** project into **KernelCMS** through the access-controlled MCP tools. Everything you create is a **draft** — a human reviews and publishes after you finish. You may only write fields inside your `fieldScope`.
>
> ### 1. Export the Sanity dataset
> Have the operator run, against their Sanity project:
> ```bash
> npx sanity dataset export <dataset> ./sanity-export.tar.gz
> # or, to keep draft documents too:
> npx sanity dataset export <dataset> ./sanity-export.tar.gz --drafts
> ```
> Untar it: `tar -xzvf sanity-export.tar.gz`. You get:
> ```
> data.ndjson      # one JSON document per line (NDJSON)
> images/          # binary image assets, filename = <assetId>.<ext>
> files/           # binary non-image assets (pdf, video, …)
> ```
> If they can't export, you can pull the same documents over the API with GROQ
> (`*[!(_id in path('drafts.**'))]` for published only), but the `.tar.gz` is preferred because it ships the asset binaries.
>
> ### 2. Parse the NDJSON and inventory the model
> Sanity is schemaless at rest — the **data** is the source of truth, not a schema file. Stream `data.ndjson` and group by `_type`:
> - Skip system/asset docs for now: `sanity.imageAsset`, `sanity.fileAsset`.
> - For each content `_type`, sample 20–50 docs and infer the field set: name, JS type, whether it's an array, an object (`_type` other than the document type), a `reference` (`{_type:'reference', _ref}`), a `slug` (`{_type:'slug', current}`), an `image`/`file` (`{_type:'image', asset:{_ref}}`), or Portable Text (an **array of `{_type:'block'}` objects**, possibly mixed with custom blocks).
> - **Drafts:** any `_id` starting with `drafts.` is an unpublished draft of the published doc with the same id sans-prefix. Decide with the operator: migrate published only (default), or fold drafts in. Strip the `drafts.` prefix when you key documents so a draft and its published twin don't both import.
> - **Localization:** detect the pattern. Field-level i18n stores localized objects like `{_type:'localeString', en:'…', sv:'…'}` or `{en, sv}`; document-level i18n (the `@sanity/document-internationalization` plugin) stores one document per locale with a shared `__i18n_base` ref and a `language` field. Identify which is in play before mapping.
>
> ### 3. Propose the `_type` → collection map and a field-by-field map — show it BEFORE importing
> Read `kernel://schema` and `kernel://collections/<slug>` for the target model. Then produce **two tables** and get sign-off:
>
> **Document type map:** each Sanity `_type` → a KernelCMS collection slug (existing, or one to add to `kernel.config.ts`). `sanity.imageAsset`/`sanity.fileAsset` → an **upload collection** (e.g. `media`).
>
> **Field map** (per type): `source field → target field`, with the transform. Use the **Mapping** table below as the rule set. Flag every source field with **no** target home and every required target field with **no** source — those are decisions, not defaults. Call out Portable Text fields, `reference` fields (and whether each is weak — `_weak:true`), and `image`/`file` fields explicitly.
>
> ### 4. Convert the hard parts
> - **Portable Text → `richText`.** Walk the block array. `{_type:'block'}` → map `style` (`normal`→paragraph, `h1..h4`→heading level 2–4 clamped, `blockquote`→quote); each `children` span's `marks` → KernelCMS marks (`strong`→bold, `em`→italic, `underline`, `strike-through`→strike, `code`); a mark that's a `_key` into `markDefs` is an **annotation** — a `{_type:'link', href}` becomes a `link` node (internal `{_type:'reference',_ref}` links become a `link` with `doc:{relationTo,value}`). `listItem:'bullet'|'number'` + `level` → nested `list`/`listItem`. **Custom blocks** inside the array (e.g. an inline `{_type:'image', asset}` or a callout) → an `upload` node or a rich-text `block` embed if the target collection defines a matching block; otherwise flag it. The pragmatic path: serialize Portable Text to HTML/Markdown with `@portabletext/to-html`, then feed it to KernelCMS's `fromHTML`/`fromMarkdown` (in `@kernel/richtext`) which emit a normalized, sanitized `richText` doc — but you lose embedded refs/assets that way, so handle those before serializing.
> - **`_ref` → relationship.** A `{_type:'reference', _ref:'<id>'}` points at another document's `_id`. Resolve it through your **source-id → new-id** table to the KernelCMS document id and write the target's relationship field. Strip any `drafts.` prefix on the `_ref` first (refs always point at the published id). For a **polymorphic** target (`relationTo: ['a','b']`) write `{ relationTo, value }`.
> - **`image`/`file` → upload.** For each `{_type:'image', asset:{_ref:'image-…'}}`, find the `sanity.imageAsset` doc with that `_id`, locate its binary in `images/` (or fetch its `url`), create a record in the upload collection, and set the relationship/upload field to the new id. Carry `alt`, `caption`, and the focal point (Sanity `hotspot`/`crop`) into upload fields where the target has them. Asset `_id`s are deterministic (`image-<hash>-<w>x<h>-<ext>`), so dedupe on them — one upload record per asset, reused across documents.
>
> ### 5. Import in dependency order, as DRAFTS
> Create leaf/referenced collections first so relationships resolve: **assets → authors/categories/taxonomy → documents**. Keep the source-id → new-id table as you go. For each row call `<collection>_create` with the mapped, validated payload. Preserve the Sanity `slug.current` into the target `slug` so URLs survive. You **cannot** set `_status: 'published'` — agents are draft-only; the engine rejects it.
>
> *(Alternatively, for a large trusted one-shot, the operator can transform the NDJSON into a `{ "<slug>": [rows] }` JSON and run `npx kernel import --file data.json` server-side — faster, but not draft-gated. Use the agent path for reviewed, transform-as-you-go migrations.)*
>
> ### 6. Report
> Output: rows created per collection (with ids), assets imported/deduped, rows skipped or flagged (and why — missing binary, unmapped custom block, dangling `_ref`, unsatisfied required field), and the unresolved-mapping list. Tell the human to filter drafts to `createdByType: agent`, spot-check Portable Text rendering, relationships, and images, then publish in the admin. **Migration completes when a human publishes — not when you finish creating.**
>
> Source: «Sanity project/dataset, the export location (`.tar.gz` path), and which `_type`s to migrate».

## Mapping

| Sanity concept | Shape in the export | KernelCMS equivalent |
| --- | --- | --- |
| Document type | `{ _type:'post', _id, _rev, _createdAt, _updatedAt, … }` | A **collection** (`slug: 'posts'`). `_id`→keep as source key; KernelCMS mints its own id. `_rev`/`_createdAt`/`_updatedAt` → drop (KernelCMS sets `timestamps`). |
| `string` / `text` | `"…"` | `text` / `textarea` |
| `number`, `boolean`, `datetime`/`date` | `42`, `true`, `"2026-01-01T…Z"` | `number`, `boolean`, `date` |
| `slug` | `{ _type:'slug', current:'my-post' }` | `slug` field ← `value.current` |
| `reference` (strong) | `{ _type:'reference', _ref:'<docId>' }` | `relationship` (`relationTo` = target collection); resolve `_ref` via id map |
| `reference` (weak) | `{ _type:'reference', _ref, _weak:true }` | `relationship`; **may dangle** — import even if target is missing, or flag |
| polymorphic / multi-type ref | several `reference`s to different `_type`s | `relationship` with `relationTo: ['a','b']`, value `{ relationTo, value }` |
| array of references | `[{_ref}, {_ref}, …]` | `relationship` with `hasMany: true` |
| `image` | `{ _type:'image', asset:{_ref:'image-…'}, hotspot, crop, alt }` | `upload` field → record in an **upload collection**; carry `alt`/focal point |
| `file` | `{ _type:'file', asset:{_ref:'file-…'} }` | `upload` field (non-image upload collection) |
| `sanity.imageAsset` / `sanity.fileAsset` doc | `{ _id:'image-…', url, originalFilename, mimeType, metadata:{dimensions,…} }` | One row in the **upload collection**; binary from `images/`/`files/` or `url`. Dedupe on `_id`. |
| Portable Text | array of `{_type:'block', style, children:[{_type:'span', text, marks}], markDefs}` + custom blocks | `richText` (KernelRichText: `{v:1, type:'doc', children:[…]}`) |
| inline object / nested object | `{ _type:'seo', title, … }` (no `_id`) | `group` field (or `array` of `blocks` if repeatable) |
| array of objects | `[{ _type:'feature', … }]` | `array` field, or `blocks` if heterogeneous `_type`s |
| field-level locale object | `{ _type:'localeString', en:'…', sv:'…' }` | one field with `localized: true`; write per-locale values |
| document-level i18n | one doc per locale + `language` + shared base ref | merge into one localized doc, or one doc per locale — decide with operator |
| `drafts.<id>` document | `_id` prefixed `drafts.` | a KernelCMS **draft** (or skip if migrating published-only) — strip the prefix when keying |

**Portable Text mark/style → KernelCMS richText**

| Portable Text | KernelRichText node |
| --- | --- |
| `style: 'normal'` | `{ type:'paragraph' }` |
| `style: 'h1'..'h4'` (and `h5`/`h6`) | `{ type:'heading', level }` (clamped to 2–4) |
| `style: 'blockquote'` | `{ type:'quote' }` |
| `listItem: 'bullet' \| 'number'` + `level` | nested `{ type:'list', ordered }` / `{ type:'listItem' }` |
| span `marks: ['strong'\|'em'\|'underline'\|'strike-through'\|'code']` | `marks: [{type:'bold'\|'italic'\|'underline'\|'strike'\|'code'}]` |
| `markDefs` `{_type:'link', href}` referenced by a span mark `_key` | `{ type:'link', url }` wrapping the run |
| `markDefs` internal link `{_type:'reference',_ref}` | `{ type:'link', doc:{ relationTo, value } }` |
| inline custom block `{_type:'image', asset}` | `{ type:'upload', relationTo, value, alt }` |

## Example

A Sanity `data.ndjson` (two lines shown — one asset, one document):

```ndjson
{"_id":"image-Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000-jpg","_type":"sanity.imageAsset","url":"https://cdn.sanity.io/images/p1/production/Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000.jpg","originalFilename":"cover.jpg","mimeType":"image/jpeg","metadata":{"dimensions":{"width":2000,"height":3000}}}
{"_id":"9a1c…","_type":"post","_createdAt":"2026-01-04T10:00:00Z","title":"Hello world","slug":{"_type":"slug","current":"hello-world"},"author":{"_type":"reference","_ref":"author-42"},"cover":{"_type":"image","asset":{"_ref":"image-Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000-jpg"},"alt":"A cover"},"body":[{"_type":"block","style":"normal","markDefs":[{"_key":"l1","_type":"link","href":"https://kernelcms.com"}],"children":[{"_type":"span","text":"See ","marks":[]},{"_type":"span","text":"the docs","marks":["strong","l1"]},{"_type":"span","text":".","marks":[]}]}]}
```

**Step order:** import the asset → `media_create` (binary from `images/Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000.jpg`), giving id `med_01`. Import `author-42` → `authors_create`, giving id `auth_07`. Then the post:

```jsonc
// posts_create payload  (author resolved via id map; cover → upload; body → richText)
{
  "title": "Hello world",
  "slug": "hello-world",
  "author": "auth_07",
  "cover": "med_01",
  "body": {
    "v": 1,
    "type": "doc",
    "children": [
      { "type": "paragraph", "children": [
        { "type": "text", "text": "See " },
        { "type": "link", "url": "https://kernelcms.com", "children": [
          { "type": "text", "text": "the docs", "marks": [{ "type": "bold" }] }
        ]},
        { "type": "text", "text": "." }
      ]}
    ]
  }
}
```

Lands as a **draft**. No `_status`, no `_rev`, no `_createdAt` — the engine owns those.

## Notes

- **Portable Text is the deep end.** Marks split into **decorators** (`strong`, `em` — flat strings) and **annotations** (a `_key` pointing into `markDefs` — links, internal refs, footnotes). A span can carry several marks at once; preserve order and don't drop the `markDefs` lookup. Custom blocks live **inside** the same array as text blocks — an `{_type:'image'}` between paragraphs is common. The HTML/Markdown round-trip via `@portabletext/to-html` + KernelCMS `fromHTML`/`fromMarkdown` is the fast path, but it flattens embedded references and assets — extract those first, or walk the tree directly for fidelity.
- **Asset URLs and binaries.** Asset `_id`s are deterministic (`image-<hash>-<w>x<h>-<ext>`); the `.tar.gz` puts the binary in `images/`/`files/`. If you only have the NDJSON, the `sanity.imageAsset.url` (`https://cdn.sanity.io/images/<project>/<dataset>/<asset>.<ext>`) is fetchable. **Dedupe on the asset `_id`** — many documents reference one asset; create one upload record and reuse it.
- **Weak refs.** A `_weak:true` reference is allowed to dangle. Don't fail the row if its target is missing — import and flag, or set null, depending on the target field's `onDelete`. Note Sanity may *strengthen* weak refs on publish, so an exported published doc can hold a now-strong ref.
- **Drafts and the prefix.** `drafts.<id>` and `<id>` are the same logical document. Strip `drafts.` when keying so you don't import both; `_ref` values already point at the published (un-prefixed) id.
- **GROQ projections** can pre-shape data before export to save transform work — e.g. dereference refs (`author->{name}`) or flatten a slug (`"slug": slug.current`). Useful when pulling over the API instead of the `.tar.gz`, but the file export is preferred for the asset binaries.
- **Tools:** `kernel://schema` + `kernel://collections/<slug>` (target model); `<collection>_create` per row; `<collection>_list` / `_count` for idempotency on re-runs; `@kernel/richtext` `fromHTML`/`fromMarkdown` for the Portable Text round-trip; `@portabletext/to-html` (Sanity side) to serialize blocks.
- See **`migrate-content-from-another-cms`** for the general multi-CMS pattern this specializes, and hand off to **`review-agent-drafts`** for the publish/cutover gate.
