---
name: translate-content
description: Use an agent to draft translations of localized fields per locale in KernelCMS, written through the `locale` arg and held as human-reviewed drafts.
category: Agent workflows
tags: [localization, i18n, translation, locales, drafts]
difficulty: intermediate
---

# Translate content

**Use this when** you have localized fields and want an agent to draft translations into your other locales. KernelCMS reads and writes localized values per `locale`, so the agent fetches the source locale, translates each localized field, and writes the target locale — all as drafts a native-or-fluent human reviews before publish.

## Prompt

> You are drafting translations in KernelCMS through the access-controlled MCP tools. You write **drafts** only — you cannot publish — and you may only write fields inside your `fieldScope`. You translate into the target locale; you never alter the source locale's values.
>
> **1. Learn the model and locales.** Read `kernel://schema` to find the target collection, which of its fields are **localized**, and the configured locales. Translate only localized fields that are in your scope; leave non-localized fields (slugs, references, numbers) untouched.
>
> **2. Read the source locale.** Call `<collection>_get` with `locale: '<source>'` to get the authoritative source content.
>
> **3. Translate faithfully.** Render each localized field in the target language: preserve meaning, tone, and any product/brand terms (keep a glossary of do-not-translate terms from the brief). Adapt idioms rather than translating word-for-word; respect the target language's conventions (formality, punctuation, units). Do not invent content the source doesn't have.
>
> **4. Write the target locale.** Call `<collection>_update` with `locale: '<target>'` and only the translated localized fields. This sets the target-locale values without disturbing the source locale or non-localized fields. The document stays a draft.
>
> **5. Report.** Per document and per locale: which fields you translated, any term you were unsure about, and anything you deliberately left in the source language. Tell the human to review each locale in the admin (live preview per locale) and publish.
>
> Job: «collection + documents, source locale, target locale(s), any glossary / do-not-translate terms».

## Example

**Job:** "Translate these 5 posts from `en` into `de` and `fr`. Keep 'KernelCMS' and 'fieldScope' untranslated."

For each post the agent calls `posts_get` with `locale: 'en'`, translates the localized `title`, `excerpt`, and `body`, then writes each locale:

```json
// posts_update, locale: "de"
{ "id": "post_a1",
  "title": "Feld-Scoping, jetzt pro Agent",
  "excerpt": "…",
  "body": "… KernelCMS … fieldScope …" }
```

…and again with `locale: 'fr'`. The `en` values and the non-localized `slug`/`author` are untouched. Everything stays a **draft**. Report: *"5 posts × 2 locales translated. Kept 'KernelCMS'/'fieldScope'. Unsure: 'leash' (rendered 'Leine' in de) — please confirm. Review per-locale in the admin and publish."*

## Notes

- **The `locale` arg is the whole mechanism.** Read tools and write tools both accept `locale`; reads return that locale's values, writes set them. One document holds all locales — the agent just targets one at a time.
- **Only localized fields vary by locale.** Writing a non-localized field while targeting a locale changes the shared value — so translate *only* localized fields, and confirm which are localized from the schema.
- **Source locale is read-only here.** The agent reads the source and writes the target; never have it overwrite the source-language content.
- **Draft-only + human review.** Machine translation needs a fluent reviewer — the draft-only brake guarantees a human sees each locale before it's published.
- **Stay in scope.** The localized fields you translate must be in `fieldScope.allow`, or the writes are stripped. See **`scope-an-agent-safely`**.
- **Tools:** `kernel://schema` (find localized fields + locales), `<collection>_get` (source locale), `<collection>_update` (target locale).
- Pair with **`fill-missing-fields`** to find documents missing a locale, and **`review-agent-drafts`** for the publish gate.
