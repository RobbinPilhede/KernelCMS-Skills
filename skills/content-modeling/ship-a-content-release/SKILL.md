---
name: ship-a-content-release
description: Stage a coordinated set of draft changes into a named KernelCMS release and publish them atomically (or on a schedule) — with an all-or-nothing pre-flight so a launch never ships half-broken.
category: Content modeling
tags: [releases, publishing, launch, campaign, atomic, scheduled]
difficulty: intermediate
---

# Ship a content release

**Use this when** a launch or campaign spans several documents that must go live *together* — a landing page, three blog posts, and an updated pricing page — and shipping them one at a time would leave the site half-updated. A release bundles drafts and publishes them as one atomic unit.

This is an operational runbook.

## Prompt

This skill is operational — follow the runbook. (Enable it once with `releases: true` in your config.)

### 1. Create a release and stage your drafts

```ts
const release = await kernel.createRelease({ name: 'Spring launch' })
await kernel.addToRelease({ release: release.id, collection: 'pages', id: landingId })
await kernel.addToRelease({ release: release.id, collection: 'articles', id: postId })
await kernel.addToRelease({ release: release.id, collection: 'globals', id: pricingId })
```

Members are draft documents. You can only add docs you can read, and only to an `open` release. Over REST: `POST /api/_admin/releases` then `POST /api/_admin/releases/:id/items`.

### 2. Preview the whole bundle

```ts
const { items } = await kernel.previewRelease({ release: release.id })
// each item is the member in its draft state — review the launch as it WILL look
```

### 3. Publish it — atomically

```ts
const result = await kernel.publishRelease({ release: release.id })
// { status: 'published', published: [...], failed: [] }
```

Before anything goes live, the release **dry-runs the publish gate for every member**: per-document publish access, the agent draft-only brake, and your blocking content-CI evals against the current drafts. If *any* member would fail, **none** are published — you get `failed` with the reasons and the release stays `open`. A launch never ships half-broken. Over REST: `POST /api/_admin/releases/:id/publish`.

### 4. Or schedule it

```ts
await kernel.scheduleRelease({ release: release.id, at: '2026-07-01T09:00:00Z' })
```

A cron drain publishes it when due — add `kernel.processScheduledReleases()` next to `processScheduledPublishes()` in your `kernel jobs:run` (or scheduled task). Publishability is gate-checked at schedule time, and the eval gate is re-checked on the drain.

### 5. Trust the boundaries

Publishing a release uses the **exact same per-document publish gate** as a direct publish — you can only publish a release whose every member you could publish yourself, an agent can never publish a release, and you can't pull a document you can't read into one. The all-or-nothing pre-flight prevents a partial go-live (a mid-publish infrastructure fault marks the release `failed` and reports exactly which members went live).

Provide: «the launch/campaign, the documents that must ship together, and whether to publish now or schedule it».
