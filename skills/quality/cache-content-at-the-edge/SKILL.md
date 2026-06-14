---
name: cache-content-at-the-edge
description: Serve KernelCMS content fast from a CDN with surrogate cache tags, and purge exactly the changed pages on every write via the change-driven purge feed — without ever caching private content at the edge.
category: Quality
tags: [edge, cdn, cache, surrogate-keys, purge, performance]
difficulty: advanced
---

# Cache content at the edge

**Use this when** you want CDN-fast, global content delivery but can't tolerate stale pages — turn caching all the way up and invalidate precisely what changed on every edit. KernelCMS tags public reads with surrogate keys and gives you a purge feed driven by the real-time change log.

This is a wiring runbook (the CDN integration is yours; KernelCMS emits the tags + purge list).

## Prompt

This skill is operational — follow the runbook. (The purge feed also needs `realtime: { enabled: true }`.)

### 1. Turn it on

```ts
export default defineConfig({
  realtime: { enabled: true },
  edge: {
    enabled: true,
    cacheControl: 'public, s-maxage=31536000, stale-while-revalidate=60',
    includeRelationships: true, // changing a referenced doc purges the pages that reference it
  },
})
```

Now `GET /api/:collection/:id` (and list reads) carry your `Cache-Control` and a `Surrogate-Key` header (`articles articles:ID authors:AUTHORID`) — **only for cacheable responses** (anonymous, published, non-time-travel reads). Authenticated / draft / scoped / `asOf` reads return `Cache-Control: private, no-store` and no tag, so private content is never cached at the edge.

### 2. Point your CDN at the tags

Your CDN caches by the surrogate key. The header KernelCMS emits maps directly to:
- **Fastly** `Surrogate-Key` (native), or
- **Cloudflare** `Cache-Tag` (set `tagHeader: 'Cache-Tag'` in config), or
- any reverse proxy / Varnish keyed on the surrogate header.

### 3. Purge exactly what changed

Run a small worker (cron or queue) that polls the purge feed and tells your CDN to evict those keys:

```ts
let cursor = 0
setInterval(async () => {
  const { tags, cursor: next } = await kernel.purgeFeed({ since: cursor })
  if (tags.length) await cdn.purgeSurrogateKeys(tags) // your CDN's purge API
  cursor = next
}, 2000)
```

`purgeFeed` maps recent changes to the affected tags — including documents that *reference* a changed one — so a single edit evicts the page and everything that embeds it, and nothing else. Over REST (admin-gated): `GET /api/_edge/purge?since=<cursor>`. Or push in-process with `kernel.onPurge(fn)`.

### 4. Trust the boundary

The make-or-break property is enforced by construction: a response is publicly cacheable **only** when it's anonymous, published, not a draft, not a time-travel (`asOf`) read, and not an override — otherwise it's `private, no-store` with no tag. So a CDN can never serve one user's private content to another. Cache tags only ever name ids from the access-checked returned documents; header values are sanitized against injection; the purge feed is admin-gated and bounded.

Provide: «your CDN (Fastly/Cloudflare/other), the cache lifetime you want, and whether referenced docs should purge their referencing pages».
