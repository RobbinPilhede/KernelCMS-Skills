---
name: encrypt-sensitive-fields
description: Encrypt PII or secrets at rest in KernelCMS by marking a field `encrypted: true` — transparent AES-256-GCM (encrypted on write, decrypted on read) with the plaintext kept out of versions, webhooks, search, and SEO surfaces.
category: Content modeling
tags: [encryption, security, pii, compliance, at-rest]
difficulty: intermediate
---

# Encrypt sensitive fields

**Use this when** a collection holds data that should be unreadable in the database itself — a
government ID, an API token, a health note, anything a stolen backup or a curious DBA must not
see in cleartext. Mark the field `encrypted: true` and KernelCMS encrypts it transparently: your
code reads and writes plaintext, the storage column holds authenticated ciphertext.

This is a configuration runbook.

## Prompt

This skill is operational — follow the runbook.

### 1. Provide a key and mark the fields

```ts
export default defineConfig({
  encryption: { key: process.env.FIELD_ENCRYPTION_KEY }, // ≥16 random chars, from env
  collections: [
    {
      slug: 'people',
      fields: [
        { name: 'name', type: 'text' },
        { name: 'ssn', type: 'text', encrypted: true },
        { name: 'notes', type: 'json', encrypted: true },
      ],
    },
  ],
})
```

The value is AES-256-GCM encrypted on write and decrypted on read — the column stores an
`enc:1:<iv>:<tag>:<ciphertext>` envelope with a fresh IV per value (the same plaintext encrypts
differently each time). Works for any storage field type (the plaintext is JSON-serialized
first).

### 2. Know what you give up

Ciphertext is opaque and non-deterministic, so an encrypted field **cannot** be:

- `unique` or `index`ed,
- filtered or sorted on (`where: { ssn: ... }` is rejected),
- full-text searched (`search.fields`),
- `localized` or `personalized`,
- a relationship, or nested inside a group/array/blocks.

Each of these is rejected at config load — so you find out immediately, not in production. Keep
a plaintext lookup field (e.g. a hashed or last-4 value) alongside if you need to query.

### 3. Manage the key like a database credential

- Read `encryption.key` from an environment secret; never hardcode or commit it.
- **Rotating or losing the key makes existing ciphertext unreadable** (a hard `DecryptionError`
  on read). There is no built-in re-encryption — plan key management before you store data.
- Use a long, random key. The 256-bit AES key is derived from it via SHA-256, so it should be
  high-entropy, not a human passphrase.

### 4. Trust the boundaries

- **Authenticated at rest.** AES-256-GCM with a per-value IV; tampering or a wrong key is a
  detectable `DecryptionError`, never silent garbage. The storage column never holds plaintext.
- **No plaintext leaks out.** Version snapshots store ciphertext (decrypted only on an
  access-checked version read); webhook payloads redact encrypted fields; JSON-LD / structured
  data / discoverability (llms.txt) never publish an encrypted field. So an encrypted field
  can't slip into history, an external receiver, or an anonymous SEO/AI surface.
- **Field access still applies.** Add `access.read` to an encrypted field and a denied reader
  gets null — never the ciphertext, never the plaintext. Encryption protects at rest;
  field-access controls who sees it.
- **Server-only key.** The key (and the derived AES key) is never logged, returned, or
  serialized.

Provide: «the collections + fields holding sensitive data, where the encryption key will live
(env/secret manager), and any plaintext lookup field you need to keep for querying».
