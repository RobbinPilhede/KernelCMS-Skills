---
name: create-content-templates
description: Define reusable document skeletons in KernelCMS so editors start new content from a pre-filled template (default fields + a blocks layout) instead of a blank page — created through the normal access-checked pipeline.
category: Content modeling
tags: [templates, page-builder, blocks, productivity, scaffolding]
difficulty: starter
---

# Create content templates

**Use this when** your editors keep building the same kinds of pages from scratch — a landing page, a standard article, a press release, an event page. A template gives them a "New from template" that pre-fills the document (default fields and a starting blocks layout) so they edit instead of assemble.

This is a configuration runbook.

## Prompt

This skill is operational — follow the runbook.

### 1. Define the skeletons

```ts
export default defineConfig({
  templates: [
    {
      slug: 'landing',
      collection: 'pages',
      name: 'Landing page',
      description: 'Hero + features + CTA',
      data: {
        title: 'Untitled landing page',
        layout: [
          { blockType: 'hero', heading: 'Your headline', subheading: 'Your subhead' },
          { blockType: 'cta', label: 'Get started', href: '/signup' },
        ],
      },
    },
    { slug: 'article', collection: 'posts', name: 'Standard article', data: { title: 'Untitled', body: '' } },
  ],
})
```

`data` is the document's default field values — anything a normal create accepts, including a full blocks `layout`. It's deep-frozen, so it stays a clean shared skeleton.

### 2. List and instantiate

```ts
const templates = await kernel.listTemplates({ collection: 'pages' })  // metadata only
const page = await kernel.createFromTemplate({ template: 'landing' })  // pre-filled draft
const custom = await kernel.createFromTemplate({ template: 'landing', data: { title: 'Spring launch' } })
```

Your `data` overrides the template defaults (caller wins, nested objects merge). Over REST: `GET /api/_admin/templates`, `POST /api/pages/from-template` with `{ "template": "landing", "data": { ... } }`.

### 3. Wire a "New from template" button

In your admin or app, fetch `listTemplates({ collection })` to populate a picker, then POST to `from-template` on selection. The result is a normal draft document the editor opens and finishes.

### 4. Trust the boundaries

Creating from a template is a **normal create** — the editor must have create access, validation runs, out-of-scope fields are stripped for a scoped agent, and the agent draft-only brake holds (a template that sets `_status: 'published'` never publishes for an agent). The caller's override `data` is prototype-pollution-guarded, the template config can't be mutated at runtime, and a template only ever creates into its configured collection (the route is authoritative).

Provide: «the document types editors build repeatedly, and the default fields / blocks layout each should start with».
