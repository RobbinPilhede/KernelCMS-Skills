---
name: set-up-multi-tenancy
description: Run many clients/sites on one KernelCMS instance with airtight per-tenant isolation — auto-scope collections by the authenticated principal's tenant, with no per-collection access boilerplate.
category: Content modeling
tags: [multi-tenancy, saas, isolation, access-control, tenants]
difficulty: advanced
---

# Set up multi-tenancy

**Use this when** you're building a SaaS on KernelCMS, or an agency running dozens of client sites on one instance, and each tenant must see only their own content. KernelCMS scopes content per tenant automatically, enforced by the same access pipeline that protects everything else — no hand-written access rule on every collection.

This is a configuration runbook.

## Prompt

This skill is operational — follow the runbook.

### 1. Give your users a tenant

The acting tenant is read from the authenticated principal — `req.user.tenant`. Put a `tenant` on your user records (set it when you provision a user; gate it admin-only so users can't change their own):

```ts
{
  slug: 'users',
  auth: true,
  fields: [
    { name: 'tenant', type: 'text', access: { update: ({ req }) => req.user?.roles?.includes('admin') ?? false } },
  ],
}
```

(Or supply a custom `resolve(req)` — but it MUST derive from trusted/authenticated state, e.g. a subdomain mapped to a verified tenant — **never** raw client input.)

### 2. Turn on tenancy

```ts
export default defineConfig({
  tenancy: {
    field: 'tenant',           // the server-managed scope field (default 'tenant')
    collections: ['posts', 'media'], // omit to scope all non-system, non-auth collections
    requireTenant: true,       // a tenant-less principal sees nothing (fail-closed)
  },
})
```

That's it. KernelCMS auto-adds the `tenant` field to each scoped collection, auto-injects a tenant scope into read/create/update/delete (AND-combined with your own access rules), auto-stamps the tenant on create, and makes it immutable on update.

### 3. What you get, for free

- **Isolation:** a tenant-A user can never read, list, count, update, or delete tenant-B content. `find` returns only their tenant; `findByID` of a foreign doc → not found.
- **Anti-spoof:** the tenant is stamped from `req.user.tenant`, never client input. A client passing `tenant: 'other'` on create gets it overridden; you can't move a doc across tenants on update.
- **Fail-closed:** a principal with no tenant claim sees nothing in scoped collections (non-scoped public collections are unaffected).
- **No populate leak:** a relationship pointing at another tenant's doc resolves to a bare id, never the content.

### 4. The escape hatch

`overrideAccess` (server/system calls — migrations, admin tooling, seed scripts) sees across all tenants. That's the single, documented bypass — keep it to trusted server code.

### 5. Verify your isolation

Authenticate as two users in different tenants, have each create + read content, and confirm neither sees the other's. (KernelCMS is red-teamed for this — 35 cross-tenant attack vectors, zero leaks — but verify your own access rules compose as intended.)

Provide: «which collections are per-tenant, how a user's tenant is set (claim/subdomain), and whether tenant-less access should be denied».
