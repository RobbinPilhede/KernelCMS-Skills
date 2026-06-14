---
name: create-saved-views
description: Enable saved views / smart collections in KernelCMS so editors save a named query preset (a where + sort + display columns) per collection and re-apply it in one click — applied through the normal access-checked find, so a view can only ever narrow within the caller's access.
category: Content modeling
tags: [views, smart-collections, filters, productivity, query-presets]
difficulty: starter
---

# Create saved views

**Use this when** your editors keep re-typing the same filters — "show me my unpublished
drafts", "everything published this month", "products that are out of stock" — every time they
open a collection. A saved view stores that query (a `where` + `sort` + display `columns`) under
a name so they pick it from a list instead of rebuilding it. Each editor keeps their own views;
a view can be shared with the team.

This is a configuration runbook.

## Prompt

This skill is operational — follow the runbook.

### 1. Enable views

Views are off until you opt in. Set `views: true` on the config:

```ts
export default defineConfig({
  views: true,
  collections: [/* … */],
})
```

This registers a private `_views` system table. It is **not** reachable through generic CRUD —
views are only ever touched through the dedicated ops below, which enforce the access model.

### 2. Save a view

```ts
const view = await kernel.saveView({
  collection: 'articles',
  name: 'My drafts',
  where: { _status: { equals: 'draft' }, author: { equals: req.user.id } },
  sort: '-updatedAt',
  columns: ['title', 'status', 'updatedAt'], // display hints for the admin table
  shared: false,                              // private to the owner (the default)
  req,                                        // the principal owns the view
})
```

The owner is recorded from the authenticated principal — never client input. `where`/`sort`/
`columns` are validated against the collection's real fields, so a malformed preset is rejected
at save (not silently stored to fail later). You can only save a view for a collection you can
read.

### 3. List, apply, update, delete

```ts
const mine = await kernel.listViews({ collection: 'articles', req }) // own + shared-on-readable
const page = await kernel.applyView({ viewId: view.id, page: 1, limit: 25, req })
const page2 = await kernel.applyView({ viewId: view.id, where: { title: { like: 'launch' } }, req }) // narrows further
await kernel.updateView({ viewId: view.id, name: 'My recent drafts', shared: true, req })           // owner/admin only
await kernel.deleteView({ viewId: view.id, req })                                                   // owner/admin only
```

Over REST (every route requires auth):

```http
GET    /api/_admin/views?collection=                 # own + shared-on-readable
POST   /api/_admin/views  { collection, name, where?, sort?, columns?, shared? }
GET    /api/_admin/views/:id
PATCH  /api/_admin/views/:id  { name?, where?, sort?, columns?, shared? }
DELETE /api/_admin/views/:id
POST   /api/_admin/views/:id/apply  { where?, sort?, draft?, limit?, page? }
```

### 4. Wire it into the admin

Fetch `listViews({ collection })` to populate a "Views" dropdown beside the collection table;
on selection, POST to `/:id/apply` and render the returned page. A "Save current view" button
captures the active filter/sort into `saveView`. Toggle `shared` to publish a view to the team.

### 5. Trust the boundaries

A saved view can never let a caller see or do anything they couldn't already.

- **Apply only narrows.** `applyView` runs the NORMAL access-checked `find`: the collection's
  read rule + row-scope are AND-combined with the stored `where`, so a shared view authored by a
  high-privilege user, applied by a restricted user, returns only the restricted user's own
  rows. A view can intersect down, never widen.
- **Owner from the principal; private by default.** A view is visible only to its owner unless
  `shared`; a shared view is visible only to those who can read its collection. Update/delete are
  owner-or-admin only — sharing grants visibility, never edit rights.
- **Re-validated + isolated.** The stored `where`/`sort` are validated on save AND apply (schema
  drift / tamper defense); `_views` is unreachable via generic CRUD; ids and filter keys are
  prototype-pollution-guarded; create/update/delete are audited.

Provide: «the collections that need saved views, the common filters your editors re-type, and
whether any of those presets should be team-shared».
