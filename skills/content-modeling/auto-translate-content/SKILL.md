---
name: auto-translate-content
description: Auto-fill every locale of your KernelCMS content with a pluggable AI translation provider — one document or a whole collection — while keeping access control, strict-mode validation, and human review intact.
category: Content modeling
tags: [translation, localization, i18n, ai, deepl, openai]
difficulty: intermediate
---

# Auto-translate content

**Use this when** you localize content and don't want to hand-translate (or copy-paste into a translator) every field for every language. KernelCMS already stores a value per locale — this fills the gaps automatically with the translation provider of your choice, as a normal governed write.

This is a configuration + usage runbook.

## Prompt

This skill is operational — follow the runbook. (Needs `localization` configured.)

### 1. Wire a translation provider

Supply a `translate` function — any provider works (KernelCMS has no hard dependency):

```ts
export default defineConfig({
  localization: { locales: ['en', 'es', 'fr', 'de'], defaultLocale: 'en' },
  translation: {
    async translate({ texts, from, to }) {
      const res = await fetch('https://api-free.deepl.com/v2/translate', {
        method: 'POST',
        headers: { Authorization: `DeepL-Auth-Key ${process.env.DEEPL_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({ text: texts, source_lang: from.toUpperCase(), target_lang: to.toUpperCase() }),
      })
      const json = await res.json()
      return json.translations.map((t: { text: string }) => t.text)
    },
  },
})
```

(OpenAI/Google/a local model work the same way — map N input strings to N output strings.)

### 2. Translate one document

```ts
await kernel.translateDocument({ collection: 'articles', id, from: 'en', to: 'es' })
```

It reads the English values of the localized fields, translates them, and writes them into Spanish — **merging** (other locales untouched), filling only the **missing** values by default. Pass `overwrite: true` to redo existing ones, or `fields: ['title', 'summary']` to limit scope. Over REST: `POST /api/articles/ID/translate` with `{ "from": "en", "to": "es" }`.

### 3. Bulk-fill a whole collection

```ts
const { translated, skipped } = await kernel.translateMissing({ collection: 'articles', to: 'fr', limit: 100 })
```

Finds every document missing the `fr` locale (via the translation-status data) and fills it. Over REST (admin/editor): `POST /api/_admin/translate-missing`.

### 4. Keep humans in the loop

Translation is a normal write through the access pipeline, so the result lands as content you can review — pair it with strict localization (publishing is blocked until required fields are translated) and the translation-status dashboard to see what's complete, then have an editor (or an agent, draft-only) review machine translations before they go live.

### 5. Trust the boundaries

The caller must be able to update the document; strict-mode per-locale required validation still applies; the agent draft-only brake still holds (a translation never auto-publishes). The provider's API key and the source/translated text never leak (a failure surfaces a generic message), a provider error never leaves a document half-translated, unknown locales are rejected, and a field you can't read is never sent to the provider.

Provide: «your translation provider, the locales to fill, and whether to translate one document, a collection, or only missing values».
