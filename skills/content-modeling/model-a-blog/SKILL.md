---
name: model-a-blog
description: Design a typed KernelCMS blog model — posts, authors, categories, tags, relationships, drafts, and SEO — as config-as-code in kernel.config.ts.
category: Content modeling
tags: [blog, collections, relationships, drafts, seo]
difficulty: starter
---

# Model a blog

**Use this when** you want an agent to design the content model for a blog in KernelCMS — the `posts`, `authors`, `categories`, and `tags` collections, how they relate, where drafts and SEO belong — and emit it as a real `kernel.config.ts`. This is modeling, not writing posts: the output is typed config a developer commits.

## Prompt

> You are a content architect modeling a blog in KernelCMS as config-as-code. Produce a `kernel.config.ts` using `defineConfig` and the real field set — never invent field types or options.
>
> **Use only these field types:** `text`, `textarea`, `email`, `slug`, `code`, `number`, `boolean`, `checkbox`, `date`, `select`, `radio`, `json`, `point`, `richText`, `group`, `array`, `blocks`, `relationship`, `upload`, plus the virtual `join` and the presentational `row`/`tabs`/`ui` containers. Relationship/upload fields take `relationTo` (a string, or a string[] for polymorphic), `hasMany`, and `onDelete: 'setNull' | 'cascade' | 'restrict'`.
>
> **Model the blog like this:**
> 1. **`authors`** — `name` (text, required), `email` (email, unique), `bio` (textarea), `avatar` (upload → `media`). Add a reverse `join` named `posts` (`collection: 'posts'`, `on: 'author'`) so an author page can list their posts at `depth > 0`. Public reads.
> 2. **`categories`** — `name` (text, required) + `slug` (slug, unique, required). A taxonomy, kept its own collection so it's reusable and renameable.
> 3. **`posts`** — `title` (text, required), `slug` (slug, unique, required, index), `excerpt` (textarea, `maxLength: 280`), `body` (richText), `cover` (upload → `media`), `author` (relationship → `authors`, `onDelete: 'setNull'`), `categories` (relationship → `categories`, `hasMany`), `tags` (a fixed `select` with `hasMany: true` — tags are a closed vocabulary, not a collection, unless the brief needs tag pages). Add `published_at` (date) and an `seo` group.
> 4. **`media`** — an `upload: true` collection for images.
>
> **Drafts & publishing.** Give `posts` `versions: { drafts: true }` — that adds the draft → published lifecycle, version history, and scheduled publish. Don't hand-roll a `status` select for this; the `_status` lifecycle is built in. (A plain `status` select is only for non-draft workflow states.)
>
> **SEO.** Either add an `seo` group inline (`meta_title` text, `meta_description` textarea, `og_image` upload → media) or prefer the first-party `seoPlugin({ collections: ['posts'], generateTitleFrom: 'title', generateDescriptionFrom: 'excerpt' })`, which ships the fields through the migration path and auto-fills them when left blank. Pick one; say which.
>
> **Access.** Reads are public (`access: { read: () => true }`). Writes require auth. Scope `posts.update`/`delete` to the author with a row-level `Where` if the brief is multi-author; gate going live with `access.publish` (e.g. editors edit, admins publish).
>
> **Admin polish.** Set `admin.useAsTitle`, `admin.defaultColumns`, and `admin.defaultSort: '-published_at'` on `posts`.
>
> Output the full `kernel.config.ts`, then a short rationale for each modeling choice (why a collection vs. a select, why `onDelete: 'setNull'` on `author`, where SEO lives).

## Example

**Brief:** "A multi-author engineering blog. Drafts, SEO, category pages, tag filtering, author bios with their post list."

The agent emits (excerpt):

```ts
import { defineConfig } from 'kernelcms'
import { sqliteAdapter } from 'kernelcms/sqlite'
import { seoPlugin } from '@kernel/plugin-seo'

export default defineConfig({
  secret: process.env.KERNEL_SECRET ?? 'dev-only-secret',
  db: sqliteAdapter({ url: 'file:./content.db' }),
  plugins: [seoPlugin({ collections: ['posts'], generateTitleFrom: 'title', generateDescriptionFrom: 'excerpt' })],
  collections: [
    { slug: 'media', upload: true, access: { read: () => true }, fields: [{ name: 'alt', type: 'text' }] },
    {
      slug: 'authors',
      admin: { useAsTitle: 'name' },
      access: { read: () => true },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', unique: true },
        { name: 'bio', type: 'textarea' },
        { name: 'avatar', type: 'upload', relationTo: 'media' },
        // virtual reverse relationship — posts that point back at this author
        { type: 'join', name: 'posts', collection: 'posts', on: 'author', limit: 50 },
      ],
    },
    {
      slug: 'categories',
      admin: { useAsTitle: 'name' },
      access: { read: () => true },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'slug', type: 'slug', required: true, unique: true },
      ],
    },
    {
      slug: 'posts',
      versions: { drafts: true }, // draft → published lifecycle + history + scheduled publish
      admin: { useAsTitle: 'title', defaultColumns: ['title', 'author', 'updatedAt'], defaultSort: '-published_at' },
      access: {
        read: () => true,
        update: ({ req }) => Boolean(req.user),
        publish: ({ req }) => req.user?.roles?.includes('admin') ?? false, // only admins go live
      },
      fields: [
        { name: 'title', type: 'text', required: true, minLength: 3 },
        { name: 'slug', type: 'slug', required: true, unique: true, index: true },
        { name: 'excerpt', type: 'textarea', maxLength: 280 },
        { name: 'cover', type: 'upload', relationTo: 'media' },
        { name: 'body', type: 'richText', preset: 'full' },
        { name: 'published_at', type: 'date' },
        { name: 'author', type: 'relationship', relationTo: 'authors', onDelete: 'setNull' },
        { name: 'categories', type: 'relationship', relationTo: 'categories', hasMany: true, onDelete: 'setNull' },
        { name: 'tags', type: 'select', hasMany: true, options: ['release', 'guide', 'news', 'tutorial'] },
      ],
    },
  ],
})
```

**Rationale (abridged):** Categories are a collection (renameable, get their own pages, queryable); tags are a closed `select` (no tag pages needed, no extra table). `author` uses `onDelete: 'setNull'` so deleting an author leaves posts intact but unattributed — `cascade` would silently delete their posts. Drafts come from `versions: { drafts: true }`, not a hand-rolled status field. SEO is the plugin so the fields migrate cleanly and auto-fill from `title`/`excerpt`.

## Notes

- **Drafts ≠ a status field.** `versions: { drafts: true }` gives you `_status`, history, scheduled publish, and the `publish` access edge for free. Reserve a manual `select` for editorial states the lifecycle doesn't cover.
- **`join` is virtual** — nothing is stored; it resolves at read time only when `depth > 0`, ordered by the related collection's `admin.defaultSort`. Set that on `posts` so an author's post list is deterministic.
- **`onDelete` is per relationship field.** Default is a dangling reference; choose `setNull`/`cascade`/`restrict` deliberately. See **`relationships-and-joins`**.
- **SEO:** inline `group` for full control, or `seoPlugin` for parity-with-Payload auto-generation. See **`add-seo-fields`**.
- Run `kernel generate:types` after settling the model to emit typed interfaces for the Local API and client.
