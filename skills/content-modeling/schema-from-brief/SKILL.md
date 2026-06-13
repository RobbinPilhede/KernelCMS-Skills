---
name: schema-from-brief
description: Turn a plain-English content brief into a typed KernelCMS model — the right collections, fields, relationships, drafts, and access — as kernel.config.ts.
category: Content modeling
tags: [schema, brief, modeling, collections, relationships]
difficulty: intermediate
---

# Schema from a brief

**Use this when** you have a plain-English description of a site or app ("a recipe site with chefs, meal plans, and a newsletter") and want an agent to translate it into a correct, typed KernelCMS model. This is the generalist modeling skill — it teaches the agent the decision rules that map English nouns and verbs onto KernelCMS collections, fields, and relationships.

## Prompt

> You are a content architect turning a plain-English brief into a KernelCMS model as config-as-code with `defineConfig`. Produce a single `kernel.config.ts` using only real field types and options — never invent any.
>
> **Available field types:** `text`, `textarea`, `email`, `slug`, `code`, `number`, `boolean`, `checkbox`, `date`, `select`, `radio`, `json`, `point`, `richText`, `group`, `array`, `blocks`, `relationship`, `upload`; the virtual `join`; and presentational `row`/`tabs`/`ui`. Collections may set `versions`, `upload`, `auth`, `access`, `hooks`, `admin`, `search`, `cache`. Relationship/upload fields take `relationTo` (string or string[]), `hasMany`, `onDelete: 'setNull' | 'cascade' | 'restrict'`.
>
> **Apply these mapping rules:**
> 1. **Nouns → collections.** Each distinct entity the brief talks about as a "thing with many instances" is a collection. A single editable thing (site settings, homepage, nav) is a **global**.
> 2. **Reusable / queryable categories → their own collection** (they get pages, get renamed, are filtered on). **Closed, fixed vocabularies → a `select` with `options`** (no pages, no table). When unsure, ask: "does this need its own URL or admin list?" Yes → collection; no → select.
> 3. **"Has a" / "belongs to" → `relationship`.** "Has many" → `hasMany: true`. "Can point at several kinds" → polymorphic `relationTo: ['a','b']`. "List the children of X" → a **`join`** on the parent (virtual, reverse). Choose `onDelete` deliberately: `setNull` (keep the doc, drop the link), `cascade` (delete dependents that can't exist alone), `restrict` (block deletion while referenced).
> 4. **Field types by data shape:** short label → `text`; long prose → `richText`; one-line summary → `textarea`; a date → `date`; money → `number integer:true` (minor units); a fixed choice → `select`; a yes/no → `boolean`; coordinates → `point`; a file/image → `upload`; structured-but-freeform → `json`; a repeated uniform row → `array`; a varied page layout → `blocks`.
> 5. **Lifecycle verbs.** "Draft / publish / schedule / preview" → `versions: { drafts: true }` and `access.publish`. "Keep history / audit / restore" → `versions: true`. "Sign in / accounts" → `auth: true` on a users collection. Note: with drafts on, reads are published-only unless a caller passes `draft: true`, so public `access.read` doesn't need a `_status` filter — drafts hide themselves.
> 6. **Access.** Public-facing reads → `access: { read: () => true }`. Everything else is deny-by-default; add explicit rules. Per-user ownership → a row-level `Where` (`{ owner: { equals: req.user?.id } }`).
> 7. **Localized?** If the brief mentions multiple languages, add `localization` and mark translatable fields `localized: true`.
>
> **Process:** restate the brief's entities and relationships in one short list, flag any ambiguity (ask, don't guess), then emit the full config. End with a rationale and the open questions a human should confirm.

## Example

**Brief:** "A recipe site. Chefs publish recipes with ingredients, steps, a photo, prep time, and cuisine tags. Visitors browse by cuisine. Recipes are drafted before going live. There's an editable About page."

The agent restates and emits (excerpt):

> Entities: `chefs` (collection), `recipes` (collection, drafts), `cuisines` — browsable, so a **collection** not a select. Ingredients & steps are uniform repeated rows → `array`s inside `recipes`. The About page is a single editable thing → a **global**. Open question: are cuisine pages needed (→ collection, chosen) or just filter chips (→ select)?

```ts
import { defineConfig } from 'kernelcms'
import { sqliteAdapter } from 'kernelcms/sqlite'

export default defineConfig({
  secret: process.env.KERNEL_SECRET ?? 'dev-only-secret',
  db: sqliteAdapter({ url: 'file:./content.db' }),
  collections: [
    { slug: 'media', upload: true, access: { read: () => true }, fields: [{ name: 'alt', type: 'text' }] },
    {
      slug: 'chefs',
      admin: { useAsTitle: 'name' },
      access: { read: () => true },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'bio', type: 'textarea' },
        { name: 'avatar', type: 'upload', relationTo: 'media' },
        { type: 'join', name: 'recipes', collection: 'recipes', on: 'chef', limit: 100 },
      ],
    },
    {
      slug: 'cuisines',
      admin: { useAsTitle: 'name' },
      access: { read: () => true },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'slug', type: 'slug', required: true, unique: true },
      ],
    },
    {
      slug: 'recipes',
      versions: { drafts: true }, // drafted before going live
      admin: { useAsTitle: 'title', defaultColumns: ['title', 'chef', 'updatedAt'], defaultSort: '-updatedAt' },
      access: { read: () => true, update: ({ req }) => Boolean(req.user) },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'slug', type: 'slug', required: true, unique: true, index: true },
        { name: 'photo', type: 'upload', relationTo: 'media' },
        { name: 'prep_minutes', type: 'number', integer: true, min: 0 },
        { name: 'chef', type: 'relationship', relationTo: 'chefs', onDelete: 'setNull' },
        { name: 'cuisines', type: 'relationship', relationTo: 'cuisines', hasMany: true, onDelete: 'setNull' },
        { name: 'ingredients', type: 'array', minRows: 1, fields: [
          { name: 'amount', type: 'text' },
          { name: 'item', type: 'text', required: true },
        ] },
        { name: 'steps', type: 'array', minRows: 1, fields: [
          { name: 'instruction', type: 'textarea', required: true },
        ] },
      ],
    },
  ],
  globals: [
    {
      slug: 'about',
      access: { read: () => true, update: ({ req }) => Boolean(req.user) },
      fields: [{ name: 'heading', type: 'text' }, { name: 'body', type: 'richText' }],
    },
  ],
})
```

**Rationale (abridged):** Cuisines are a collection (browsable, need pages) not a select. Ingredients/steps are `array`s (uniform repeated rows inside the recipe, no independent identity). About is a `global` (one editable document). `recipes` gets drafts because the brief says "drafted before going live." `chef`/`cuisines` use `setNull` so deleting either leaves recipes intact. The `join` on `chefs` powers a chef's recipe list without storing anything.

## Notes

- **Collection vs. select** is the most common modeling fork: needs a page/list/its-own-edits → collection; closed fixed set → `select`. Getting this right early avoids a painful migration later.
- **Global vs. collection:** one editable instance → global (`findGlobal`/`updateGlobal`); many instances → collection.
- **Ask, don't guess.** A good model surfaces the 2–3 ambiguities (cuisine pages? per-user ownership? localization?) and confirms them rather than silently committing.
- **Drafts vs. history:** `versions: { drafts: true }` for a publish lifecycle; `versions: true` for audit/restore only.
- Pair with **`relationships-and-joins`** for the `onDelete`/polymorphic/`join` decisions and **`add-seo-fields`** / **`localization-setup`** to layer those concerns on. Run `kernel generate:types` after.
