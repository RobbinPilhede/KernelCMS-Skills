---
name: model-a-portfolio
description: Model a portfolio site in KernelCMS — projects, case studies, media galleries, and a blocks page builder — as typed config-as-code.
category: Content modeling
tags: [portfolio, case-study, media, blocks, page-builder]
difficulty: intermediate
---

# Model a portfolio

**Use this when** you want an agent to model a portfolio or studio site in KernelCMS: `projects` and longer-form `case_studies`, rich `media` galleries, and a flexible `blocks` page builder so each case study reads as a composed narrative rather than a fixed template. The output is a typed `kernel.config.ts`.

## Prompt

> You are modeling a portfolio site in KernelCMS as config-as-code with `defineConfig`. Use only real field types: `text`, `textarea`, `slug`, `number`, `boolean`, `date`, `select`, `richText`, `group`, `array`, `blocks`, `relationship`, `upload`, `point`, and the `join` reverse-relationship. Relationship/upload fields take `relationTo`, `hasMany`, `onDelete`.
>
> **Model it like this:**
> 1. **`media`** — `upload: true` collection with `alt`, `caption`. Add `imageSizes` + `focalPoint: true` if `config.image` is set.
> 2. **`projects`** — a compact card: `title`, `slug` (unique, index), `summary` (textarea), `cover` (upload → media), `year` (number), `tags`/`disciplines` (select, hasMany), `url` (text, the live link), `featured` (boolean). Add a `case_study` relationship (→ case_studies, `onDelete: 'setNull'`) for projects with a deep write-up.
> 3. **`case_studies`** — the long form. Identity (`title`, `slug`), a `summary`, a `client` (text or relationship), `role`/`timeline` group, a `gallery` (`array` of `{ image: upload, caption }`), and — the core — a **`content` `blocks` page builder** so each study is composed from typed sections.
> 4. **Block library for case studies:** define real, reusable blocks — `text_section` (`{ heading, body: richText }`), `image` (`{ media: upload, caption, full_bleed: boolean }`), `image_pair` (`{ left: upload, right: upload }`), `quote` (`{ text, attribution }`), `stat_row` (`array` of `{ value, label }`), `video` (`{ url, poster: upload }`), and `embed` (`{ url }`). Give each block an `admin.group` + `description` for its library card. Keep the set tight — these are the on-brand sections, not a kitchen sink.
>
> **Drafts.** Give `case_studies` (and optionally `projects`) `versions: { drafts: true }` so work is staged and previewed before going live; gate publishing with `access.publish`. Set `admin.livePreview` to your frontend so the page builder previews live.
>
> **Access.** Public reads; writes auth-only.
>
> **Admin.** `useAsTitle`, `defaultColumns`, `defaultSort: '-year'` on projects. Use `tabs` to separate Overview / Content / Media.
>
> Output the config, then justify: projects-vs-case_studies split, why content is `blocks` (not one richText), the gallery `array`, and the `onDelete` on the project→case_study link.

## Example

**Brief:** "Design studio site. A grid of projects; selected ones open into rich, custom-laid-out case studies. Stage case studies before publishing, preview them live."

The agent emits (excerpt):

```ts
import { defineConfig } from 'kernelcms'
import { sqliteAdapter } from 'kernelcms/sqlite'

const DISCIPLINES = ['Branding', 'Web', 'Product', 'Motion', 'Editorial'] as const

export default defineConfig({
  secret: process.env.KERNEL_SECRET ?? 'dev-only-secret',
  db: sqliteAdapter({ url: 'file:./content.db' }),
  collections: [
    { slug: 'media', upload: true, access: { read: () => true },
      fields: [{ name: 'alt', type: 'text' }, { name: 'caption', type: 'text' }] },
    {
      slug: 'projects',
      versions: { drafts: true },
      admin: { useAsTitle: 'title', defaultColumns: ['title', 'year', 'featured'], defaultSort: '-year' },
      access: { read: () => true, update: ({ req }) => Boolean(req.user) },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'slug', type: 'slug', required: true, unique: true, index: true },
        { name: 'summary', type: 'textarea', maxLength: 240 },
        { name: 'cover', type: 'upload', relationTo: 'media' },
        { type: 'row', fields: [
          { name: 'year', type: 'number', integer: true, admin: { width: 30 } },
          { name: 'disciplines', type: 'select', hasMany: true, options: [...DISCIPLINES], admin: { width: 40 } },
          { name: 'featured', type: 'boolean', defaultValue: false, admin: { width: 30 } },
        ] },
        { name: 'url', type: 'text', admin: { description: 'Live project link.' } },
        { name: 'case_study', type: 'relationship', relationTo: 'case_studies', onDelete: 'setNull',
          admin: { description: 'Link to the deep write-up, if any.' } },
      ],
    },
    {
      slug: 'case_studies',
      versions: { drafts: true },
      admin: {
        useAsTitle: 'title',
        defaultSort: '-updatedAt',
        livePreview: { url: 'https://studio.example.com/preview' },
      },
      access: {
        read: () => true,
        update: ({ req }) => Boolean(req.user),
        publish: ({ req }) => req.user?.roles?.includes('admin') ?? false,
      },
      fields: [
        { type: 'tabs', tabs: [
          { label: 'Overview', fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'slug', type: 'slug', required: true, unique: true, index: true },
            { name: 'summary', type: 'textarea' },
            { name: 'client', type: 'text' },
            { name: 'role', type: 'group', fields: [
              { name: 'discipline', type: 'select', hasMany: true, options: [...DISCIPLINES] },
              { name: 'timeline', type: 'text' },
            ] },
          ] },
          { label: 'Content', fields: [
            { name: 'content', type: 'blocks', minRows: 1, blocks: [
              { slug: 'text_section', admin: { group: 'Story', description: 'Heading + rich body.' },
                fields: [{ name: 'heading', type: 'text' }, { name: 'body', type: 'richText', preset: 'standard' }] },
              { slug: 'image', admin: { group: 'Media', description: 'Single image, optional full-bleed.' },
                fields: [
                  { name: 'media', type: 'upload', relationTo: 'media', required: true },
                  { name: 'caption', type: 'text' },
                  { name: 'full_bleed', type: 'boolean', defaultValue: false },
                ] },
              { slug: 'image_pair', admin: { group: 'Media', description: 'Two side-by-side images.' },
                fields: [
                  { name: 'left', type: 'upload', relationTo: 'media', required: true },
                  { name: 'right', type: 'upload', relationTo: 'media', required: true },
                ] },
              { slug: 'quote', admin: { group: 'Story', description: 'Pull quote with attribution.' },
                fields: [{ name: 'text', type: 'textarea', required: true }, { name: 'attribution', type: 'text' }] },
              { slug: 'stat_row', admin: { group: 'Story', description: 'Row of result metrics.' },
                fields: [{ name: 'items', type: 'array', minRows: 1, maxRows: 4,
                  fields: [{ name: 'value', type: 'text' }, { name: 'label', type: 'text' }] }] },
            ] },
          ] },
          { label: 'Media', fields: [
            { name: 'gallery', type: 'array', fields: [
              { name: 'image', type: 'upload', relationTo: 'media', required: true },
              { name: 'caption', type: 'text' },
            ] },
          ] },
        ] },
      ],
    },
  ],
})
```

**Rationale (abridged):** Projects and case studies are split because they have different shapes and lifecycles — a project is a card in a grid; a case study is a long composed page. The project→case_study link uses `setNull` so deleting a write-up doesn't delete the project card. Case-study `content` is a `blocks` field, not one `richText`, because each study needs a different layout (full-bleed images, paired shots, stat rows) — a tight, named block set keeps that on-brand and typed. The `gallery` is an `array` (ordered, repeatable, presentational), separate from the narrative blocks. Drafts + `livePreview` let the studio stage and preview a study before it goes live.

## Notes

- **Blocks vs. richText:** use `blocks` when layout varies per page (the page-builder case); use one `richText` when it's just prose. A portfolio case study is the former.
- **Keep the block set tight.** Each block is on-brand by construction — only fields you define can be set. See **`design-a-block-library`** for designing the set itself.
- **`array` for galleries** — ordered, repeatable, same shape; cheaper than blocks when every row is identical.
- **Drafts + live preview:** `versions: { drafts: true }` plus `admin.livePreview: { url }` previews the composed page against your frontend before publishing.
- Resized images need `config.image` (sharp adapter) for `imageSizes` to apply.
