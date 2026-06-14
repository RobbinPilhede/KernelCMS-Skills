---
name: add-editorial-comments
description: Enable threaded editorial comments in KernelCMS so reviewers leave field-anchored or document-level feedback on a document — gated by that document's read access, with the author taken from the authenticated principal — instead of trading notes in a separate tool.
category: Content modeling
tags: [comments, review, editorial, collaboration, annotations]
difficulty: starter
---

# Add editorial comments

**Use this when** your editors and reviewers need to leave feedback *on the content itself* —
"tighten this intro", "who approved this price?", "ready to publish?" — and you're tired of
that conversation living in Slack, email, or a spreadsheet that nobody can tie back to the
document. Editorial comments thread right beside the content, anchored to a field or to the
whole document, and a reviewer resolves each one when it's addressed.

This is a configuration runbook.

## Prompt

This skill is operational — follow the runbook.

### 1. Enable comments

Comments are off until you opt in. Set `comments: true` on the config:

```ts
export default defineConfig({
  comments: true,
  collections: [/* … */],
})
```

This registers a private `_comments` system table. It is **not** reachable through generic
CRUD — comments are only ever touched through the dedicated operations below, which enforce
the access gate.

### 2. Add, thread, and anchor

```ts
// A field-anchored comment (omit `field` for a document-level note).
const comment = await kernel.addComment({
  collection: 'articles',
  id: article.id,
  body: 'tighten the intro',
  field: 'summary',
  req,                       // the principal authors the comment
})

// A threaded reply — validated to the SAME document.
await kernel.addComment({ collection: 'articles', id: article.id, body: 'agreed', parentId: comment.id, req })
```

`body` is required, trimmed, and length-bounded. `field`, when present, must name a real
field of the collection. The author (`authorId`/`authorType`) is recorded from the
authenticated principal — a forged `authorId` in the call is ignored.

### 3. List, count, resolve, delete

```ts
const open = await kernel.listComments({ collection: 'articles', id: article.id, req })          // oldest → newest, open only
const all = await kernel.listComments({ collection: 'articles', id: article.id, includeResolved: true, req })
const badge = await kernel.commentCount({ collection: 'articles', id: article.id, req })          // "N comments"

await kernel.resolveComment({ commentId: comment.id, req })                  // resolve (author or reviewer)
await kernel.resolveComment({ commentId: comment.id, resolved: false, req }) // reopen
await kernel.deleteComment({ commentId: comment.id, req })                   // delete (author or admin)
```

Resolve is allowed for the comment's **author** or a **reviewer** (roles include `admin` or
`editor`). Delete is stricter — the **author** or an **admin** only.

### 4. Wire it into the admin or app

Over REST (every route requires auth; an anonymous request is `401`):

```http
GET    /api/:collection/:id/comments?field=&includeResolved=   # list
POST   /api/:collection/:id/comments  { body, field?, parentId? }
PATCH  /api/_admin/comments/:commentId  { resolved? }
DELETE /api/_admin/comments/:commentId
```

Render `listComments` as a thread next to the field it's anchored to, show `commentCount` as
a badge, and let a reviewer resolve inline. The acting identity is always the server-resolved
principal — never a client-supplied author.

### 5. Trust the boundaries

The comment surface is held to the **same access bar as a read** — there is no looser path to
a comment than to the document it annotates.

- **Gated by document read access.** Every op (add / list / count / resolve / delete) checks
  the target document's `access.read` rule **and** its row-scope before returning a comment, a
  count, or mutating. A caller who can't read the document gets Forbidden/NotFound — never a
  comment, and never a hint the document exists. This holds for the anonymous Local-API path
  too: a null-user caller is held to the read rule, with no "no user = trusted" shortcut.
- **Author from the principal.** Recorded server-side; a forged `authorId` is ignored.
- **Resolve/delete re-gate on the live document** before the author/role check, so a document
  that fell out of scope is denied regardless of who wrote the comment.
- **Threading stays within one document**, ids are prototype-pollution-guarded, `_comments` is
  unreachable via generic CRUD, and create/resolve/delete are audited.

Provide: «the collections that need review comments, and who counts as a reviewer (the roles
allowed to resolve) in your model».
