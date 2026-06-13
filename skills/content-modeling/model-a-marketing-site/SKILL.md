---
name: model-a-marketing-site
description: Model a marketing site in KernelCMS — a pages collection driven by a rich blocks library, plus nav and footer globals — as typed config-as-code.
category: Content modeling
tags: [marketing, pages, blocks, globals, navigation]
difficulty: intermediate
---

# Model a marketing site

**Use this when** you want an agent to model a full marketing site in KernelCMS: a single `pages` collection driven by a `blocks` page builder (so every page is composed, not hard-coded), plus `nav` and `footer` **globals** for site-wide chrome. The output is a typed `kernel.config.ts`. This is the end-to-end counterpart to **`design-a-block-library`** (the block set) and **`design-landing-page`** (composing one page).

## Prompt

> You are modeling a marketing site in KernelCMS as config-as-code with `defineConfig`. Use only real field types: `text`, `textarea`, `slug`, `number`, `boolean`, `select`, `richText`, `group`, `array`, `blocks`, `relationship`, `upload`, and the `join`. Globals are singletons (`findGlobal`/`updateGlobal`).
>
> **Model it like this:**
> 1. **`media`** — `upload: true` collection (`alt`, `caption`), with `imageSizes` if `config.image` is set.
> 2. **`pages`** — the spine. `title` (text, required), `slug` (slug, unique, index — `''` or `'home'` for the homepage), an `seo` group (or the `seoPlugin`), and a **`layout` `blocks` field** holding the page-builder sections. Give it `versions: { drafts: true }` (stage + preview before publish), `admin.livePreview: { url }`, and `access.publish` to gate going live. Public reads.
> 3. **The block library** for `layout` — a tight, on-brand set: `hero`, `logo_strip`, `feature_grid`, `feature_split`, `testimonial`, `stat_row`, `pricing`, `faq`, `cta`, and a `rich_text` escape hatch. Each block has `admin.group` + `description`. CTAs are `{ label, href }`; internal links can be a `relationship` → `pages`. (Design the set with **`design-a-block-library`**; reference it here.)
> 4. **Globals for chrome:**
>    - **`nav`** — a `links` `array` of `{ label, href, sub_links?: array }` (or a `relationship` → pages for internal targets), plus the logo (upload → media).
>    - **`footer`** — `columns` (array of `{ heading, links: array of { label, href } }`), `social` group, `copyright` text.
>    - Optionally a **`site_settings`** global: `site_name`, default OG image, analytics id.
> 5. **Why globals, not a collection:** nav and footer are *one* editable thing each — singletons. A collection would imply many instances. Use globals.
>
> **Access.** Public reads everywhere; writes auth-only. `access.publish` restricts who can publish a page.
>
> **Admin.** `pages` with `useAsTitle: 'title'`, `defaultColumns`, `livePreview`.
>
> Output the config (collections + globals), then justify: one `pages` collection driven by blocks (vs. a collection per page type), nav/footer as globals, and where SEO lives.

## Example

**Brief:** "A SaaS marketing site: home, pricing, about, and feature pages — all built from reusable sections. Editable top nav with dropdowns and a footer with link columns. Stage pages and preview before publishing."

The agent emits (excerpt):

```ts
import { defineConfig } from 'kernelcms'
import { sqliteAdapter } from 'kernelcms/sqlite'
import { seoPlugin } from 'kernelcms/plugin-seo'

const blocks = [
  { slug: 'hero', admin: { group: 'Header', description: 'One promise, one CTA.' },
    fields: [
      { name: 'heading', type: 'text', required: true },
      { name: 'subhead', type: 'textarea' },
      { name: 'primary_label', type: 'text' }, { name: 'primary_href', type: 'text' },
      { name: 'image', type: 'upload', relationTo: 'media' },
    ] },
  { slug: 'feature_grid', admin: { group: 'Body', description: '3–6 benefit cards.' },
    fields: [
      { name: 'heading', type: 'text' },
      { name: 'items', type: 'array', minRows: 3, maxRows: 6, fields: [
        { name: 'title', type: 'text', required: true }, { name: 'body', type: 'textarea' },
      ] },
    ] },
  { slug: 'pricing', admin: { group: 'Body', description: 'Plan comparison.' },
    fields: [{ name: 'plans', type: 'array', minRows: 1, maxRows: 4, fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'price', type: 'text' },
      { name: 'features', type: 'array', fields: [{ name: 'label', type: 'text' }] },
      { name: 'cta_label', type: 'text' }, { name: 'cta_href', type: 'text' },
    ] }] },
  { slug: 'faq', admin: { group: 'Body', description: '4–8 Q&A.' },
    fields: [{ name: 'items', type: 'array', maxRows: 8, fields: [
      { name: 'q', type: 'text', required: true }, { name: 'a', type: 'textarea', required: true },
    ] }] },
  { slug: 'cta', admin: { group: 'Footer', description: 'Closing call to action.' },
    fields: [
      { name: 'heading', type: 'text', required: true },
      { name: 'label', type: 'text', required: true }, { name: 'href', type: 'text', required: true },
    ] },
  { slug: 'rich_text', admin: { group: 'Body', description: 'Free prose escape hatch.' },
    fields: [{ name: 'content', type: 'richText', preset: 'full' }] },
] as const

export default defineConfig({
  secret: process.env.KERNEL_SECRET ?? 'dev-only-secret',
  db: sqliteAdapter({ url: 'file:./content.db' }),
  plugins: [seoPlugin({ collections: ['pages'], generateTitleFrom: 'title' })],
  collections: [
    { slug: 'media', upload: true, access: { read: () => true }, fields: [{ name: 'alt', type: 'text' }] },
    {
      slug: 'pages',
      versions: { drafts: true },
      admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'slug', 'updatedAt'],
        livePreview: { url: 'https://www.example.com/preview' },
      },
      access: {
        read: () => true,
        update: ({ req }) => Boolean(req.user),
        publish: ({ req }) => req.user?.roles?.includes('admin') ?? false,
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'slug', type: 'slug', required: true, unique: true, index: true,
          admin: { description: 'Use "home" (or empty) for the homepage.' } },
        { name: 'layout', type: 'blocks', minRows: 1, blocks },
        // seoPlugin adds meta_title / meta_description under an SEO tab
      ],
    },
  ],
  globals: [
    {
      slug: 'nav',
      access: { read: () => true, update: ({ req }) => Boolean(req.user) },
      fields: [
        { name: 'logo', type: 'upload', relationTo: 'media' },
        { name: 'links', type: 'array', fields: [
          { name: 'label', type: 'text', required: true },
          { name: 'href', type: 'text' },
          { name: 'page', type: 'relationship', relationTo: 'pages',
            admin: { description: 'Internal link target (overrides href).' } },
          { name: 'sub_links', type: 'array', fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'href', type: 'text' },
          ] },
        ] },
      ],
    },
    {
      slug: 'footer',
      access: { read: () => true, update: ({ req }) => Boolean(req.user) },
      fields: [
        { name: 'columns', type: 'array', fields: [
          { name: 'heading', type: 'text' },
          { name: 'links', type: 'array', fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'href', type: 'text' },
          ] },
        ] },
        { name: 'social', type: 'group', fields: [
          { name: 'twitter', type: 'text' }, { name: 'github', type: 'text' }, { name: 'linkedin', type: 'text' },
        ] },
        { name: 'copyright', type: 'text' },
      ],
    },
  ],
})
```

**Rationale (abridged):** One `pages` collection driven by a `blocks` `layout` — every marketing page (home, pricing, about, features) is the same shape composed differently, so editors and agents build pages without a developer adding a collection per page type. Nav and footer are **globals** because each is a single editable thing; modeling them as collections would wrongly imply many. Nav links carry both `href` (external) and a `page` relationship (internal, type-safe). SEO is the plugin on `pages`. Drafts + `livePreview` + `access.publish` give a real stage-preview-publish flow with publishing gated to admins.

## Notes

- **One `pages` + blocks beats a collection-per-page-type.** The block library *is* the page system; adding a page is content, not code. See **`design-a-block-library`** for the set and **`design-landing-page`** (Page design) for composing one.
- **Nav/footer are globals** — singletons read with `findGlobal` / written with `updateGlobal`, exposed at `/api/globals/<slug>`. Don't model them as collections.
- **Internal links** are best as a `relationship` → `pages` (survives slug changes, type-safe) with `href` as the external fallback.
- **Drafts + live preview + publish gate:** `versions: { drafts: true }`, `admin.livePreview: { url }`, and `access.publish` together give stage → preview → publish.
- **SEO** via `seoPlugin` on `pages`, or an inline group — see **`add-seo-fields`**. Run `kernel generate:types` when done.
