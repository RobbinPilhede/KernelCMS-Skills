---
name: work-on-a-content-branch
description: Stage a set of content edits on a named branch in KernelCMS without touching the live documents — preview and diff the branch, then merge it (each change replayed through the access-checked update) or discard it. Git-for-content.
category: Content modeling
tags: [branches, staging, git-for-content, preview, review]
difficulty: intermediate
---

# Work on a content branch

**Use this when** you're preparing a set of changes that should go live together — a homepage
refresh, a campaign rollout, a coordinated copy edit across many pages — and you want to build
and review them off to the side, see exactly what will change, and flip them all at once,
instead of editing live documents one risky save at a time.

This is a configuration runbook.

### 1. Turn it on

```ts
export default defineConfig({ branches: true, collections: [/* … */] })
```

Managing branches is reviewer-gated (admin/editor).

### 2. Open a branch and stage edits

```ts
const branch = await kernel.createBranch({ name: 'homepage-refresh', req })
// Stage a field edit — the LIVE document is NOT touched (copy-on-write).
await kernel.stageChange({
  branch: 'homepage-refresh',
  collection: 'pages',
  id: homepage.id,
  data: { hero: 'New hero copy', cta: 'Start free' },
  req,
})
```

You can stage edits to many documents on one branch; re-staging the same document deep-merges.
Staging requires update access to the target document.

### 3. Preview & diff before committing

```ts
const preview = await kernel.previewBranch({ branch: 'homepage-refresh', collection: 'pages', id: homepage.id, req })
// → the live document with the branch's staged edits applied (the rest of the doc is live)
const changes = await kernel.diffBranch({ branch: 'homepage-refresh', req })
// → [{ collection: 'pages', documentId, fields: ['hero', 'cta'] }, …]
```

Over REST (reviewer-gated): `GET /api/_admin/branches/:name/preview?collection=&id=`,
`GET /api/_admin/branches/:name/diff`.

### 4. Merge or discard

```ts
const result = await kernel.mergeBranch({ branch: 'homepage-refresh', req })
// → { merged: ['pages:<id>', …], failed: [{ collection, documentId, reason }] }
// or:
await kernel.discardBranch({ branch: 'homepage-refresh', req })
```

Merge **replays each staged change through the normal `update`** — so the publish gate, field
access, and validation all apply as the merging reviewer. A change that fails lands in `failed[]`
(it isn't applied; the live doc is untouched) while the rest go through. After a merge the branch
is `merged` and the overlay is dropped — re-create the branch to retry any failures.

### 5. Trust the boundaries

- **Copy-on-write.** Branch edits live in a separate overlay (`_branches` + `_branch_docs`); the
  live read/write path is never touched until you merge. Preview/diff don't change anything.
- **Merge can't bypass the rules.** Every staged change is applied through the access-checked
  `update`: the publish gate (an agent can never merge-publish), field-level access, and
  validation all enforce. A branch can't smuggle a `_status` or a system/auth column.
- **Reviewer-gated + audited.** create/merge/discard require admin/editor; staging requires
  update access to the target; the system tables are unreachable via generic CRUD.

Provide: «the coordinated set of content changes you want to prepare and ship together, and the
collections/documents involved».
