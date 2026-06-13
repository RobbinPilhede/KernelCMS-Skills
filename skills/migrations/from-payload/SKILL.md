---
name: from-payload
description: Migrate a Payload project into KernelCMS — config-as-code collections, fields, blocks, relationships, uploads, and Lexical rich text — translated and imported.
category: Migrations
tags: [migration, payload, lexical, config-as-code]
difficulty: advanced
brand: Payload
color: '#000000'
logo: payload
---

# Migrate from Payload to KernelCMS

**Use this when** you're moving off Payload CMS and onto KernelCMS. Of every source CMS, Payload is the closest cousin: both are config-as-code, end-to-end TypeScript, and model content as `collections` + `globals` made of typed `fields`. So this migration is overwhelmingly a **clean translation**, not a re-architecture — a Payload `buildConfig({ collections })` becomes a KernelCMS `defineConfig({ collections })` with a near 1:1 field mapping, and the data copies across with a handful of well-understood conversions. The two real pieces of work are (1) the **Lexical rich text JSON → KernelCMS `richText`** conversion and (2) translating Payload's **access functions** to KernelCMS's access shape. The big win on the far side: you drop the Next.js coupling entirely — KernelCMS is a web-standard `Request → Response` server that runs in any container, with no framework welded to your CMS.

This skill has two halves you run in order: **translate the config**, then **copy the data** (as drafts you review before cutover).

## Prompt

> You are migrating a **Payload CMS** project into **KernelCMS**. Payload and KernelCMS share the same mental model — config-as-code collections/globals of typed fields — so treat this as a translation, surfacing only the genuine differences. Do it in two phases.
>
> ### Phase 1 — Translate the config
>
> Read the Payload source config (`payload.config.ts` and any imported `collections/*.ts`, `globals/*.ts`, `blocks/*.ts`). Read the KernelCMS target model first: `kernel://schema` if a kernel is running, otherwise `packages/core/src/types.ts`. Then produce a single `kernel.config.ts`:
>
> 1. **`buildConfig({ collections, globals })` → `defineConfig({ collections, globals })`.** Carry over `slug`, `labels`, `admin.useAsTitle`, `admin.defaultColumns`, `access`, `hooks`, `versions`, `auth`, and `upload` mostly verbatim — the field shapes are the same names. Add the KernelCMS-required `db` adapter (`sqliteAdapter` for the simplest start, `postgresAdapter` if you came from Payload-on-Postgres) and a `secret` from env.
> 2. **Map fields 1:1 using the table below.** Most types (`text`, `textarea`, `number`, `email`, `date`, `checkbox`, `select`, `radio`, `relationship`, `upload`, `array`, `blocks`, `group`, `row`, `tabs`, `json`, `code`, `point`) keep the same `type` string and the same core props (`name`, `required`, `unique`, `localized`, `defaultValue`, `index`, `admin.position`, `admin.condition`). Do **not** invent new shapes where Payload's already fits.
> 3. **Handle the few genuine differences explicitly** — call each one out as a comment in the generated config:
>    - **`richText` (Lexical) → `richText` (KernelCMS).** Same field type, **different stored format**. Payload stores a Lexical `editorState` tree; KernelCMS stores its own normalized `{ v:1, type:'doc', children:[...] }` tree. The *field* translates trivially (`{ name, type:'richText' }`); the *data* converts in Phase 2. If the Payload field had a feature list, map it to a KernelCMS `preset` (`'minimal' | 'standard' | 'full'`) or an explicit `features` array.
>    - **Access functions.** Payload access fns receive `({ req: { user }, id, data, siblingData, doc })` and return a boolean **or a Where**. KernelCMS access fns receive `({ req, id, data })` where `req` is `{ user, locale, ... }` (so it's `req.user`, not `req.req.user`), and return the same boolean-or-`Where`. Rewrite each rule to the KernelCMS arg shape — the *logic* is identical, only the destructuring changes. Field-level `access` ({ read, create, update }) carries over the same way.
>    - **No Next.js / no `@payloadcms/*` framework deps.** Drop `@payloadcms/richtext-lexical`, `@payloadcms/db-mongodb`/`-postgres`, `@payloadcms/next`, `admin.importMap`, and any `serverURL` tied to a Next route. KernelCMS ships its own admin, REST, GraphQL, and DB adapters — none of that infrastructure config moves.
>    - **Polymorphic relations.** `relationTo: ['posts', 'pages']` is supported verbatim; values are stored/returned as `{ relationTo, value }` on both sides.
>    - **`upload: true` collections.** Carry the collection's `upload` config; KernelCMS injects the same system fields (`filename`, `mime_type`, `filesize`, `url`, …). Map Payload `imageSizes` to KernelCMS `upload.imageSizes`, and configure a `storage` adapter + `image` processor at the top level.
>
> Show the translated `kernel.config.ts` and a short list of every field that needed more than a verbatim copy, before touching data.
>
> ### Phase 2 — Copy the data (as drafts)
>
> Pull content out of Payload, convert the few non-portable shapes, and import into KernelCMS as **drafts** the human reviews before cutover. You can only write fields inside your `fieldScope`; you cannot publish.
>
> 1. **Export each collection from Payload.** Use the Local API (`payload.find({ collection, depth: 0, limit: 0 })`) inside a small Node script, or the REST API (`GET /api/<collection>?depth=0&limit=100&page=N`, paginate to the end). Use `depth: 0` so relationships come back as raw IDs (not nested docs) — you want the IDs to re-wire, not duplicated documents. Pull `globals` via `payload.findGlobal({ slug })` / `GET /api/globals/<slug>`.
> 2. **Convert the non-portable fields per row:**
>    - **Lexical `richText` → KernelCMS `richText`.** Walk the Lexical `editorState.root.children`. Map node `type`: `paragraph`→`paragraph`, `heading`(`tag:'h2'..'h4'`)→`heading`(`level`), `list`(`listType:'number'`)→`list`(`ordered`), `listitem`→`listItem`, `quote`→`quote`, `code`→`codeBlock`, `horizontalrule`→`hr`, `link`→`link` (carry `fields.url`/`newTab`; an internal `doc` link → `{ relationTo, value }`), `upload`→`upload`, `relationship`→`relationship`, `block`→`block` (`{ blockType, data }`). For each Lexical **text** node, decode the `format` **bitmask** into KernelCMS marks: `1`=bold, `2`=italic, `4`=strikethrough(`strike`), `8`=underline, `16`=code, `32`=subscript(`sub`), `64`=superscript(`sup`). Combined formats are bitwise-OR'd (e.g. `3` = bold+italic). The simplest robust path: render the Lexical tree to HTML, then feed it to KernelCMS's `fromHTML()` importer (it already handles paragraphs, headings, lists, quotes, code, hr, links, and the bold/italic/underline/strike/code/sub/sup marks). Hand-walk the tree only when you need to preserve blocks/uploads/relationships embedded in the rich text.
>    - **`blocks` field → KernelCMS `blocks`.** Near-identical. Payload stores each block as `{ blockType, blockName?, ...fields }`; KernelCMS stores `{ blockType, ...fields }`. Keep `blockType` (it equals the block `slug`); drop or fold `blockName`; recurse into each block's own fields (a block may itself contain `richText` to convert).
>    - **Relationships & uploads.** With `depth: 0` these are IDs (or `{ relationTo, value }` for polymorphic). Re-map every source ID to the new KernelCMS ID via the id-map you keep (below). For uploads, create the media document in the target upload collection first (re-upload the binary or carry the URL), then point the reference at the new id.
> 3. **Import in dependency order, as drafts.** Create referenced collections first (authors, categories, **media/upload** collections), then the documents that point at them, keeping a `payloadId → kernelId` table per collection so relationship and upload fields resolve. Two paths:
>    - **Agent-over-MCP** (reviewable, transform-as-you-go): call `<collection>_create` per row with the converted payload. Every row lands as a draft attributed to the agent. Preserve the source `slug`/`id` field where the target has one so URLs survive.
>    - **CLI bulk** (`npx kernel import --file <export.json>`): for a large trusted one-shot, emit a `{ "<slug>": [rows] }` JSON file (with rich text already converted) and import server-side. Faster, but it is a human/CLI action and is **not** draft-gated — rows land as written.
> 4. **Report.** Per collection: rows created (with ids), rows skipped/flagged and why, fields that had no target home, and any rich-text nodes that didn't convert cleanly. Tell the human to filter the admin to `createdByType: agent` drafts, spot-check rich text / blocks / relationships / images, then publish. Migration completes when a human publishes — not when you finish creating.
>
> Source: «path to the Payload config, the DB (Mongo/Postgres) or a REST base URL + API key, and the collections/globals to migrate».

## Mapping

Payload → KernelCMS field types. The headline is how little changes — almost every `type` string and its core props are identical.

| Payload field | KernelCMS field | Notes |
| --- | --- | --- |
| `text` | `text` | Identical. `minLength`/`maxLength`/`pattern` carry over. |
| `textarea` | `textarea` | Identical. |
| `email` | `email` | Identical. |
| `number` | `number` | `min`/`max` carry; add `integer` if needed. |
| `date` | `date` | Identical (ISO string). |
| `checkbox` | `checkbox` (or `boolean`) | Identical. |
| `select` | `select` | `options` (string or `{label,value}`), `hasMany` carry. |
| `radio` | `radio` | Identical. |
| `code` | `code` | Modeled as a `text`-family type in KernelCMS. |
| `json` | `json` | Identical. |
| `point` | `point` | Identical (geo). |
| `relationship` | `relationship` | `relationTo` (string **or array** for polymorphic), `hasMany` carry. KernelCMS adds `onDelete: 'setNull'\|'cascade'\|'restrict'`. |
| `upload` | `upload` | `relationTo` points at an upload collection. Same shape. |
| `array` | `array` | `fields` (recurse), `minRows`/`maxRows` carry. |
| `group` | `group` | `fields` (recurse). Named group → keyed object, same as Payload. |
| `blocks` | `blocks` | `blocks: [{ slug, fields }]` → same; data is `{ blockType, ...fields }`. **Drop `blockName`.** |
| `row` | `row` | Presentational; `fields` carry. |
| `tabs` (named) | `tabs` | `tabs: [{ label, fields }]`. KernelCMS named-tab grouping via `admin.tab` is also available. |
| `collapsible` | `group` or `admin.section` | No dedicated collapsible; nest as a group or use a sidebar section. |
| `ui` | `ui` | Custom admin slot; re-point `component` to a `window.KernelCMS.fields[key]`. |
| `richText` (Lexical) | `richText` | **Same field, different stored JSON.** Field is a verbatim `{ name, type:'richText' }`; **data converts** (Lexical tree → KernelCMS `doc` tree). Map the Payload feature/preset to a KernelCMS `preset`/`features`. |
| virtual (`virtual: true` + hook / `virtual: 'rel.path'`) | `virtual: true` + `compute({ doc, req })` | KernelCMS computes via a single `compute` fn (read-derived, or stored if you drop `virtual`). |
| join (reverse rel) | `join` (`{ type:'join', collection, on }`) | Same concept — a virtual reverse relationship. |

Collection/global-level: `slug`, `labels`, `admin.useAsTitle`, `admin.defaultColumns`, `admin.group`, `access`, `hooks` (`beforeChange`/`afterChange`/`afterRead`/`beforeDelete`/`afterDelete` — same names), `auth: true`, `upload`, and `versions: { drafts: true }` all carry over by name. The differences live only in **access fn arg shape**, **rich text data format**, and **dropped framework/DB infra config**.

## Example

A Payload `posts` doc, fetched at `depth: 0` (relationships as IDs), with a Lexical `body` and a `layout` blocks field:

```json
{
  "id": "664f...a1",
  "title": "Hello world",
  "slug": "hello-world",
  "author": "661a...09",
  "body": {
    "root": {
      "type": "root", "direction": "ltr", "format": "", "indent": 0, "version": 1,
      "children": [
        { "type": "heading", "tag": "h2", "version": 1, "children": [
          { "type": "text", "text": "Welcome", "format": 0, "mode": "normal",
            "style": "", "detail": 0, "version": 1 } ] },
        { "type": "paragraph", "version": 1, "children": [
          { "type": "text", "text": "This is ", "format": 0, "version": 1 },
          { "type": "text", "text": "bold and italic", "format": 3, "version": 1 },
          { "type": "text", "text": ".", "format": 0, "version": 1 } ] }
      ]
    }
  },
  "layout": [
    { "blockType": "cta", "blockName": "Top CTA", "heading": "Sign up", "url": "/join" }
  ],
  "_status": "published",
  "createdAt": "2026-01-04T10:00:00.000Z",
  "updatedAt": "2026-01-04T10:00:00.000Z"
}
```

Converts to the KernelCMS create payload (note `format: 3` decoding to `bold` + `italic` marks, and `blockName` dropped). Imported as a **draft** — `_status` is set by the human at publish:

```json
{
  "title": "Hello world",
  "slug": "hello-world",
  "author": "<kernelId for 661a...09 from the id-map>",
  "body": {
    "v": 1, "type": "doc",
    "children": [
      { "type": "heading", "level": 2, "children": [ { "type": "text", "text": "Welcome" } ] },
      { "type": "paragraph", "children": [
        { "type": "text", "text": "This is " },
        { "type": "text", "text": "bold and italic", "marks": [ { "type": "bold" }, { "type": "italic" } ] },
        { "type": "text", "text": "." }
      ] }
    ]
  },
  "layout": [
    { "blockType": "cta", "heading": "Sign up", "url": "/join" }
  ]
}
```

The field *model* (`{ name:'body', type:'richText' }`, `{ name:'layout', type:'blocks', blocks:[...] }`) is a straight copy from the Payload config; only the *values* are transformed.

## Notes

- **Lexical is the one real conversion.** Everything else is a rename or a verbatim copy. Decode the text `format` bitmask (`1` bold, `2` italic, `4` strike, `8` underline, `16` code, `32` sub, `64` sup; combine by bitwise-OR) into KernelCMS `marks`, and map node types per Phase 2. The pragmatic shortcut is Lexical→HTML→`fromHTML()` (in `@kernel/richtext`), which already normalizes and sanitizes the common subset; hand-walk only to preserve embedded `block`/`upload`/`relationship` nodes. An empty Lexical value (a single empty paragraph, or `null`) maps to KernelCMS `emptyRichText()`.
- **`blocks` is almost free.** Payload `{ blockType, blockName?, ...fields }` → KernelCMS `{ blockType, ...fields }`. `blockType` equals the block `slug` on both sides, so the page builder survives intact — just drop `blockName` and recurse into nested rich text.
- **Polymorphic relations carry verbatim.** `relationTo: ['a','b']` and the `{ relationTo, value }` value shape are native to KernelCMS. Re-map the `value` IDs through your id-map; keep the `relationTo` tag.
- **You can drop Next.js (the win).** Payload welds its admin and routes into a Next.js app; the migration lets you delete `@payloadcms/next`, the `importMap`, and the route plumbing. KernelCMS serves its own admin, REST, GraphQL, and OpenAPI from a single web-standard server in any container — no framework owns your CMS.
- **Fetch at `depth: 0`.** Pulling relationships as IDs (not populated docs) keeps the export flat and lets you re-wire references through the id-map instead of duplicating documents.
- **Draft-only safety.** Agent imports land as reviewable drafts attributed to `createdByType: agent`; a botched run is a pile of drafts, never a broken live site. Lifecycle/ownership fields (`_status`, unscoped `author`) are stripped from agent writes and assigned at the human publish step.
- **Cross-links:** the generic **`migrate-content-from-another-cms`** workflow (map-before-import, dependency order, id-map) underpins Phase 2; **`scope-an-agent-safely`** for `fieldScope`; **`review-agent-drafts`** for the cutover gate. For content modeling on the target side, see the **content-modeling** skills.
