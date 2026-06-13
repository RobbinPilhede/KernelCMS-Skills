---
name: localization-setup
description: Configure locales, per-field translations, and fallbacks in KernelCMS — which fields to localize and the strict required-per-locale footgun.
category: Content modeling
tags: [localization, i18n, locales, translations, fallbacks]
difficulty: intermediate
---

# Localization setup

**Use this when** you want an agent to make a KernelCMS model multilingual — add the locale set, mark the right fields `localized: true`, choose a fallback strategy, and avoid the `required` + per-locale footgun. The output is config edits to `kernel.config.ts`.

## Prompt

> You are configuring localization for a KernelCMS model as config-as-code. Localization in KernelCMS is **per field**: a field marked `localized: true` stores one value *per locale*; unmarked fields are shared across all locales.
>
> **1. Declare the locale set** at the config root:
> ```ts
> localization: {
>   locales: ['en', 'sv', 'de'],
>   defaultLocale: 'en',
>   fallback: true, // when a locale's value is missing, fall back to defaultLocale
> }
> ```
>
> **2. Mark only the fields that actually differ by language `localized: true`:**
> - **Localize:** human-facing text — `title`, `excerpt`, `body` (richText), labels, SEO meta, alt text.
> - **Do NOT localize:** `slug` (usually — decide per project; a shared slug is simpler, a per-locale slug needs `localized: true` and care with `unique`), relationships/uploads (the *reference* is shared; the target's own localized fields translate), enums/`select` values, prices, dates, booleans, and anything structural.
> ```ts
> { name: 'title', type: 'text', required: true, localized: true },
> { name: 'body',  type: 'richText', localized: true },
> { name: 'category', type: 'relationship', relationTo: 'categories' }, // shared, not localized
> ```
>
> **3. The fallback model.** With `fallback: true`, a read in `sv` that has no `sv` value returns the `defaultLocale` value — good for progressive translation (publish English, translate later). Per request you can override: set `fallbackLocale` to another locale or to `false` to see exactly which values are missing (useful for a translation-coverage audit).
> ```ts
> await kernel.find({ collection: 'posts', req: { locale: 'sv', fallbackLocale: 'en' } })
> await kernel.find({ collection: 'posts', req: { locale: 'sv', fallbackLocale: false } }) // no fill → spot gaps
> ```
> Over REST: `?locale=sv&fallback-locale=en`.
>
> **4. THE FOOTGUN — `required` + `localized`.** A field that is both `required: true` and `localized: true` is validated **per locale on write to that locale** — but fallback can *mask* missing translations on read, so content looks complete while a locale is actually empty. Two safe patterns:
> - **Required in the default locale, optional elsewhere + `fallback: true`** (the common, pragmatic choice): the default always has a value; other locales fall back until translated. Keep `required` only on fields the default locale must have.
> - **Strict required-per-locale:** if every locale *must* be fully translated before publishing (legal/regulatory copy), keep `required: true` and run a coverage check with `fallbackLocale: false` (or a publish hook) — do **not** rely on fallback to hide gaps. Decide and state which the project needs.
>
> Output the config edits and a one-line note on which fields you localized, the fallback choice, and how you handled `required` per locale.

## Example

**Brief:** "Blog in English, Swedish, German. Title and body must be translated; categories are shared. We publish English first and translate over time — but the legally-required `disclaimer` field must exist in every locale before a post goes live."

The agent emits (excerpt):

```ts
import { defineConfig } from 'kernelcms'
import { sqliteAdapter } from 'kernelcms/sqlite'

export default defineConfig({
  secret: process.env.KERNEL_SECRET ?? 'dev-only-secret',
  db: sqliteAdapter({ url: 'file:./content.db' }),
  localization: { locales: ['en', 'sv', 'de'], defaultLocale: 'en', fallback: true },
  collections: [
    {
      slug: 'categories',
      access: { read: () => true },
      fields: [
        { name: 'name', type: 'text', required: true, localized: true }, // names translate
        { name: 'slug', type: 'slug', required: true, unique: true },     // slug shared across locales
      ],
    },
    {
      slug: 'posts',
      versions: { drafts: true },
      access: { read: () => true, update: ({ req }) => Boolean(req.user) },
      fields: [
        // required in the DEFAULT locale; other locales fall back until translated
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'excerpt', type: 'textarea', localized: true },
        { name: 'body', type: 'richText', localized: true },
        // shared reference — the category's own name translates, the link doesn't
        { name: 'categories', type: 'relationship', relationTo: 'categories', hasMany: true },
        // STRICT: must exist in every locale. required + localized, and a publish-time
        // coverage check (fallbackLocale:false) — do NOT let fallback mask a gap.
        { name: 'disclaimer', type: 'textarea', required: true, localized: true,
          validate: ({ value }) => (value && String(value).trim()) ? true : 'Disclaimer is required in this locale' },
      ],
    },
  ],
})
```

A coverage audit before publish reads each locale with fallback off and flags any post whose `disclaimer` is empty in `sv` or `de`:

```ts
for (const locale of ['sv', 'de']) {
  const { docs } = await kernel.find({
    collection: 'posts',
    where: { disclaimer: { exists: false } },
    req: { locale, fallbackLocale: false }, // no fill — real gaps surface
  })
  if (docs.length) console.warn(`${docs.length} posts missing ${locale} disclaimer`)
}
```

**Rationale (abridged):** Title/excerpt/body/name are localized (they differ by language); `slug` and the `categories` *link* are shared (the category's own `name` translates via the relationship). `fallback: true` supports publish-English-then-translate. `title` is `required` — satisfied by the default locale; other locales fall back. The legal `disclaimer` is the strict case: `required: true` + a real coverage check with `fallbackLocale: false`, because fallback would otherwise mask an untranslated locale and ship incomplete legal copy.

## Notes

- **Per-field, opt-in.** Only `localized: true` fields store per-locale values; everything else is shared. Don't localize structural/numeric/relationship fields.
- **`fallback`** (root) + per-request `fallbackLocale` (string or `false`) control fill. `false` is your audit tool — it shows true gaps instead of hiding them.
- **The footgun:** `required` + `localized` + `fallback: true` can look complete while a locale is empty. For must-translate fields, verify with `fallbackLocale: false` (or a publish hook), never trust fallback.
- **Slugs:** shared is simpler; per-locale slugs need `localized: true` and careful `unique` handling. Pick deliberately.
- **Relationships** store a shared reference; the target's own localized fields translate when populated under a locale.
