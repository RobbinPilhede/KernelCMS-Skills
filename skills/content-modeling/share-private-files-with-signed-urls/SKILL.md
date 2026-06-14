---
name: share-private-files-with-signed-urls
description: Hand someone a private upload from KernelCMS without giving them a login — mint a signed, expiring capability URL (HMAC + expiry) that fetches one file until it lapses, for emailing a download, embedding a time-limited image, or feeding a service that can't authenticate.
category: Content modeling
tags: [uploads, media, signed-urls, capability, security]
difficulty: starter
---

# Share private files with signed URLs

**Use this when** a file lives behind your access rules — a customer's invoice, a paid
download, a private image — and you need to give exactly one person (or service) time-limited
access to it *without* creating an account or a session for them. A signed asset URL is a
bearer capability: whoever holds the link can fetch that one file until it expires.

This is a configuration runbook.

## Prompt

This skill is operational — follow the runbook.

### 1. Understand the default

An upload collection's file URL is normally served with a **per-request access check** against
the caller's session — private media stays private, an anonymous request gets a 404. That's the
right default for your own app. A **signed URL** is the escape hatch for sharing *outside* a
session.

### 2. Mint a signed URL

```ts
// Local API — access-checked: you can only link a file you can read.
const url = await kernel.signedAssetUrl({
  collection: 'invoices',
  id: invoice.id,
  ttl: 600, // seconds (default 3600, max 7 days)
  req,
})
// → "/files/invoices/ab12.../april.pdf?exp=1718500000&sig=Yk3…"
```

Over REST (access-checked as the caller):

```bash
curl "http://localhost:3000/api/invoices/$ID/signed-url?ttl=600" \
  -H "Authorization: Bearer $TOKEN"
# → { "url": "/files/invoices/…?exp=…&sig=…" }
```

### 3. Hand it over

The receiver just GETs the URL — no auth header, no session:

```bash
curl -L "https://your-app.com/files/invoices/…?exp=…&sig=…" -o april.pdf
```

The server validates the HMAC + expiry and streams the file. A tampered or expired link gets
`403`; a link with no signature falls back to the normal session check.

### 4. Choose a TTL deliberately

A signed link is a **capability**: anyone it's forwarded to can use it until `exp`. So:

- Use the **shortest TTL** that fits the use case — a few minutes for a sensitive download, an
  hour for an embedded image.
- There is **no per-link revocation**. The only kill-switch is rotating `config.secret`, which
  invalidates *all* outstanding links at once.
- Don't put a signed URL somewhere it gets cached/indexed publicly.

### 5. S3 and other adapters

When your storage adapter mints its own signed URLs (e.g. S3 presigned GETs), `signedAssetUrl`
delegates to it — you get the adapter's native presign with the same `ttl`, no extra setup.

### 6. Trust the boundaries

- **Unforgeable + un-extendable.** The HMAC is keyed by the server-only `config.secret` and
  covers BOTH the storage key and the expiry, compared in constant time — you can't forge a
  link without the secret, swap it onto another file, or push the expiry out.
- **Minting needs read access.** You can only mint a link for a document you can read; the
  secret never appears in the URL.
- **No silent fallback.** A present-but-invalid/expired signature is rejected (403), never
  quietly downgraded to serve.
- **Bytes don't outlive the row.** Deleting the document sweeps the file (and its image
  derivatives) from storage, so a stale link can't serve a deleted file.

Provide: «the upload collection(s) holding private files, who you need to share them with and
how (email link, embed, service-to-service), and how long each link should live».
