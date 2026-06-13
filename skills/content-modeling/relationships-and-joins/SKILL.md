---
name: relationships-and-joins
description: Model relationships in KernelCMS — single/many, polymorphic relationTo, reverse join fields, and choosing onDelete (setNull/cascade/restrict) correctly.
category: Content modeling
tags: [relationships, joins, polymorphic, on-delete, referential-integrity]
difficulty: advanced
---

# Relationships and joins

**Use this when** you want an agent to get the *relationship layer* of a KernelCMS model right: one-to-one vs. one-to-many, polymorphic references, virtual reverse `join` fields, and — the part people get wrong — choosing the correct `onDelete` action so deletes don't dangle, orphan, or silently destroy data. The output is relationship-field config and the reasoning behind each choice.

## Prompt

> You are designing the relationship layer of a KernelCMS model as config-as-code. Use the real relationship primitives only:
>
> **1. Forward relationships** (`type: 'relationship'`, or `'upload'` for files):
> ```ts
> { name: 'author', type: 'relationship', relationTo: 'authors' }          // single
> { name: 'tags',   type: 'relationship', relationTo: 'tags', hasMany: true } // many
> ```
> Stored as the target id (or an array of ids). The FK column is **indexed by default** — no manual `index: true` needed for lookups/population.
>
> **2. Polymorphic** — point at several collections; values are stored/returned as `{ relationTo, value }` so the target is explicit:
> ```ts
> { name: 'related', type: 'relationship', relationTo: ['posts', 'pages'], hasMany: true }
> // → [{ relationTo: 'posts', value: 'p_01' }, { relationTo: 'pages', value: 'pg_07' }]
> ```
> Use when a field genuinely references different kinds (a comment on a post *or* a page; a "related content" picker). Don't reach for it when one collection suffices.
>
> **3. Reverse `join`** — a *virtual* reverse relationship; nothing is stored. It resolves at read time by querying the related collection for rows pointing back, **only when `depth > 0`**:
> ```ts
> // on 'authors': list this author's posts (posts.author → this author)
> { type: 'join', name: 'posts', collection: 'posts', on: 'author', limit: 100 }
> ```
> Order follows the *related* collection's `admin.defaultSort` — set it for deterministic join order. Rows the caller can't read are silently omitted (access-checked). Use a `join` for "list the children/back-references of X" instead of duplicating the link on both sides.
>
> **4. `onDelete` — choose deliberately for every forward relationship.** It decides what happens to *this* referring field when its target is deleted. Default (unset) = **dangling reference** (left as-is; `populate` tolerates a missing target). Options:
> - **`setNull`** — clear the reference (or pull the id from a `hasMany` list). Use when the referrer should *survive* without the target. (post → author: deleting an author shouldn't delete posts.)
> - **`cascade`** — delete the referring document too. Use when the referrer *cannot exist* without the target. (variant → product, comment → post: an orphan is meaningless.) Cascades run through the normal delete pipeline (access + hooks), with cycle protection — never a raw row drop.
> - **`restrict`** — block the target's deletion while any referrer exists. Use to protect integrity. (don't let a category be deleted while posts reference it — force reassignment first.)
>
> **The decision rule:** *"If the target vanishes, should this document die (`cascade`), lose the link (`setNull`), or be protected (`restrict`)?"* Answer per field — the right action differs by direction.
>
> **5. Population depth.** Relationships return ids; pass `depth` to expand (each level decrements). Joins populate only at `depth > 0`.
>
> Output the relationship fields with an explicit `onDelete` (or a stated reason for leaving it dangling) on each, plus where you used a `join` instead of a stored reverse link, and any polymorphic field with its justification.

## Example

**Brief:** "Posts have an author and many categories. Comments belong to a post. Products have variants. A 'related content' field can point at posts or pages. Deleting an author shouldn't delete posts; deleting a post should delete its comments; you must not be able to delete a category that's still in use."

The agent emits (excerpt):

```ts
collections: [
  {
    slug: 'authors',
    fields: [
      { name: 'name', type: 'text', required: true },
      // reverse: list this author's posts (virtual, depth>0 only)
      { type: 'join', name: 'posts', collection: 'posts', on: 'author', limit: 100 },
    ],
  },
  {
    slug: 'categories',
    fields: [{ name: 'name', type: 'text', required: true }],
  },
  {
    slug: 'posts',
    admin: { defaultSort: '-createdAt' }, // → the authors.posts join inherits this order
    fields: [
      // deleting an author must NOT delete posts → drop the link
      { name: 'author', type: 'relationship', relationTo: 'authors', onDelete: 'setNull' },
      // a category in use can't be deleted → force reassignment first
      { name: 'categories', type: 'relationship', relationTo: 'categories', hasMany: true, onDelete: 'restrict' },
      // related content across two kinds → polymorphic
      { name: 'related', type: 'relationship', relationTo: ['posts', 'pages'], hasMany: true, onDelete: 'setNull' },
    ],
  },
  {
    slug: 'comments',
    fields: [
      // a comment can't exist without its post → cascade
      { name: 'post', type: 'relationship', relationTo: 'posts', required: true, onDelete: 'cascade' },
      { name: 'body', type: 'textarea', required: true },
    ],
  },
  {
    slug: 'products',
    fields: [
      { name: 'title', type: 'text', required: true },
      { type: 'join', name: 'variants', collection: 'variants', on: 'product', limit: 100 },
    ],
  },
  {
    slug: 'variants',
    fields: [
      // an orphan variant is meaningless → cascade with the product
      { name: 'product', type: 'relationship', relationTo: 'products', required: true, onDelete: 'cascade' },
      { name: 'sku', type: 'text', required: true, unique: true },
    ],
  },
]
```

**Rationale (abridged):**
- `post.author` → **`setNull`**: posts outlive authors; `cascade` here would silently delete an author's entire body of work.
- `post.categories` → **`restrict`**: protects taxonomy integrity — you can't delete a category that's still classifying posts; reassign first.
- `comment.post` and `variant.product` → **`cascade`**: a comment with no post and a variant with no product are meaningless orphans, so they die with the parent. Cascade runs the child's delete access + hooks.
- `related` → polymorphic `['posts','pages']` because it genuinely references two kinds; `setNull` pulls a deleted target from the list.
- `authors.posts` and `products.variants` are **`join`s** (virtual reverse) — no duplicated stored link, ordered by the related collection's `defaultSort`, access-checked, populated only at `depth > 0`.

## Notes

- **`onDelete` per field, by direction.** Ask "if the target dies, should this doc die / lose the link / be protected?" → `cascade` / `setNull` / `restrict`. Leaving it unset = a dangling reference (sometimes fine, but make it a *choice*).
- **Cascade is safe-ish:** it runs through the delete pipeline (access + hooks) with cycle protection, not a raw drop — but it *will* delete documents, so reserve it for true ownership.
- **`join` is virtual and read-only** — nothing stored, resolved only at `depth > 0`, ordered by the *related* collection's `admin.defaultSort`, access-filtered (unreadable rows omitted, not errored). Use it instead of maintaining a reverse link on both sides.
- **Polymorphic** stores `{ relationTo, value }`. Only use it when the field truly spans collections; a single `relationTo` is simpler everywhere else.
- **FK columns are indexed by default** — population and lookups are fast without manual `index: true`. Raise `depth` to expand references; `depth: 0` returns raw ids.
