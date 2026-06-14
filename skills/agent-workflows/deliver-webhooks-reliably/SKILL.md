---
name: deliver-webhooks-reliably
description: Wire up outbound webhooks in KernelCMS so content changes notify your stack — with durable at-least-once delivery (an outbox + cron-drained retry/backoff), HMAC signing, an SSRF egress guard, and an admin delivery log — instead of best-effort fire-and-forget.
category: Agent workflows
tags: [webhooks, integrations, events, delivery, ssrf]
difficulty: intermediate
---

# Deliver webhooks reliably

**Use this when** something outside KernelCMS needs to react to content — rebuild a static
site, reindex a search engine, post to Slack, sync a downstream system — and you can't afford
to silently drop events when the receiver is briefly down. KernelCMS fires a signed HTTP POST
on every create/update/delete; durable mode adds an outbox + retry so delivery is at-least-once.

This is a configuration runbook.

## Prompt

This skill is operational — follow the runbook.

### 1. Declare the endpoints

```ts
export default defineConfig({
  webhooks: [
    {
      slug: 'site_rebuild',                 // stable id (keys the delivery log); derived if omitted
      url: 'https://hooks.example.com/rebuild',
      secret: process.env.WEBHOOK_SECRET,   // HMAC signing key — from env, never hardcode
      collections: ['pages', 'posts'],      // default: all non-system collections
      events: ['create', 'update', 'delete'],
      durable: true,                        // outbox + retry (vs. best-effort inline)
      maxAttempts: 5,                       // give up after N tries (1–20, default 5)
    },
  ],
})
```

The destination URL must be `http(s)` and is **SSRF-guarded at config load**: a host on a
loopback/private/link-local/cloud-metadata network (incl. IPv4-mapped / NAT64 IPv6 forms) is
rejected unless that endpoint sets `allowPrivateNetwork: true` (for a trusted internal receiver
or local dev).

### 2. Choose inline vs. durable

- **Inline (default, no `durable`):** the POST fires on the write with a short timeout. It never
  fails or slows the write — but an event is **dropped** if the receiver is down. Fine for
  best-effort notifications.
- **Durable (`durable: true`):** the write enqueues to the `_webhook_deliveries` outbox; the
  cron drain delivers with exponential backoff up to `maxAttempts`. Use this whenever a missed
  event would be a problem.

### 3. Run the drain (durable mode)

The drain is a trusted cron op — there is no HTTP trigger. Schedule one of:

```bash
kernel jobs:run       # background jobs + scheduled publishes/releases + expiry + webhook delivery
kernel webhooks:run   # just the webhook outbox
```

Or call `kernel.processWebhooks()` from your own scheduler. Each due delivery becomes
`delivered`, `failed` (retried after backoff), or `exhausted` (hit `maxAttempts`).

### 4. Verify the signature on the receiver

When `secret` is set, each POST carries `x-kernel-signature: sha256=<hmac>` over the raw body:

```ts
import { createHmac, timingSafeEqual } from 'node:crypto'
function verify(rawBody: string, header: string, secret: string): boolean {
  const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`
  const a = Buffer.from(header), b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
```

Durable delivery is **at-least-once**, so make your receiver idempotent — dedupe on the
payload's `id` + `event` + `timestamp`.

### 5. Observe + retry from the admin

```http
GET  /api/_admin/webhooks                              # configured endpoints (REDACTED — no secret)
GET  /api/_admin/webhooks/deliveries?webhook=&status=  # the durable delivery log
POST /api/_admin/webhooks/deliveries/:id/retry         # requeue a failed/exhausted delivery
```

All admin-only. The Local API mirrors these (`kernel.listWebhooks`, `kernel.webhookDeliveries`,
`kernel.retryWebhookDelivery`).

### 6. Trust the boundaries

- **SSRF default-deny.** Outbound POSTs can't be aimed at internal/loopback/metadata hosts
  (literal IPv4, IPv4-mapped IPv6, NAT64) unless an endpoint explicitly opts in; deliveries use
  `redirect: 'manual'` so a receiver can't 3xx-redirect a POST into a private host.
- **Secret never leaks.** The signing secret and custom headers are never returned by the admin
  surface, stored in the delivery log, or logged.
- **Bounded + audited.** Retries stop at `maxAttempts`; the `_webhook_deliveries` outbox is
  unreachable via generic CRUD; the admin surface is admin-only; deliveries are audited.

Provide: «the content changes that should notify your stack, the receiver URL(s), whether a
missed event is tolerable (inline) or not (durable), and the signing secret».
