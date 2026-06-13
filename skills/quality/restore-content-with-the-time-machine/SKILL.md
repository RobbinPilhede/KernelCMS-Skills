---
name: restore-content-with-the-time-machine
description: Use the KernelCMS content time-machine to investigate and recover content — read any document as it existed at a past instant, diff two points, and restore a known-good state, all access-checked.
category: Quality
tags: [time-machine, versions, restore, audit, recovery, diff]
difficulty: intermediate
---

# Restore content with the time-machine

**Use this when** something changed that shouldn't have — a bad edit, an agent draft gone sideways, a "what did this page say last Tuesday?" question, or a legal/audit request. KernelCMS keeps a snapshot of every change, so you can travel to any point in time, compare, and roll back — without leaving the API.

This is an investigative runbook: read history, find the good state, restore it.

## Prompt

This skill is operational — follow the runbook. (The collection must have `versions` enabled.)

### 1. Read the change timeline

```ts
const timeline = await kernel.history({ collection: 'articles', id })
// → [{ versionId, at, by, byType, status, changedFields }, …]  oldest → newest
```

Each entry shows **who** changed it, **when**, and **which fields** (`changedFields`) differed from the previous snapshot. Over REST: `GET /api/articles/ID/history`.

### 2. Look at a past state

```ts
const lastTuesday = await kernel.findByID({ collection: 'articles', id, asOf: '2026-06-09T09:00:00Z' })
```

`asOf` reconstructs the document exactly as it existed at that instant (the latest snapshot at or before it). `null` means it didn't exist yet. You can do this for a whole collection too: `kernel.find({ collection: 'articles', asOf })`. Over REST: `GET /api/articles/ID?asOf=<iso>`.

### 3. Diff two points

```ts
const changes = await kernel.diffVersions({
  collection: 'articles',
  id,
  from: '2026-06-09T09:00:00Z', // a timestamp OR a versionId
  to: 'now-version-id',
})
// → { title: { from: 'Old', to: 'New' }, body: { from: …, to: … } }
```

Confirm exactly what changed before you act. Over REST: `GET /api/articles/ID/diff?from=&to=`.

### 4. Restore the good state

```ts
await kernel.restoreAsOf({ collection: 'articles', id, asOf: '2026-06-09T09:00:00Z' })
```

This rewrites the document's **content** to its as-of state through the normal validated update path — and records a new version, so the restore itself is auditable and reversible. Over REST: `POST /api/articles/ID/restore-as-of?asOf=<iso>`.

### 5. Trust the boundaries

- **Restore is content-only.** `_status` and system columns are never touched — a restore can **never** be a sneaky publish, and if you're an agent the draft-only brake still holds.
- **No access bypass.** Every historical read, diff, and restore runs the same access check + field redaction as a live read: if you can't read the document now, you can't read its past either; read-denied fields never appear in an `asOf` read or a diff; historical drafts stay hidden unless you pass `draft: true`.

Provide: «the collection + document, the symptom (bad edit / question / audit), and the rough time the content was last good».
