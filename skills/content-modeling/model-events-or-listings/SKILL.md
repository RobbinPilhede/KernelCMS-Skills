---
name: model-events-or-listings
description: Model events or listings in KernelCMS — dates, locations via the point field, and filterable fields — as typed config-as-code with sortable computed keys.
category: Content modeling
tags: [events, listings, dates, point, geo, filtering]
difficulty: intermediate
---

# Model events or listings

**Use this when** you want an agent to model time- and place-based content in KernelCMS — `events` (talks, gigs, webinars) or `listings` (jobs, rentals, classifieds) — with real `date` fields, a geographic `point` location, and fields shaped for fast filtering and sorting. The output is a typed `kernel.config.ts`.

## Prompt

> You are modeling events/listings in KernelCMS as config-as-code with `defineConfig`. Use only real field types: `text`, `textarea`, `slug`, `number`, `boolean`, `date`, `select`, `richText`, `group`, `array`, `relationship`, `upload`, **`point`** (a `{ lat, lng }` geo coordinate), and the `join`.
>
> **Model it like this:**
> 1. **Identity:** `title` (text, required), `slug` (slug, unique, index), `summary` (textarea), `description` (richText), `image` (upload → media).
> 2. **Time:** `starts_at` (date, required, **`index: true`** — you sort and filter on it constantly), `ends_at` (date). For recurring/multi-session, an `array` of `{ starts_at, ends_at }`. Add a **stored computed `sort_key`** so listings sort cheaply and deterministically:
> ```ts
> { name: 'sort_key', type: 'number', index: true,
>   compute: ({ doc }) => new Date(doc.starts_at).getTime() } // stored, sortable/filterable
> ```
> A *stored* compute (no `virtual`) is persisted at write time, so it's a real indexed column you can sort and filter on — unlike a virtual field. Add a virtual `is_past` (`type: 'boolean', virtual: true`) for display.
> 3. **Location:** a `location` `group` with `venue` (text), `address` (text), `city` (text, index — filtered on), and `coordinates` (**`point`**) for map display and proximity. For online events add `mode` (select: `in_person` | `online` | `hybrid`) and a `url`.
> 4. **Filtering fields — make filters cheap.** Anything users filter by gets `index: true` and a constrained type: `category`/`type` (select), `city` (text, index), `price` (number, integer cents — or a `free` boolean), `starts_at`/`sort_key` (index). Filterable enums are `select`s, not free text.
> 5. **Organizer / host:** a `relationship` (→ `organizers` or `users`, `onDelete: 'setNull'`).
>
> **Drafts.** `versions: { drafts: true }` so events are staged and previewed before going live.
>
> **Access.** Public reads; writes auth-only.
>
> **Admin.** `useAsTitle: 'title'`, `defaultColumns: ['title', 'starts_at', 'city']`, `defaultSort: 'sort_key'` (upcoming-first if you negate, or filter `starts_at >= now`).
>
> Output the config, then justify: indexing `starts_at`, the stored `sort_key` (vs. virtual), the `point` location, and which fields you indexed for filtering and why.

## Example

**Brief:** "A local events listing. Each event has a start/end time, a venue with a map pin, a category, a city, and a price (some are free). Visitors filter by city, category, and date, and sort by soonest. Stage events before publishing."

The agent emits (excerpt):

```ts
import { defineConfig } from 'kernelcms'
import { sqliteAdapter } from 'kernelcms/sqlite'

const CATEGORIES = ['music', 'tech', 'food', 'art', 'sports'] as const

export default defineConfig({
  secret: process.env.KERNEL_SECRET ?? 'dev-only-secret',
  db: sqliteAdapter({ url: 'file:./content.db' }),
  collections: [
    { slug: 'media', upload: true, access: { read: () => true }, fields: [{ name: 'alt', type: 'text' }] },
    {
      slug: 'events',
      versions: { drafts: true },
      admin: { useAsTitle: 'title', defaultColumns: ['title', 'starts_at', 'city'], defaultSort: 'sort_key' },
      access: { read: () => true, update: ({ req }) => Boolean(req.user) },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'slug', type: 'slug', required: true, unique: true, index: true },
        { name: 'summary', type: 'textarea', maxLength: 240 },
        { name: 'description', type: 'richText' },
        { name: 'image', type: 'upload', relationTo: 'media' },

        { type: 'row', fields: [
          { name: 'starts_at', type: 'date', required: true, index: true, admin: { width: 50 } },
          { name: 'ends_at', type: 'date', admin: { width: 50 } },
        ] },
        // stored compute: persisted at write → a real indexed column for cheap sorting
        { name: 'sort_key', type: 'number', index: true,
          compute: ({ doc }) => new Date(doc.starts_at as string).getTime() },
        // virtual: derived on read, presentational only (not sortable)
        { name: 'is_past', type: 'boolean', virtual: true,
          compute: ({ doc }) => new Date(doc.starts_at as string).getTime() < Date.now() },

        { name: 'category', type: 'select', options: [...CATEGORIES], index: true, required: true },

        { name: 'location', type: 'group', fields: [
          { name: 'venue', type: 'text' },
          { name: 'address', type: 'text' },
          { name: 'city', type: 'text', index: true },     // filtered on → indexed
          { name: 'coordinates', type: 'point' },           // { lat, lng } for the map pin
        ] },

        { type: 'row', fields: [
          { name: 'free', type: 'boolean', defaultValue: false, admin: { width: 30 } },
          { name: 'price_cents', type: 'number', integer: true, min: 0,
            admin: { width: 35, condition: (data) => !data.free } }, // hidden when free
        ] },
        { name: 'organizer', type: 'relationship', relationTo: 'organizers', onDelete: 'setNull' },
      ],
    },
    {
      slug: 'organizers',
      admin: { useAsTitle: 'name' },
      access: { read: () => true },
      fields: [
        { name: 'name', type: 'text', required: true },
        { type: 'join', name: 'events', collection: 'events', on: 'organizer', limit: 100 },
      ],
    },
  ],
})
```

Filtering upcoming events in a city, soonest first:

```ts
await kernel.find({
  collection: 'events',
  where: { and: [
    { city: { equals: 'Copenhagen' } },
    { starts_at: { greater_than_equal: new Date().toISOString() } },
    { category: { in: ['tech', 'music'] } },
  ] },
  sort: 'sort_key',
})
```

**Rationale (abridged):** `starts_at` is indexed because every list filters and sorts by date. The stored `sort_key` (a compute *without* `virtual`) is persisted as a real indexed integer column, so sorting by start time is a cheap index scan — a *virtual* field couldn't be sorted at all. `is_past` is virtual because it's purely presentational and must always reflect "now." `location.coordinates` is a `point` for the map pin; `city` is indexed because it's a primary filter. Filter fields (`category`, `city`, `sort_key`) are all indexed and constrained-type; `price_cents` is integer cents and conditionally hidden when `free`.

## Notes

- **Index what you filter/sort.** `starts_at`, `city`, `category`, and `sort_key` carry `index: true` because every listing query touches them. Filterable enums are `select`s, not free text.
- **Stored vs. virtual compute is the key call.** A **stored** compute (no `virtual`) persists at write → sortable/filterable real column (use for `sort_key`). A **virtual** compute is derived on read, never stored → presentational only (use for `is_past`). Don't try to sort by a virtual field.
- **`point`** stores `{ lat, lng }` — use it for map pins and proximity, alongside a plain indexed `city` for cheap text filtering.
- **Recurring events:** an `array` of `{ starts_at, ends_at }` rows; derive the next occurrence into the stored `sort_key`.
- **Money:** integer `price_cents` + a `free` boolean; use `admin.condition` to hide the price input when free. Drafts stage events before publish.
