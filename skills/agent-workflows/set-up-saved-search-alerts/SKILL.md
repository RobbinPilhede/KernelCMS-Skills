---
name: set-up-saved-search-alerts
description: Let editors (or agents) subscribe to a query in KernelCMS and get a webhook when matching content changes — access-scoped so an alert never fires for content the subscriber can't read.
category: Agent workflows
tags: [subscriptions, alerts, webhooks, realtime, notifications]
difficulty: intermediate
---

# Set up saved-search alerts

**Use this when** someone needs to know the moment content matching a query changes — "ping me
when any product goes out of stock", "notify legal when a published page mentions a recalled
SKU", "tell the on-call agent when a high-priority ticket lands". Instead of polling, an editor
subscribes once and KernelCMS delivers a webhook on each match.

This is a configuration runbook.

### 1. Turn it on

Saved-search alerts read the change feed and deliver through a webhook, so enable both:

```ts
export default defineConfig({
  realtime: { enabled: true },     // the change feed the alerts drain
  subscriptions: true,
  webhooks: [
    {
      slug: 'alerts',
      url: process.env.ALERTS_WEBHOOK_URL,
      // collections: [] makes it a subscription-ONLY target — it never also fires on a
      // content write, so there's no double-send.
      collections: [],
    },
  ],
  collections: [/* … */],
})
```

### 2. Subscribe to a query

```ts
const sub = await kernel.createSubscription({
  collection: 'products',
  where: { stock: { equals: 0 } }, // optional — omit to alert on ANY change to the collection
  webhook: 'alerts',               // a configured webhook slug (not an arbitrary URL)
  req,                             // the subscriber owns the subscription
})
```

Over REST (owner-scoped, auth required):

```bash
curl -X POST "http://localhost:3000/api/_admin/subscriptions" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"collection":"products","where":{"stock":{"equals":0}},"webhook":"alerts"}'
curl "http://localhost:3000/api/_admin/subscriptions" -H "Authorization: Bearer $TOKEN"   # your own
curl -X DELETE "http://localhost:3000/api/_admin/subscriptions/$ID" -H "Authorization: Bearer $TOKEN"
```

### 3. Run the drain

Delivery is cron-driven (no HTTP trigger). Schedule one of:

```bash
kernel jobs:run          # background jobs + scheduled publishes/releases + expiry + alerts + webhooks
kernel subscriptions:run # just the saved-search alerts
```

Each run reads new changes since every subscription's cursor, re-matches them, and queues a
webhook delivery (sent by the webhook outbox with retry/backoff) per match. The receiver gets
the standard webhook payload (`event`, `collection`, `id`, `doc`, `timestamp`).

### 4. Trust the boundaries

- **Access-scoped — the core guarantee.** The drain re-loads each changed document **as the
  subscription's owner** (the access-checked read) and matches the `where` against that result.
  An alert therefore never fires for content the owner can't currently read, and the payload is
  field-access-stripped + encrypted-field-redacted exactly like a normal read. An uncaptured
  claim fails closed (you might miss an alert; you never get one you shouldn't).
- **No arbitrary delivery URLs.** A subscription targets a configured webhook **slug**, whose
  URL was SSRF-guarded at config load — a subscriber can't aim an alert at an internal host.
- **Owned + bounded.** A subscription is owned by its creator (recorded from the principal);
  only the owner or an admin manages it. It starts from "now" (no history backfill), deletes
  don't alert, each drain is bounded, and create/delete are audited.

Provide: «the collections + queries people want to be alerted on, the receiver URL(s) for the
alerts webhook, and who should be able to subscribe».
