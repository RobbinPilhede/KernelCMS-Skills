---
name: scope-an-agent-safely
description: Choose a least-privilege `fieldScope.allow` and roles for a KernelCMS agent, and understand why draft-only + field-scope make it safe.
category: Agent workflows
tags: [security, fieldscope, least-privilege, roles, drafts]
difficulty: intermediate
---

# Scope an agent safely

**Use this when** you're deciding what an agent should be *allowed* to touch. The goal is least privilege: give it exactly the fields and roles its job needs, and nothing more. KernelCMS makes this safe by default — agents are draft-only and field-scoped at the engine level — but a well-chosen scope is still the difference between "drafts blog copy" and "could rewrite your pricing."

This is a config + judgment runbook for the human defining the agent, with the reasoning the choice rests on.

## Prompt

This skill is operational — apply the checklist when authoring an agent.

### Pick the role first

`roles` decide which collection-level access rules apply to the agent — the *exact same* rules a human in that role gets. Choose the narrowest role that grants read/create/update on the collections the agent works in.

- Never grant `admin` — it's rejected at startup, because it would widen every role-gated rule for a non-human caller.
- Prefer a purpose-built role (e.g. `content-bot`, `translator`) over a broad `editor` if your access rules can key off it.
- The role gates *which collections and rows*; it does **not** loosen field scope.

### Pick the field scope — deny-by-default

`fieldScope.allow` is a deny-by-default allow-list of **top-level** field names. Only those may be written; every other field is stripped from every create/update *before* per-field rules even run. Start from the question: *"What is the smallest set of fields this agent must write to do its job?"*

```ts
// A drafting bot: writes copy, nothing structural.
{ id: 'content-bot', token: process.env.CONTENT_BOT_TOKEN!,
  roles: ['editor'],
  fieldScope: { allow: ['title', 'slug', 'excerpt', 'body'] } }

// A page composer: also writes the page-builder field.
{ id: 'page-bot', token: process.env.PAGE_BOT_TOKEN!,
  roles: ['editor'],
  fieldScope: { allow: ['title', 'slug', 'layout'] } }
```

Rules of thumb:

- **Leave authority and lifecycle fields out.** Never put `roles`, `permissions`, `author`, `is_admin`, or anything that confers identity/ownership in `allow`. An agent scoped to `['title']` simply cannot set `roles` — even if no field rule mentions it.
- **`allow` over `deny`.** `deny` is the inverse (block these, allow the rest) — easy to under-specify when you add a sensitive field later. `allow` fails safe: a new field is denied until you opt it in.
- **A permitted group/array passes its subfields through.** Allowing `layout` lets the agent fill every block's fields inside it. Scope at the granularity you actually want.
- **One agent per job.** Don't widen one agent's scope to cover a second task — define a second agent with its own token and scope.

### What the guardrails give you for free

Two brakes live in `@kernel/core`, not the MCP adapter, so they hold no matter how the agent connects:

1. **Draft-only.** A born-published `create`, a `_status: published` write, a `publish()`, or a scheduled publish are all rejected for an agent principal. Publishing stays a human decision. So the *worst case* of an over-scoped agent is a bad draft a human reviews — never live content.
2. **Field scope, engine-enforced.** Stripping happens before per-field access rules, so an unscoped field can't be smuggled in via the MCP client (the tool schemas also use `additionalProperties: false`).

Field scope is what bounds the *blast radius* of a draft; draft-only is what keeps any mistake off the live site. Together they mean a compromised or confused agent can, at worst, produce reviewable drafts within a few named fields.

### Validate the scope

In a connected client, ask the agent to read `kernel://schema`, then try to set a field outside its scope (e.g. `roles`). Confirm the value doesn't land — it's silently stripped. Then confirm a normal draft write within scope succeeds.

## Example

You want a bot that drafts blog posts but must never touch ownership or SEO config. The `posts` collection has `title, slug, excerpt, body, author, seo, roles_allowed`. You define:

```ts
{ id: 'content-bot', token: process.env.CONTENT_BOT_TOKEN!,
  roles: ['editor'],
  fieldScope: { allow: ['title', 'slug', 'excerpt', 'body'] } }
```

The agent drafts freely across those four fields. When (inevitably) someone prompts it to "set the author to the CEO and publish," the `author` write is stripped (not in `allow`) and the publish is rejected (draft-only). The draft lands with just the copy fields set, for a human to finish and publish.

## Notes

- **`fieldScope` matches top-level field names.** Nested fields inside a permitted group/array ride along; scope the parent accordingly.
- **`collections` on an agent is informational** at the MCP layer — real enforcement is the access rules (via `roles`) plus `fieldScope`. Don't rely on it as a security boundary.
- **No `overrideAccess`, ever** on the agent path — there's no flag to bypass the pipeline, so you can't accidentally hand an agent more than its scope.
- **Custom endpoints with `mcp: true` are the one escape hatch:** an endpoint that calls `local.*` with `overrideAccess` runs *outside* the agent brakes. Never set `mcp: true` on such an endpoint. See the MCP docs.
- Pairs with **`connect-an-agent`** (wiring) and **`review-agent-drafts`** (the human gate at the other end).
