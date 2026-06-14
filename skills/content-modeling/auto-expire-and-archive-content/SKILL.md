---
name: auto-expire-and-archive-content
description: Give KernelCMS content an expiry — automatically unpublish, archive, or delete it when a date passes, via a trusted cron drain. For embargoes, time-limited campaigns, retention, and stale-content cleanup.
category: Content modeling
tags: [lifecycle, expiry, archive, retention, scheduling, embargo]
difficulty: intermediate
---

# Auto-expire and archive content

**Use this when** content shouldn't live forever — a promo that ends Friday, a notice that's only valid this quarter, records you must purge after N days, or pages that go stale. KernelCMS retires content automatically when its expiry passes (the inverse of scheduled publish).

This is a configuration runbook.

## Prompt

This skill is operational — follow the runbook.

### 1. Declare an expiry date field

You own the schema — add a `date` field to the collection that should expire:

```ts
{
  slug: 'promos',
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text' },
    { name: 'expire_at', type: 'date' }, // editors set when this promo ends
  ],
}
```

### 2. Configure the lifecycle policy

```ts
export default defineConfig({
  lifecycle: {
    collections: [
      { slug: 'promos', expireField: 'expire_at', onExpire: 'unpublish' }, // → back to draft
      { slug: 'notices', expireField: 'expire_at', onExpire: 'archive' },   // → draft + _archived_at
      { slug: 'temp_logs', expireField: 'expire_at', onExpire: 'delete' },  // → removed
    ],
  },
})
```

- **`unpublish`** — the content goes back to draft (recoverable).
- **`archive`** — draft **plus** a server-managed `_archived_at` timestamp, so it's hidden from public reads and distinguishable from a normal draft (great for "expired but keep the record").
- **`delete`** — the document is removed (retention/compliance).

### 3. Run the drain on a cron

The expiry drain is a trusted, operator-only operation — there's no HTTP trigger. Run it on a schedule:

```bash
# drains scheduled publishes, scheduled releases, AND content lifecycle:
npx kernel jobs:run
# or just the lifecycle:
npx kernel lifecycle:run
```

(Or call `await kernel.processContentLifecycle()` from your own scheduled task.) Every retirement is audited as `content.expire`.

### 4. Trust the boundaries

The drain runs with full authority *because* it's cron/operator-only, not exposed to the web. The `_archived_at` marker is server-managed and **client-immutable** — a normal user can never fake-archive or un-archive content through the API. Editors can only set `expire_at` on content they can already write, and the drain only ever touches the collections you list.

Provide: «which collections expire, the date field, and what should happen when they do (unpublish / archive / delete)».
