---
name: sync-content-between-environments
description: Promote content from one KernelCMS environment to another (staging → prod, or keep two instances in sync) by exporting a portable, id-preserving bundle and applying it with a dry-run diff — every change access-checked, validated, and publish-gated.
category: Agent workflows
tags: [federation, sync, environments, migration, deployment]
difficulty: intermediate
---

# Sync content between environments

**Use this when** content lives in more than one place — an editor previews on staging and you
need to push the approved set to production, or two instances should hold the same reference
content — and copy-pasting (or a raw DB dump) would lose identity, skip your access rules, or
publish things that shouldn't go live.

This is a configuration runbook.

### 1. Turn it on (in both environments)

```ts
export default defineConfig({ federation: true, collections: [/* … */] })
```

Federation is admin-only over REST.

### 2. Export a bundle from the source

```ts
// Local API
const bundle = await source.exportContent({ collection: 'pages', draft: true })
// REST: GET /api/_admin/federation/export?collection=pages&draft=true   (admin)
```

The bundle is portable and deterministic — `{ version: 1, documents: [{ collection, id, data }] }`,
sorted by id. It contains only documents you can read (access-checked), with the stable id and
publish state preserved so the target keeps the same identity. Narrow it with `ids=` or a `where`.

### 3. Dry-run the sync into the target

```ts
const plan = await target.syncContent({ bundle, dryRun: true })
// → { plan: [{ collection, id, action: 'create' | 'update' | 'unchanged' }], created, updated, unchanged, dryRun: true }
```

The dry run computes exactly what would change — without writing a thing. Review it, then apply.

### 4. Apply it

```ts
const result = await target.syncContent({ bundle })
// REST: POST /api/_admin/federation/sync  { bundle, dryRun? }
// → { created, updated, unchanged, failed: [{ collection, id, reason }], plan }
```

Each document is created (preserving its id) if missing, updated if a field differs, or left
alone if identical. Re-running the same bundle is **idempotent** (all `unchanged`). Anything that
fails to apply (access, validation, publish gate) lands in `failed[]` — the rest still go through.

### 5. Trust the boundaries

- **Identity preserved.** A document keeps the same id across environments, so references and
  links stay intact and re-syncs target the right rows.
- **Sync can't elevate.** Every applied document runs through the normal access-checked
  create/update — access, validation, and the publish gate (including the agent draft-only
  brake) all enforce. A bundle can't publish something the syncing principal couldn't, write a
  field they can't, or set a system column.
- **Access-checked export.** You only ever export documents you can read; auth secrets and
  internal columns never enter a bundle.
- **Preview before you commit.** The dry run shows the full create/update/unchanged plan with no
  writes; admin-only over REST; the per-sync size is bounded.

Provide: «the source and target environments, the collections/documents to promote, and whether
you want a dry-run review before applying».
