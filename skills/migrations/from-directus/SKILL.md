---
name: from-directus
description: Migrate a Directus project into KernelCMS — collections, M2O/O2M/M2M relations, junctions, files, and WYSIWYG fields — mapped and imported as drafts.
category: Migrations
tags: [migration, directus, relations, sql]
difficulty: advanced
brand: Directus
color: '#6644FF'
logo: directus
---

# Migrate from Directus to KernelCMS

**Use this when** you are moving a Directus project to KernelCMS and you want an agent to
do the real work: introspect the Directus schema over the API, propose an explicit
collection → collection map, untangle the two Directus-specific things that drive every
migration — its **SQL-shaped relations** (M2O via foreign key, O2M as a virtual reverse,
M2M and M2A through **junction collections**) and its **central file library**
(`directus_files`) — then import everything into KernelCMS as **drafts** you review
before cutover.

Directus is **data-first**: it is a thin admin layer wrapped around an existing SQL
database, so "your content model" is literally your tables and columns, annotated by the
`directus_*` system collections. That makes the migration unusually legible — but it also
means three things shape the whole job and you map them deliberately, not field-by-field:

- **Relations are SQL.** A Many-to-One is a real foreign-key column on the "many" table.
  A One-to-Many is a *virtual* reverse view of that same FK (an Directus "alias" field,
  no column). A Many-to-Many is **not** a column at all — it is a separate **junction
  collection** holding two FKs. KernelCMS expresses the same shapes with `relationship`
  (+ `join` for the reverse) and `hasMany`, so the junction is where the real work is.
- **Files are a collection.** Every upload lives once in `directus_files`; a `file`
  field is an M2O to it, a `files` field is an M2M to it through a junction. KernelCMS
  `upload` fields are the target — one media record per binary, referenced by id.
- **Rich text is HTML or Markdown.** The Directus **WYSIWYG** interface stores raw HTML
  in a text column; the **Markdown** interface stores a Markdown string. Both map to
  KernelCMS `richText` — by `fromHTML` and `fromMarkdown` respectively, never pasted raw
  into a plain `text` field.

Two import paths exist, same as any KernelCMS migration. `npx kernel import --file
<export.json>` is the fast, server-side bulk path for a trusted one-shot — and because
Directus content is already in SQL, a plain DB dump is a viable source too. The
**agent-over-MCP** path this skill drives gives you per-row transforms and **reviewable
drafts**, which is the right default for Directus because junctions, files, and
WYSIWYG/Markdown all need real restructuring. You can combine them: agent for the
relational and rich-text content, CLI for the flat collections.

## Prompt

> You are migrating a Directus project into KernelCMS through the access-controlled MCP
> tools. Everything you create is a **draft** — review happens before any cutover. You
> can only write fields inside your `fieldScope`, and you can never publish.
>
> **1. Learn the Directus schema from the API.** Read the schema-introspection
> endpoints, which return the `directus_*` system metadata:
> - `GET /collections` — every collection (= SQL table). **Skip every `directus_*`
>   system collection** (`directus_users`, `directus_files`, `directus_roles`,
>   `directus_permissions`, `directus_relations`, `directus_fields`, `directus_settings`,
>   `directus_activity`, `directus_revisions`, …) — those are platform plumbing, not your
>   content. Note any collection where `meta.singleton` is true.
> - `GET /fields` — every field, each carrying `type` (the SQL column type), `meta.interface`
>   (how it is edited: `input-rich-text-html`, `input-rich-text-md`, `select-dropdown`,
>   `file-image`, `list-m2m`, …), and `meta.special` (the I/O flags array:
>   `m2o`, `o2m`, `m2m`, `m2a`, `file`, `files`, `cast-json`, `cast-csv`, `uuid`,
>   `cast-boolean`, `date-created`, `date-updated`, `user-created`, `user-updated`,
>   `group`, `no-data`, …).
> - `GET /relations` — the relation graph. Each row has `many_collection` / `many_field`
>   (the side holding the FK), `one_collection` / `one_field` (the target + its virtual
>   reverse field), `junction_field` (set ⇒ this is one leg of an **M2M/M2A junction**),
>   and `one_allowed_collections` (set ⇒ **M2A** polymorphic).
>
> Read these *before* `/items`, so you know each field's true shape.
>
> **2. Learn the target model.** Read `kernel://schema` and the relevant
> `kernel://collections/<slug>` descriptors. For each target collection list its fields,
> types, required fields, and which are in your scope.
>
> **3. Propose the collection → collection map — and show it before importing.** A
> Directus **collection** → a KernelCMS collection; a **singleton** → a KernelCMS
> **global**. For each, produce a `source field → target field` table with the transform.
> Apply the mapping rules below. Crucially, classify every relation from `/relations`
> first, then map:
>
> - **M2O** (`special: ['m2o']`, an FK column) → `relationship` with `relationTo: '<one_collection>'`.
> - **O2M** (`special: ['o2m']`, a virtual reverse / alias, no column) → a **`join`**
>   field (`{ type:'join', collection:'<many_collection>', on:'<many_field>' }`). It is
>   *resolved*, not imported — wiring the M2O side automatically populates it.
> - **M2M** (`special: ['m2m']`, two relation rows sharing a `junction_field`) → a single
>   **`relationship` with `hasMany: true`**. Read the junction collection's rows, follow
>   each `junction_field` FK to the far side, and write the resolved id list onto the
>   owning document. **Do not** recreate the junction collection in KernelCMS — collapse
>   it. This is the highlight of the migration.
> - **M2A** (`one_allowed_collections` set, junction also stores the target collection
>   name) → `relationship` with `relationTo: ['a','b',…]` and `hasMany: true`. Each value
>   becomes `{ relationTo, value }`.
> - **`file`** (M2O to `directus_files`) → an **`upload`** field. **`files`** (M2M to
>   `directus_files` via a junction) → `upload` + `hasMany: true`. Create one KernelCMS
>   media record per `directus_files` row, then set the reference(s).
> - **WYSIWYG** (`interface: input-rich-text-html`) → `richText` via `fromHTML`. **Markdown**
>   (`interface: input-rich-text-md`) → `richText` via `fromMarkdown`. Never store raw
>   HTML/Markdown in a `text` field.
> - **`cast-json`** → `json`; **`cast-csv`** → `select` with `hasMany: true` (Directus
>   stores it as a comma-joined string, returns an array).
>
> Flag every source field with **no** target home and every required target field with
> **no** source — do not guess. Get the human's sign-off on the map before creating
> anything.
>
> **4. Import in dependency order.** Create referenced collections first — **media
> records from `directus_files`** (`GET /files`, fetch bytes from `/assets/<id>`), then
> authors/categories and any M2O targets — so relationships resolve, then the documents
> that point at them. Pull rows with `GET /items/<collection>` (page through with
> `limit`/`offset`; expand relations with `fields=*.*` or resolve via the id map). Keep a
> Directus-pk → KernelCMS-id table per collection to wire relationships and to stay
> idempotent on re-runs. Preserve the Directus slug/primary-key-derived URL field where a
> target exists so URLs survive. For each row call `<collection>_create` with the mapped,
> validated payload; for singletons call `<global>_update_global`.
>
> **5. Handle the messy cases explicitly.** An M2M field: read the junction collection,
> group its rows by the owning FK, follow each `junction_field` to the related pk, map
> those through the id table, and emit the resolved id array onto the owner — drop the
> junction's own pk and any sort column. A `file`/`files` field: a value is a
> `directus_files` id (or, when expanded, the file object) — map it to the KernelCMS media
> id; for binaries you cannot fetch, record the source `/assets/<id>` URL and flag it.
> `cast-csv` returns an array already; `cast-json` passes through. Dates from
> `date-created`/`date-updated` are managed by KernelCMS `timestamps` — drop them. Coerce
> enums and dates to the target types or flag mismatches.
>
> **6. Report.** Output: rows created per collection (with ids), rows skipped/flagged (and
> why), and the unresolved-mapping list. Tell the human to review the drafts (filter to
> `createdByType: agent`), spot-check that M2M lists and file references resolved
> correctly, then publish in the admin. Migration completes when a human publishes — not
> when you finish creating.
>
> Source: «the Directus base URL + an admin/static token (or a DB dump), and the
> collections to migrate».

## Mapping

| Directus type / `special` / interface | KernelCMS target | Transform notes |
| --- | --- | --- |
| **Collection** (non-`directus_*`) | `collection` | One row → one document. |
| **Singleton** (`meta.singleton: true`) | `global` | Import via `<global>_update_global`, not `_create`. |
| `string` / `text` (`input`, `textarea`) | `text` / `textarea` | — |
| **WYSIWYG** (`input-rich-text-html`) | `richText` | Convert stored HTML with `fromHTML` from `@kernel/richtext`. |
| **Markdown** (`input-rich-text-md`) | `richText` | Convert the Markdown string with `fromMarkdown`. |
| `integer` / `bigInteger` / `float` / `decimal` | `number` | `integer: true` for integer/bigInteger. |
| `boolean` (`special: cast-boolean`) | `boolean` | — |
| `date` / `dateTime` / `timestamp` / `time` | `date` | Coerce to ISO; flag time-only values. |
| `uuid` (`special: uuid`) | `text` | Usually a primary key — becomes the id-map source, not a written field. |
| `json` (`special: cast-json`) | `json` | Pass through. |
| `csv` (`special: cast-csv`) | `select` + `hasMany: true` | Directus stores a comma-joined string, returns an array → `options` from distinct values. |
| `select-dropdown` / `select-radio` interface | `select` / `radio` | Directus `meta.options.choices` → `options`. |
| **M2O** (`special: m2o`, FK column) | `relationship` | `relationTo: '<one_collection>'`. Resolve the FK via the id map. |
| **O2M** (`special: o2m`, alias, no column) | **`join`** field | `{ type:'join', name, collection:'<many_collection>', on:'<many_field>' }`. Resolved on read; wire the M2O side, not this. |
| **M2M** (`special: m2m`, junction) | `relationship` + `hasMany: true` | **Collapse the junction.** Follow each `junction_field` FK to the far pk; write the resolved id list. Do not recreate the junction collection. |
| **M2A** (`one_allowed_collections` set) | `relationship` `relationTo: ['a','b']` + `hasMany: true` | Each value stored as `{ relationTo, value }`. The junction's collection-name column tells you `relationTo`. |
| **`file`** (M2O to `directus_files`) | `upload` | Create one media record from the `directus_files` row; set the reference. |
| **`files`** (M2M to `directus_files`) | `upload` + `hasMany: true` | One media record per file; resolve the junction to an id list. |
| `group` (`special: group`, presentational) | `group` / `row` / `tabs` | Directus field grouping is presentational; map to a KernelCMS `group` (stored) or a layout container. |
| `date-created` / `date-updated` | `timestamps` | KernelCMS manages `createdAt`/`updatedAt`; drop these columns. |
| `user-created` / `user-updated` | drop / audit | Authorship audit is `createdByType`; do not write Directus user ids. |
| Primary key (`id`, often `uuid`/auto-int) | id-map key | Never write Directus pks into KernelCMS; keep an external map. |
| **`directus_*` system collections** | skip | `directus_users` (→ a KernelCMS `auth` collection only if you are migrating accounts), `directus_files` (→ your media collection), the rest is platform plumbing — do not import. |

## Example

A Directus `articles` collection with an M2O `author`, an M2M `tags` (through a
`articles_tags` junction), a single `file` `cover`, and a WYSIWYG `body`. Pulled with
relations expanded:

```jsonc
// GET /items/articles/42?fields=*,author.*,tags.tags_id.*,cover.*
{
  "id": 42,
  "title": "Hello",
  "slug": "hello",
  "status": "published",                 // Directus status — informational; lands as draft
  "body": "<h2>Intro</h2><p>Hello <strong>world</strong></p>",   // WYSIWYG → HTML
  "author": { "id": 7, "name": "Ada" },  // M2O → relationship
  "cover": {                             // file (M2O to directus_files) → upload
    "id": "9f1c-…-img", "filename_download": "hero.jpg",
    "type": "image/jpeg", "filesize": 84213, "width": 1600, "height": 900
  },
  "tags": [                              // M2M through the articles_tags junction
    { "id": 101, "articles_id": 42, "tags_id": { "id": 3, "name": "news" } },
    { "id": 102, "articles_id": 42, "tags_id": { "id": 5, "name": "release" } }
  ]
}
```

The relevant `/relations` rows that classify those fields:

```jsonc
// author: M2O — FK column on articles
{ "many_collection": "articles", "many_field": "author",
  "one_collection": "authors", "junction_field": null }

// tags: M2M — two rows sharing junction_field, junction collection = articles_tags
{ "many_collection": "articles_tags", "many_field": "articles_id",
  "one_collection": "articles", "junction_field": "tags_id" }
{ "many_collection": "articles_tags", "many_field": "tags_id",
  "one_collection": "tags",     "junction_field": "articles_id" }
```

After importing `directus_files` → media (→ `cover` id), `authors` (→ `author` id), and
`tags` (→ each tag id) first, the `articles_create` payload — the WYSIWYG HTML becomes a
`richText` document, the M2O resolves to one id, and **the M2M junction collapses into a
flat `hasMany` id array** (the `articles_tags` junction is gone):

```jsonc
// KernelCMS draft payload
{
  "title": "Hello",
  "slug": "hello",                                  // preserved so the URL survives
  "body": { /* richText doc from fromHTML(<h2>…</strong></p>) */ },
  "author": "<kernel-author-id>",                   // M2O → relationship (one id)
  "cover": "<kernel-media-id>",                      // file → upload (one media id)
  "tags": ["<kernel-tag-id-news>", "<kernel-tag-id-release>"]  // M2M junction → hasMany ids
  // _status stays draft (agent cannot publish); Directus "status" is informational
}
```

The matching config side (proposed, for the human to confirm): `author` as
`relationship` (`relationTo: 'authors'`), `cover` as `upload` (`relationTo: 'media'`),
`tags` as `relationship` (`relationTo: 'tags', hasMany: true`), `body` as `richText`.
On `authors`, the reverse O2M is a `join`: `{ type:'join', name:'articles',
collection:'articles', on:'author' }` — resolved, never imported.

## Notes

- **The junction is the migration.** Directus M2M and M2A store nothing on the parent
  row — the relationship lives entirely in a separate **junction collection** (two FK
  columns; for M2A a third column naming the target collection). You detect it from
  `/relations`: a `junction_field` is set, and you will see **two** relation rows for one
  M2M whose `junction_field`s point at each other. KernelCMS has no junction concept — a
  `hasMany` relationship stores the list directly — so you **collapse** the junction:
  read its rows, follow each `junction_field` FK to the far primary key, map through the
  id table, and write the resulting id array onto the owner. Never recreate the
  `<a>_<b>` junction as a KernelCMS collection; it is an implementation detail of
  Directus's SQL shape, not content.
- **O2M is a view, not data.** A One-to-Many field is a Directus *alias* (`special: o2m`,
  no column) — the reverse of an M2O. It holds no value to import. Map it to a KernelCMS
  **`join`** field, which resolves the same reverse query at read time. The only thing you
  actually import is the M2O (FK) side; wire that and the `join` populates itself.
- **Files are a shared library.** Every binary lives once in `directus_files`
  (`id`, `filename_disk`, `filename_download`, `type`, `filesize`, `storage`, `width`,
  `height`, …); a `file` field is an M2O to it, a `files` field an M2M to it through a
  junction. Import `directus_files` **first** as KernelCMS upload documents — fetch each
  binary from `/assets/<id>` (it honors `storage`: local disk, S3, …) — then set the
  `upload` reference(s) on owning rows. One `directus_files` row → one KernelCMS media
  record, even if many documents reference it (dedupe on the file id). Binaries you
  cannot fetch: record the `/assets/<id>` URL and flag.
- **Skip the system collections.** `/collections` and `/fields` return platform tables
  too. Ignore everything prefixed `directus_` — `directus_permissions`,
  `directus_activity`, `directus_revisions`, `directus_settings`, `directus_relations`,
  and the rest are plumbing. The two with content value are `directus_files` (→ your
  media collection) and, *only if you are migrating accounts*, `directus_users` (→ a
  KernelCMS `auth` collection — never copy password hashes; trigger a reset instead).
- **WYSIWYG vs Markdown — pick the right converter.** Both are plain text columns; the
  `meta.interface` tells them apart (`input-rich-text-html` vs `input-rich-text-md`). Run
  HTML through `fromHTML` and Markdown through `fromMarkdown` (both from
  `@kernel/richtext`); each normalizes and sanitizes to a KernelCMS rich-text document.
  Detect by interface, not by sniffing the string.
- **`onDelete` is your call now.** Directus relation rows carry an
  `one_deselect_action`/SQL `ON DELETE` rule (`nullify`/`cascade`/no-action). Translate
  the intent to the KernelCMS field's `onDelete`: `'setNull'` to clear a dangling
  reference, `'cascade'` to delete dependents, `'restrict'` to block a delete while
  referrers exist. Omit it to keep the legacy "leave the reference, tolerate dangling"
  behavior. Decide per relationship rather than copying blindly.
- **Singletons → globals.** A Directus collection with `meta.singleton: true` holds a
  single row (site settings, a homepage). Map it to a KernelCMS **global** and write it
  with `<global>_update_global`, not `_create`.
- **Data-first, both ends.** Directus wraps an existing SQL database, so a DB dump is a
  legitimate source — but it lacks the `directus_*` semantics, so prefer the schema API
  (`/collections` + `/fields` + `/relations`) to classify relations correctly, and use
  the dump (or `/items`) only for the row data. KernelCMS has its own data-first angle —
  config-as-code over a real SQL schema — but here the job is content → KernelCMS
  collections, so model in `kernel.config.ts` and import into it.
- **Draft-only, by design.** Both Directus draft and published rows (the `status` field,
  if present) import as KernelCMS **drafts** — agents physically cannot publish. A
  botched migration is a pile of reviewable drafts, never a broken live site. Cutover is
  the human's publish step.
- **Stay in scope.** Lifecycle and authority fields (`_status`, `roles`, ownership) are
  stripped from agent writes — assign them at the human review/publish step. See
  **`scope-an-agent-safely`**.
- **Tools:** `kernel://schema` + `kernel://collections/<slug>` (target model),
  `<collection>_create` / `<global>_update_global` (each row), `<collection>_list` /
  `_count` (idempotency on re-runs). For a trusted bulk one-shot instead, hand a portable
  `{ "<slug>": [rows] }` file to `npx kernel import --file`.
- **Cross-links.** General playbook: **`migrate-content-from-another-cms`**. Cutover
  gate: **`review-agent-drafts`**. Field-access footgun when migrating
  `directus_users`: **`scope-an-agent-safely`**.
