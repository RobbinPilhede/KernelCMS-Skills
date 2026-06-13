---
name: model-a-docs-site
description: Model a versioned documentation site in KernelCMS — docs with groups, ordering, code blocks, and version history — as typed config-as-code.
category: Content modeling
tags: [docs, versioning, ordering, code, navigation]
difficulty: intermediate
---

# Model a docs site

**Use this when** you want an agent to model a documentation site in KernelCMS: a `docs` collection organized into sidebar **groups** with explicit **ordering**, rich content with **code** blocks, and real **version history** so you can see and restore past revisions. The output is a typed `kernel.config.ts`.

## Prompt

> You are modeling a documentation site in KernelCMS as config-as-code with `defineConfig`. Use only real field types: `text`, `textarea`, `slug`, `code`, `number`, `boolean`, `date`, `select`, `richText`, `group`, `array`, `relationship`, `upload`, and the `join`/`row`/`tabs` containers.
>
> **Model a `docs` collection:**
> 1. **Identity & nav:** `title` (text, required), `slug` (slug, unique, required, index), `nav_label` (text — the short sidebar label), `lead` (textarea — the one-line summary under the title).
> 2. **Grouping & ordering:** `group` (a `select` of the fixed sidebar sections, e.g. "Getting started", "Content modeling"), and `order` (`number`, `integer: true`, `index: true`) for deterministic within-group sort. Set `admin.defaultSort: 'order'` so lists and the `join` come back ordered. A self-`relationship` `parent` (→ `docs`, `onDelete: 'setNull'`) supports nesting if the brief needs a tree.
> 3. **Content:** `body` (richText, `preset: 'full'`). For doc-shaped content, richText carries headings, lists, and inline/code blocks. If pages are mostly long code samples, add a `code_examples` `array` of `{ language: select, code: code }` so each sample is typed and language-tagged rather than buried in prose.
> 4. **Meta:** `updated_at` is automatic (`timestamps`). Add `is_deprecated` (boolean) and an optional `redirect_to` self-relationship for moved pages.
>
> **Versioning — this is the point.** Give `docs` `versions: true` for history-only (every save snapshots, restorable from the admin and `<slug>_versions`), or `versions: { drafts: true, maxPerDoc: 100 }` if you also want a draft → published edge so edits are staged before going live. Choose history-only when every save should be live but auditable; choose drafts when reviewers gate publishing. State which and why.
>
> **Doc versions (e.g. v1 vs v2 of the product).** That is product versioning, distinct from document history. Model it as a `version` `select`/relationship field (or a `doc_versions` collection that `docs` belong to) so the same slug exists per product version. Don't conflate it with `versions:` (which is revision history of one document).
>
> **Access.** Public reads; writes auth-only. Gate publishing with `access.publish` if drafts are on.
>
> **Admin.** `useAsTitle: 'title'`, `defaultColumns: ['title', 'group', 'order']`, `defaultSort: 'order'`, `admin.group` to bucket docs in the sidebar.
>
> Output the config, then justify: the group+order ordering model, history-only vs. drafts, and how product-version differs from document-history.

## Example

**Brief:** "Developer docs grouped into sections, manually ordered in the sidebar, full code samples, and a restorable history of every edit. Edits go live immediately but must be auditable."

The agent chooses **`versions: true` (history-only)** and emits (excerpt):

```ts
import { defineConfig } from 'kernelcms'
import { sqliteAdapter } from 'kernelcms/sqlite'

const GROUPS = ['Getting started', 'Content modeling', 'Access & auth', 'Data & APIs'] as const
const LANGS = ['ts', 'bash', 'json', 'http', 'graphql', 'sql'] as const

export default defineConfig({
  secret: process.env.KERNEL_SECRET ?? 'dev-only-secret',
  db: sqliteAdapter({ url: 'file:./content.db' }),
  collections: [
    {
      slug: 'docs',
      versions: true, // history-only: every save is snapshotted and restorable
      admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'group', 'order'],
        defaultSort: 'order',
        group: 'Documentation',
      },
      access: { read: () => true, update: ({ req }) => Boolean(req.user) },
      fields: [
        { type: 'row', fields: [
          { name: 'title', type: 'text', required: true, admin: { width: 60 } },
          { name: 'slug', type: 'slug', required: true, unique: true, index: true, admin: { width: 40 } },
        ] },
        { name: 'nav_label', type: 'text', admin: { description: 'Short label shown in the sidebar.' } },
        { name: 'lead', type: 'textarea', maxLength: 200 },
        { type: 'row', fields: [
          { name: 'group', type: 'select', options: [...GROUPS], required: true, admin: { width: 60 } },
          { name: 'order', type: 'number', integer: true, index: true, defaultValue: 0, admin: { width: 40 } },
        ] },
        { name: 'parent', type: 'relationship', relationTo: 'docs', onDelete: 'setNull',
          admin: { description: 'Optional parent for nested pages.' } },
        { name: 'body', type: 'richText', preset: 'full' },
        { name: 'code_examples', type: 'array', admin: { description: 'Standalone, language-tagged samples.' },
          fields: [
            { name: 'caption', type: 'text' },
            { name: 'language', type: 'select', options: [...LANGS], defaultValue: 'ts' },
            { name: 'code', type: 'code', required: true },
          ] },
        { name: 'is_deprecated', type: 'boolean', defaultValue: false },
      ],
    },
  ],
})
```

**Rationale (abridged):** `group` (a fixed select) + `order` (indexed integer) with `defaultSort: 'order'` gives a deterministic, manually-curated sidebar — the order the join and list views inherit. `versions: true` (not drafts) because edits should be live immediately but every save must be restorable from history; drafts would add a publish gate the brief doesn't want. Code samples are a typed `array` of `{ language, code }` rather than embedded in prose, so each is highlightable and queryable. `parent` is a self-relationship with `setNull` so deleting a parent doesn't cascade away its children.

## Notes

- **Two different "versions".** `versions:` is **revision history of one document** (audit/restore). Product/doc **versions** (v1 vs v2 of the whole site) are a content dimension — model with a `version` field or a `doc_versions` collection. Don't use `versions:` for the latter.
- **`versions: true` vs `versions: { drafts: true }`:** history-only snapshots every save and is restorable; drafts adds the `_status` lifecycle, scheduled publish, and the separate `access.publish` edge. See **`localization-setup`** and **`model-a-blog`** for the drafts path.
- **Ordering is explicit.** An indexed `order` integer + `defaultSort: 'order'` beats relying on `createdAt`. The `join`/sidebar inherits the related collection's `defaultSort`.
- **`code` field** is a single code string; an `array` of `{ language, code }` is the move when a page has many distinct samples.
- Restore from history via the admin or the `<slug>_versions` surface; `findVersions` can filter by `createdByType` to review agent vs. human edits.
