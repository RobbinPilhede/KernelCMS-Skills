---
name: from-contentful
description: Migrate a Contentful space into KernelCMS — content types, entries, assets, per-locale fields, and Rich Text — mapped and imported as drafts.
category: Migrations
tags: [migration, contentful, rich-text, localization]
difficulty: advanced
brand: Contentful
color: '#2478CC'
logo: contentful
---

# Migrate from Contentful to KernelCMS

**Use this when** you are moving a Contentful space onto KernelCMS and want every
content type, entry, asset, locale, and Rich Text body mapped and imported as
reviewable **drafts** — never a live cutover. Contentful's export is a single JSON
file with a model that does not line up one-to-one with KernelCMS: fields are keyed
by id *and then by locale*, references are typed `Link` stubs you must resolve in
order, and bodies are a Rich Text abstract syntax tree, not HTML. This skill makes
those three hard parts explicit and turns them into a deterministic mapping.

The whole import lands as drafts. An agent over MCP physically cannot publish, so a
botched run is a pile of drafts you discard — never a broken site. Cutover is a
human's publish step.

## Prompt

> You are migrating a Contentful space into KernelCMS. Everything you create is a
> **draft** scoped to the collections and fields you are given. Do not publish. Do
> not guess a mapping — surface every gap.
>
> **1. Export and parse.** Take the file from `contentful space export` (CMA-backed).
> It has top-level `contentTypes`, `entries`, `assets`, and `locales` (also `tags`,
> `webhooks`, `roles`, `editorInterfaces` — ignore those). Read `locales` first: note
> the `default: true` locale code (e.g. `en-US`) and every other code, because **every
> entry/asset field value is keyed by locale**. Read `contentTypes` for the field
> definitions (each field has `id`, `type`, `localized`, `required`, `validations`,
> and for links a `linkType`). Read `entries`/`assets` for the data.
>
> **2. Learn the target model.** Read `kernel://schema` and each
> `kernel://collections/<slug>` descriptor. List target fields, types, required, and
> which are in your `fieldScope`.
>
> **3. Propose content-type → collection + field map — show it before importing.**
> One table per content type: `Contentful field (id, type) → KernelCMS field (name,
> type)`, with the transform. Map Rich Text → `richText`, Entry `Link` →
> `relationship`, Asset `Link` → `upload`, and every `localized: true` field → a
> KernelCMS `localized` field. Flag every Contentful field with no target home and
> every required target field with no source. **Contentful allows up to 50 fields per
> content type** — if a type is near that, confirm the target collection covers what
> you keep. Get sign-off before creating anything.
>
> **4. Import in dependency order.** Assets first (so uploads resolve), then leaf
> content types, then types that reference them. Keep two id maps: `cfAssetId →
> kernelUploadId` and `cfEntryId → kernelDocId`. Preserve the Contentful `sys.id` or a
> slug field where possible so URLs survive. Resolve every `Link` through these maps;
> if a target is not yet imported, defer the row or null the ref and flag it.
>
> **5. Convert the messy values explicitly.**
> - **Per-locale fields.** Contentful stores `fields.title = { "en-US": "Hi", "da-DK":
>   "Hej" }`. For a `localized` KernelCMS field, write the default-locale value on the
>   base create, then write each other locale through its own localized write (or the
>   `kernel import` per-locale rows). For a **non-localized** target, take only the
>   default locale and flag the dropped translations.
> - **Rich Text.** Convert the Contentful AST (`nodeType: 'document'` root) into the
>   KernelCMS `{ v:1, type:'doc', children:[...] }` tree node-by-node (see Notes). Do
>   not paste HTML into a plain field.
> - **Links inside Rich Text.** `embedded-entry-block`/`-inline` → resolve via the
>   entry map; `embedded-asset-block` → resolve via the asset map; `entry-hyperlink`/
>   `asset-hyperlink` → internal link doc; `hyperlink` → plain URL link.
> - **Assets.** A Contentful asset's `file` is keyed by locale too. Fetch the binary
>   from `file['en-US'].url` (prefix `https:` — Contentful returns protocol-relative
>   `//...` URLs), upload it to the target upload collection, carry `title`/
>   `description` → `alt`/`caption`, and record the new id.
>
> **6. Report.** Rows created per collection with ids, rows skipped/flagged and why,
> the unresolved-mapping list, and dropped translations. Tell the human to review the
> drafts (filter `createdByType: agent`), spot-check a localized entry and a Rich Text
> body, then publish in the admin. Migration completes when a human publishes.
>
> Source: «the export JSON location, the space's locales, and which content types to
> migrate».

Two import paths share this mapping. **Agent-over-MCP** (`<slug>_create` per row)
gives reviewable, draft-gated, transform-as-you-go imports — the default here.
`npx kernel import --file <export.json>` is the CLI bulk path for a portable
`{ "<slug>": [rows] }` shape: faster for a trusted one-shot, but it is a human/CLI
action and is not draft-gated, so rows land as written. You can combine them — CLI
for the bulk, agent for the tricky transforms.

## Mapping

The default locale is the locale marked `default: true` in the export's `locales`
array (commonly `en-US`). "Localized?" follows the Contentful field's `localized`
flag straight onto the KernelCMS field's `localized`.

| Contentful field type | KernelCMS field / `type` | Notes |
| --- | --- | --- |
| `Symbol` (short string ≤256) | `text` | `validations[].size` → `minLength`/`maxLength`; `validations[].regexp` → `pattern`. |
| `Symbol` with `in` validation | `select` (`options`) | The `in` array becomes the option list; add `hasMany` if it is inside an `Array`. |
| `Text` (long ≤50k, searchable) | `textarea` | Use the collection's `search.fields` for full-text, not the field type. |
| `RichText` | `richText` | Convert the AST (see Example + Notes). Pick `preset`/`features` to cover the marks/blocks you keep. |
| `Integer` | `number` + `integer: true` | `validations[].range` → `min`/`max`. |
| `Number` (decimal) | `number` | `validations[].range` → `min`/`max`. |
| `Boolean` | `boolean` | — |
| `Date` (ISO 8601) | `date` | Keep the ISO string; date-only Contentful values stay date-only. |
| `Location` (`{ lat, lon }`) | `point` | Contentful gives `{ lat, lon }`; KernelCMS point stores the coordinate pair. |
| `Object` (arbitrary JSON) | `json` | Pass through verbatim. |
| `Link`, `linkType: Entry` | `relationship` (`relationTo`) | Resolve `sys.id` via `cfEntryId → kernelDocId`. |
| `Link`, `linkType: Asset` | `upload` (`relationTo: 'media'`) | Resolve `sys.id` via `cfAssetId → kernelUploadId`. |
| `Array` of `Symbol` | `select` + `hasMany`, or `json` | `select` when an `in` validation enumerates values; else `json`. |
| `Array` of `Link` (Entry) | `relationship` + `hasMany` | Resolve each `sys.id`. Mixed link targets → polymorphic `relationTo: [...]`. |
| `Array` of `Link` (Asset) | `upload` + `hasMany` | Resolve each asset id. |
| any field, `localized: true` | same target + `localized: true` | Import per-locale values; see Notes. |
| Contentful **Asset** (entity) | a row in an `upload` collection | `file.url` → binary; `title` → `alt`; `description` → `caption`. |
| `sys.id` (entry/asset id) | a `text` `slug`/external-id field | Preserve for stable URLs and for the id maps. |

Contentful has no native draft/publish *field* — status lives in `sys`
(`publishedVersion`, `publishedAt`). Do **not** map it onto KernelCMS `_status`: every
imported row is a draft regardless, and a human sets published state at cutover.

## Example

A Contentful `blogPost` entry from the export, with a localized title, an Entry link
(`author`), an Asset link (`heroImage`), and a Rich Text `body`:

```json
{
  "sys": { "id": "3xKpQ2", "type": "Entry",
           "contentType": { "sys": { "id": "blogPost", "linkType": "ContentType" } } },
  "fields": {
    "title": { "en-US": "Hello world", "da-DK": "Hej verden" },
    "slug":  { "en-US": "hello-world" },
    "author":    { "en-US": { "sys": { "type": "Link", "linkType": "Entry", "id": "auth_99" } } },
    "heroImage": { "en-US": { "sys": { "type": "Link", "linkType": "Asset", "id": "asset_7" } } },
    "body": { "en-US": {
      "nodeType": "document", "data": {}, "content": [
        { "nodeType": "paragraph", "data": {}, "content": [
          { "nodeType": "text", "value": "Read ", "marks": [], "data": {} },
          { "nodeType": "text", "value": "this", "marks": [{ "type": "bold" }], "data": {} }
        ]},
        { "nodeType": "embedded-asset-block",
          "data": { "target": { "sys": { "type": "Link", "linkType": "Asset", "id": "asset_7" } } },
          "content": [] }
      ]
    }}
  }
}
```

After the asset (`asset_7 → media id "m_42"`) and author (`auth_99 → "doc_auth_3"`)
are imported, this becomes a `posts_create` payload — default locale on the base
write, then a second localized write for `da-DK`:

```jsonc
// posts_create (base = default locale en-US)
{
  "title": "Hello world",
  "slug": "hello-world",
  "author": "doc_auth_3",       // Entry Link → relationship, resolved
  "hero": "m_42",               // Asset Link → upload, resolved
  "body": {                     // Contentful AST → KernelCMS richText
    "v": 1, "type": "doc", "children": [
      { "type": "paragraph", "children": [
        { "type": "text", "text": "Read " },
        { "type": "text", "text": "this", "marks": [{ "type": "bold" }] }
      ]},
      { "type": "upload", "relationTo": "media", "value": "m_42" }
    ]
  }
}

// then, for the non-default locale, a localized write on the same doc:
// posts_update { id: <new>, locale: "da-DK", data: { title: "Hej verden" } }
```

`slug` here has no `da-DK` value in the source, so the base value stands for both
locales. `title` does, so it gets a per-locale write. The empty `marks: []` on the
first text run is simply dropped (omit `marks` when empty).

## Notes

- **Rich Text node map.** Walk the AST from the single `document` root. Block nodes:
  `paragraph` → `paragraph`; `heading-1..6` → `heading` with `level` clamped to the
  target's allowed set (KernelCMS headings are `2|3|4` — `heading-1` usually maps to
  the page title or `level: 2`); `unordered-list`/`ordered-list` → `list` with
  `ordered` true/false, children `list-item` → `listItem`; `blockquote` → `quote`;
  `hr` → `hr`. Tables (`table`, `table-row`, `table-cell`, `table-header-cell`) and
  `embedded-resource-block` have no native KernelCMS node — flag them or render to a
  `block`/JSON fallback. Text: `nodeType:'text'` `{ value, marks }` → `{ type:'text',
  text, marks }`, mapping mark `type` `bold|italic|underline|code` directly (Contentful
  `superscript`/`subscript` → `sup`/`sub`); drop empty `marks` arrays.
- **Embeds and links in Rich Text.** `embedded-asset-block` → `upload` node
  (`relationTo:'media'`, `value` = resolved asset id). `embedded-entry-block`/
  `embedded-entry-inline` → a `relationship` node to the resolved entry, or a `block`
  if you model that entry as an inline block. `hyperlink` (data.uri) → `link` with a
  sanitized `url`. `entry-hyperlink`/`asset-hyperlink` → `link` with `doc: {
  relationTo, value }` pointing at the resolved id, not a raw URL.
- **Locale codes are full BCP-47 tags** (`en-US`, `da-DK`), not bare languages.
  KernelCMS `localization.locales` must list every Contentful locale code you keep,
  and `defaultLocale` must equal the export's `default: true` code. Contentful
  fallback chains (`fallbackCode`) map onto KernelCMS `localization.fallback`; if a
  field has no value for a locale, KernelCMS falls back per that setting — do not
  fabricate a value.
- **Link resolution order is mandatory.** A `Link` is only a `{ sys: { type:'Link',
  linkType, id } }` stub — the full target lives elsewhere in the export. Import
  **assets → leaf entries → referencing entries**, building `cfAssetId →
  kernelUploadId` then `cfEntryId → kernelDocId` as you go, and resolve refs from the
  maps. Forward references (a row pointing at a not-yet-imported entry) get deferred to
  a second pass or nulled-and-flagged — never invented.
- **Assets carry their own per-locale `file`.** `asset.fields.file` is keyed by locale
  (`file['en-US'].url`, `.fileName`, `.contentType`, `.details.size`/`.image`).
  Contentful URLs are protocol-relative (`//images.ctfassets.net/...`) — prefix
  `https:` before fetching. Upload the binary to the target upload collection; if you
  cannot fetch a binary, record the source URL and flag the row rather than skip the
  reference.
- **Field ceiling.** Contentful caps a content type at 50 fields; KernelCMS does not,
  but a wide type is a sign to split into a group/array or a related collection during
  mapping rather than a flat 50-column table.
- **Stay in scope, stay in draft.** Lifecycle and ownership fields (`_status`, and any
  `author`/owner field outside your `fieldScope`) are stripped from agent writes —
  assign them at the human review/publish step. See **`scope-an-agent-safely`** and
  hand off to **`review-agent-drafts`** for the cutover gate.
- **Tools:** `kernel://schema` + `kernel://collections/<slug>` (target model),
  `media_create`/the upload tool (assets first), `<collection>_create` (each row),
  `<collection>_update` with `locale` (per-locale values), `<collection>_list` /
  `_count` (idempotency on re-runs). CLI bulk alternative: `npx kernel import --file`.
