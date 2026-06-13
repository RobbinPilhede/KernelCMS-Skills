---
name: add-seo-fields
description: Add an SEO group or the first-party SEO plugin to a KernelCMS collection — meta title, description, and OG image — with length limits and auto-fill.
category: Content modeling
tags: [seo, plugin, metadata, open-graph, group]
difficulty: starter
---

# Add SEO fields

**Use this when** you want an agent to add SEO metadata to a collection in KernelCMS — `meta_title`, `meta_description`, and an OG image — either inline as a `group`/`tab` or via the first-party `seoPlugin`, which ships the fields through the migration path and auto-fills them from your content. The output is a config edit.

## Prompt

> You are adding SEO fields to a KernelCMS collection as config-as-code. There are two correct approaches — choose based on the brief and say which:
>
> **A. The first-party plugin (preferred for the common case).** The first-party SEO plugin (`seoPlugin`, from `kernelcms/plugin-seo`) is an ordinary config-transformer plugin — no privileged access. It adds `meta_title` (text, `maxLength: 70`) and `meta_description` (textarea, `maxLength: 160` by default) under an "SEO" admin tab on the listed collections, and a `beforeChange` hook that **auto-fills** each from a source field when left blank:
> ```ts
> import { seoPlugin } from 'kernelcms/plugin-seo'
> // …
> plugins: [
>   seoPlugin({
>     collections: ['posts', 'pages'],
>     generateTitleFrom: 'title',        // seeds meta_title when blank
>     generateDescriptionFrom: 'excerpt', // seeds meta_description when blank
>     descriptionMaxLength: 160,
>   }),
> ]
> ```
> Use this when you want consistent SEO across several collections with auto-generation and minimal config. It won't double-add fields you already declared.
>
> **B. An inline `group` (or `tab`)** when you need fields the plugin doesn't ship — an OG image, a canonical URL, a `noindex` toggle, per-locale meta. Model it explicitly:
> ```ts
> { name: 'seo', type: 'group', admin: { description: 'Search & social metadata' }, fields: [
>   { name: 'title', type: 'text', maxLength: 70,
>     admin: { description: 'Search/social title (≤70 chars).' } },
>   { name: 'description', type: 'textarea', maxLength: 160,
>     admin: { description: 'Shown under the title in results (~160).' } },
>   { name: 'og_image', type: 'upload', relationTo: 'media',
>     admin: { description: 'Open Graph / social card image (1200×630).' } },
>   { name: 'canonical_url', type: 'text' },
>   { name: 'no_index', type: 'boolean', defaultValue: false },
> ] }
> ```
> A `group` namespaces the data (`seo.title`, `seo.og_image`) and renders as one section — use `admin.tab: 'SEO'` on each field instead if you'd rather they live in a dedicated editor tab alongside the plugin's.
>
> **Length limits matter.** `meta_title` ≤ ~70 chars, `meta_description` ≤ ~160 — search engines truncate beyond that. Enforce with `maxLength`.
>
> **Localization.** If the site is multi-locale, mark the SEO text fields `localized: true` so each language gets its own meta. (Requires `config.localization`.)
>
> **Don't:** put SEO behind field-level access that hides it from editors, or auto-fill from a richText field (it's structured, not a string — the plugin only seeds from string sources). Output the edit and say which approach and why.

## Example

**Brief:** "Posts and pages need SEO. Auto-fill the title and description from the content, but I also want an OG image and a noindex toggle — and the site is English + Swedish."

The agent combines both: the plugin for the auto-filled text on both collections, plus an inline group for the OG image / noindex that the plugin doesn't ship — and marks the text localized.

```ts
import { defineConfig } from 'kernelcms'
import { sqliteAdapter } from 'kernelcms/sqlite'
import { seoPlugin } from 'kernelcms/plugin-seo'

export default defineConfig({
  secret: process.env.KERNEL_SECRET ?? 'dev-only-secret',
  db: sqliteAdapter({ url: 'file:./content.db' }),
  localization: { locales: ['en', 'sv'], defaultLocale: 'en', fallback: true },
  plugins: [
    seoPlugin({
      collections: ['posts', 'pages'],
      generateTitleFrom: 'title',
      generateDescriptionFrom: 'excerpt',
      descriptionMaxLength: 160,
    }),
  ],
  collections: [
    { slug: 'media', upload: true, access: { read: () => true }, fields: [{ name: 'alt', type: 'text' }] },
    {
      slug: 'posts',
      access: { read: () => true },
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'excerpt', type: 'textarea', localized: true },
        { name: 'body', type: 'richText', localized: true },
        // plugin adds meta_title / meta_description under the SEO tab.
        // extra social fields the plugin doesn't ship:
        { name: 'social', type: 'group', admin: { tab: 'SEO', description: 'Open Graph & indexing' }, fields: [
          { name: 'og_image', type: 'upload', relationTo: 'media',
            admin: { description: 'Social card image (1200×630).' } },
          { name: 'no_index', type: 'boolean', defaultValue: false },
        ] },
      ],
    },
    // pages: same shape …
  ],
})
```

**Rationale (abridged):** The plugin handles `meta_title`/`meta_description` with auto-fill and correct length caps across both collections — one line, migrated cleanly. The OG image and `no_index` aren't part of the plugin, so they go in an inline `group` placed under the same `SEO` tab via `admin.tab`. The content fields the plugin reads from (`title`, `excerpt`) are plain strings, so auto-fill works; `body` (richText) is correctly *not* used as a source. Text meta is `localized: true` because the site is bilingual — each language gets its own title/description.

## Notes

- **Plugin = `seoPlugin` (import from `kernelcms/plugin-seo`).** Real fields: `meta_title` (text, ≤70) and `meta_description` (textarea, default ≤160). Options: `collections`, `generateTitleFrom`, `generateDescriptionFrom`, `descriptionMaxLength`. It's a plain config transformer — runs through the same migration path as hand-written fields, and skips fields already present.
- **Auto-fill only seeds blanks** and only from **string** source fields, in a `beforeChange` hook. An editor's explicit value always wins.
- **Group vs. plugin:** plugin for consistent auto-filled meta across collections; inline `group`/`tab` for fields it doesn't ship (OG, canonical, noindex) or full control.
- **Length caps** (`maxLength` 70 / 160) prevent truncation in search results — keep them.
- **Localize** the text meta on multi-locale sites; see **`localization-setup`**.
