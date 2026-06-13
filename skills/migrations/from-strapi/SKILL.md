---
name: from-strapi
description: Migrate a Strapi project into KernelCMS — content types, components, dynamic zones, relations, and media — mapped and imported as drafts.
category: Migrations
tags: [migration, strapi, components, dynamic-zones]
difficulty: advanced
brand: Strapi
color: '#4945FF'
logo: strapi
---

# Migrate from Strapi to KernelCMS

**Use this when** you are moving a Strapi v4 or v5 project to KernelCMS and you want an
agent to do the real work: read the Strapi schemas and an export, propose an explicit
content-type → collection map, translate the two Strapi-specific concepts that have no
direct twin elsewhere — **components** and **dynamic zones** — into KernelCMS `group` /
`array` / `blocks`, then import everything as **drafts** you review before cutover.

Strapi's data model is unusual in three ways that drive this whole migration, so map
them deliberately rather than field-by-field:

- **Components** are reusable field groups (`category.name`, e.g. `shared.seo`). A
  single component is a `group`; a *repeatable* component is an `array`.
- **Dynamic zones** are the page builder: an ordered, mixed list of component instances,
  each tagged with a `__component` discriminator. This is KernelCMS `blocks` almost
  one-to-one — the highlight of the migration.
- **Rich Text (Blocks)** is Strapi v5's structured JSON editor (a node tree), distinct
  from the legacy **Rich text (Markdown)** field. Both map to KernelCMS `richText`, but
  by different transforms.

Two import paths exist, same as any KernelCMS migration. `npx kernel import --file
<export.json>` is the fast, server-side bulk path for a trusted one-shot. The
**agent-over-MCP** path this skill drives gives you per-entry transforms and
**reviewable drafts** — the right default for Strapi, because components and dynamic
zones always need real restructuring. You can combine them: agent for the tricky
page-builder content, CLI for the flat collections.

## Prompt

> You are migrating a Strapi project into KernelCMS through the access-controlled MCP
> tools. Everything you create is a **draft** — review happens before any cutover. You
> can only write fields inside your `fieldScope`, and you can never publish.
>
> **1. Get the Strapi schemas and export.** Ask for the schema files
> (`src/api/<type>/content-types/<type>/schema.json` and
> `src/components/<category>/<name>.json`) and a data export. The canonical export is
> `npm run strapi export -- --no-encrypt --no-compress` (Strapi v5) /
> `strapi export` (v4), which writes a `.tar.gz` of newline-delimited JSON under
> `entities/`, `links/`, `assets/`, `schemas/`, and `configuration/`. A REST dump
> (`/api/<type>?populate=deep` or explicit `populate`) also works — note whether it is
> v5 **flattened** (`documentId`, fields at top level) or v4 **wrapped**
> (`data.attributes.*`, numeric `id`). Record which, it changes every path below.
>
> **2. Learn the target model.** Read `kernel://schema` and the relevant
> `kernel://collections/<slug>` descriptors. For each target collection list its fields,
> types, required fields, and which are in your scope.
>
> **3. Propose the content-type → collection map — and show it before importing.**
> Strapi **collection types** → KernelCMS collections; Strapi **single types** →
> KernelCMS globals. For each, produce a `source field → target field` table with the
> transform. Apply the mapping rules below. Crucially:
>
> - **Component** (single) → a `group` field with the component's subfields.
> - **Repeatable component** → an `array` field whose `fields` are the component's
>   subfields.
> - **Dynamic zone** → a **`blocks`** field. Each Strapi component variant becomes a
>   `BlockDef`: its `__component` UID (`category.name`) becomes the block `slug`, its
>   subfields become the block `fields`. This is the page builder — get it right.
> - **Rich Text (Blocks)** (v5 node JSON) → `richText` (convert the node tree to the
>   KernelCMS rich-text document). **Rich text (Markdown)** (legacy) → `richText` (parse
>   markdown → rich-text nodes). Never paste raw HTML/markdown into a plain `text` field.
> - **Relation** → `relationship` (`relationTo` the mapped slug; `hasMany` for
>   one/many-to-many). **Media** → `upload` (create the media record, set the reference).
> - **i18n localized field** → set `localized: true` on the target field; import each
>   Strapi locale as that field's localized value under the matching KernelCMS locale.
>
> Flag every source field with **no** target home and every required target field with
> **no** source — do not guess. Get the human's sign-off on the map before creating
> anything.
>
> **4. Import in dependency order.** Create referenced collections first (media records,
> authors, categories) so relationships resolve, then the entries that point at them.
> Keep a Strapi-id → KernelCMS-id table (key on **`documentId`** in v5, numeric `id` in
> v4) to wire relationships and to stay idempotent on re-runs. Preserve the Strapi
> `slug`/`uid` where a target field exists so URLs survive. For each entry call
> `<collection>_create` with the mapped, validated payload; for single types call
> `<global>_update_global`.
>
> **5. Handle the messy cases explicitly.** A dynamic-zone entry: walk the array, and for
> each item read `__component`, look up its block slug, drop `__component` and the
> Strapi numeric `id`, and emit `{ blockType: '<slug>', ...mappedFields }`. Nested
> repeatable components inside a block stay arrays. Media you cannot fetch as bytes:
> record the source `url` and flag it. Enums/dates: coerce to the target types or flag.
> Drafts: Strapi draft entries (`publishedAt: null`) and published ones both land as
> KernelCMS drafts — publishing is the human's cutover step.
>
> **6. Report.** Output: entries created per collection (with ids), entries
> skipped/flagged (and why), and the unresolved-mapping list. Tell the human to review
> the drafts (filter to `createdByType: agent`), spot-check dynamic-zone → blocks
> fidelity, relationships, and media, then publish in the admin. Migration completes
> when a human publishes — not when you finish creating.
>
> Source: «Strapi version (v4/v5), the schema files, the export location/format, and the
> content types to migrate».

## Mapping

| Strapi concept / field | KernelCMS target | Transform notes |
| --- | --- | --- |
| **Collection type** | `collection` | One Strapi entry → one document. |
| **Single type** | `global` | Import via `<global>_update_global`, not `_create`. |
| **Component** (single) | `group` field | Subfields become the group's `fields`. Inline; not a separate collection. |
| **Repeatable component** | `array` field | Component subfields become `array.fields`; carry `minRows`/`maxRows` from `min`/`max`. |
| **Dynamic zone** | **`blocks`** field | Each component variant → a `BlockDef`. `__component` UID (`cat.name`) → block `slug`. Per item: drop `__component` + numeric `id`, emit `{ blockType, ...fields }`. |
| **Rich Text (Blocks)** (v5) | `richText` | Convert Strapi's node JSON (paragraph/heading/list/link/quote/code/image) to the KernelCMS rich-text document. |
| **Rich text (Markdown)** (legacy) | `richText` | Parse markdown → rich-text nodes. Don't store raw markdown in `text`. |
| **Text / UID** | `text` (`type: 'slug'` for UID) | UID → a `slug` field; preserve the value so URLs survive. |
| **Email / Password** | `email` / auth field | Password fields move to a KernelCMS `auth` collection, not a plain field. |
| **Number / Integer / Decimal / BigInteger** | `number` | Set `integer: true` for integer/biginteger. |
| **Boolean** | `boolean` | — |
| **Date / DateTime / Time** | `date` | Coerce to ISO; flag time-only values. |
| **Enumeration** | `select` | Strapi `enum` values → `options`. |
| **JSON** | `json` | Pass through. |
| **Relation** (oneToOne/manyToOne) | `relationship` | `relationTo: '<slug>'`. Resolve via the id map. |
| **Relation** (oneToMany/manyToMany) | `relationship` + `hasMany: true` | Map each related id through the id table. |
| **Polymorphic / morph relation** | `relationship` with `relationTo: ['a','b']` | Stored as `{ relationTo, value }`. |
| **Media** (single) | `upload` | Create the media record first; set the reference. |
| **Media** (multiple) | `upload` + `hasMany: true` | One reference per asset. |
| **i18n localized field** | same field + `localized: true` | Import each Strapi locale value under the matching KernelCMS locale. Add `localization.locales` to config. |
| **Draft & Publish** (`publishedAt`) | drafts (`versions: { drafts: true }`) | All imports land as drafts; `publishedAt` is informational, set at human publish. |
| `id` (numeric, v4) / `documentId` (v5) | id-map key | Never write Strapi ids into KernelCMS; keep an external map. |
| `createdAt` / `updatedAt` / `createdBy` / `updatedBy` | `timestamps` / drop | Timestamps are managed by KernelCMS; author audit is `createdByType`. |

## Example

A Strapi v5 `pages` single-entry export with a dynamic zone `blocks`, a single
component `seo`, a relation `author`, and a media `cover` — fetched flattened:

```jsonc
// Strapi v5 (flattened, documentId, __component discriminator)
{
  "documentId": "abc123def456ghi789jkl012",
  "title": "Home",
  "slug": "home",
  "locale": "en",
  "publishedAt": null,                         // draft in Strapi
  "cover": { "documentId": "img_99", "name": "hero.jpg", "url": "/uploads/hero.jpg" },
  "author": { "documentId": "auth_7", "name": "Ada" },
  "seo": { "id": 5, "metaTitle": "Home", "metaDescription": "Welcome" },
  "blocks": [
    { "__component": "blocks.hero", "id": 1,
      "heading": "Welcome", "ctaLabel": "Start", "ctaUrl": "/start" },
    { "__component": "blocks.rich-text", "id": 2,
      "content": [{ "type": "paragraph", "children": [{ "type": "text", "text": "Hi" }] }] },
    { "__component": "blocks.feature-grid", "id": 3, "title": "Features",
      "features": [{ "id": 1, "title": "Fast" }, { "id": 2, "title": "Flexible" }] }
  ]
}
```

After importing `media` (→ `cover` ref) and `authors` (→ `author` ref) first, the
`pages_create` payload — note the dynamic zone collapses into a `blocks` field, each
item keyed by `blockType` with `__component` and the numeric `id` dropped, and the
single component `seo` becomes a plain `group`:

```jsonc
// KernelCMS draft payload
{
  "title": "Home",
  "slug": "home",
  "cover": "<kernel-media-id>",               // upload, resolved from the id map
  "author": "<kernel-author-id>",             // relationship, resolved from the id map
  "seo": { "metaTitle": "Home", "metaDescription": "Welcome" },   // component → group
  "blocks": [                                  // dynamic zone → blocks
    { "blockType": "blocks.hero", "heading": "Welcome", "ctaLabel": "Start", "ctaUrl": "/start" },
    { "blockType": "blocks.rich-text", "content": { /* richText doc from the node tree */ } },
    { "blockType": "blocks.feature-grid", "title": "Features",
      "features": [{ "title": "Fast" }, { "title": "Flexible" }] }   // repeatable component → array
  ]
  // _status stays draft (agent cannot publish); locale "en" written as the active locale
}
```

The matching config side (proposed, for the human to confirm): a `blocks` field whose
`BlockDef.slug`s are `blocks.hero`, `blocks.rich-text`, `blocks.feature-grid`; a `group`
field `seo`; an `array` field `features` *inside* the feature-grid block; `cover` as
`upload`, `author` as `relationship`.

## Notes

- **v4 vs v5 is the first fork in the road.** v5 returns a **flattened** response with a
  string **`documentId`** and fields at the top level; v4 wraps everything in
  `data.attributes.*` with a numeric `id`. Key your id-map accordingly. If you only have
  a v5 API dump and a tool expects v4 shape, the `Strapi-Response-Format: v4` request
  header restores the old wrapping — but prefer the native shape and unwrap once.
- **Components vs dynamic zones — don't conflate them.** A component is a *fixed* shape
  reused in place → `group` (single) or `array` (repeatable). A dynamic zone is an
  *ordered mix* of different components chosen per entry → `blocks`. The tell in the
  data: dynamic-zone items carry `__component`; component instances inside a known field
  do **not** (their type is implicit from the parent schema). Map `__component` → block
  `slug`; never invent a discriminator for plain component arrays.
- **Two rich-text fields, one target.** Strapi v5's **Rich Text (Blocks)** is a node
  tree (`paragraph`/`heading`/`list`/`link`/`quote`/`code`/`image`); the legacy **Rich
  text** field is markdown. Both → KernelCMS `richText`, but via different converters.
  Detect by value shape (array of nodes vs. a markdown string) and pick the right one.
- **The export tarball.** `strapi export` produces a `.tar.gz` (often `.enc` — pass
  `--no-encrypt`/`--key`) of NDJSON grouped into `entities/`, `links/` (relation join
  rows), `assets/` (the media binaries), and `schemas/`. Relations live in `links/`, not
  inline — resolve them through your id map. The binaries in `assets/` are what you turn
  into KernelCMS `upload` documents; if you only have a REST dump, fetch each media
  `url` to get the bytes.
- **Media → uploads.** A Strapi media object is `{ url, name, mime, ... }`. Create a
  KernelCMS upload document (fetch the bytes from `url` or the `assets/` folder), then
  set the `upload` reference on the owning entry. Multiple media → `hasMany`.
- **i18n.** Strapi keeps locale variants under one entity (one `documentId`, many
  `locale`s). Add the locales to `localization.locales` in `kernel.config.ts`, mark the
  translated fields `localized: true`, and write each Strapi locale value under the
  matching KernelCMS locale. Non-localized fields stay shared.
- **Draft-only, by design.** Both Strapi drafts (`publishedAt: null`) and published
  entries import as KernelCMS **drafts** — agents physically cannot publish. A botched
  migration is a pile of reviewable drafts, never a broken live site. Cutover is the
  human's publish step.
- **Stay in scope.** Lifecycle and authority fields (`_status`, `roles`, ownership) are
  stripped from agent writes — assign them at the human review/publish step. See
  **`scope-an-agent-safely`**.
- **Tools:** `kernel://schema` + `kernel://collections/<slug>` (target model),
  `<collection>_create` / `<global>_update_global` (each entry), `<collection>_list` /
  `_count` (idempotency on re-runs). For a trusted bulk one-shot instead, hand a
  portable `{ "<slug>": [rows] }` file to `npx kernel import --file`.
- **Cross-links.** General playbook: **`migrate-content-from-another-cms`**. Cutover
  gate: **`review-agent-drafts`**.
