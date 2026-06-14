---
name: gate-publishes-with-content-qa
description: Turn KernelCMS pre-publish evals into content CI — block publishes that fail your rules (required fields, a11y, SEO, policy, brand) and lint a draft on demand so an editor sees every blocker and warning before they publish.
category: Quality
tags: [content-ci, linting, evals, pre-publish, quality-gate, lintDocument]
difficulty: intermediate
---

# Gate publishes with content QA

**Use this when** you want a hard quality bar on what goes live — every published document must have its summary, valid heading order, alt text on images, a sane SEO title, no banned terms — and you want editors to see exactly what fails *before* they hit publish, not a mystery rejection. This is content CI: the same rules gate the publish and power an on-demand lint.

## Prompt

> You are wiring **content QA / linting** into a KernelCMS project. The model: a small set of pure **eval rules** in `config.evals` run at the publish chokepoint — a *blocking* rule that returns an `error` finding **rejects the publish** — and `kernel.lintDocument(...)` runs those **same rules** on demand so an editor sees the result first. A green lint is a publishable document.
>
> **1. Choose the rules.** Drop the built-in factories into `config.evals`. Each is pure (reads only the fields it declares, no network, no mutation) and composable:
>
> ```ts
> import { defineConfig, requiredFieldsEval, seoEval, a11yEval, readabilityEval, linkEval } from '@kernel/core'
>
> export default defineConfig({
>   evals: [
>     // BLOCKING — these reject a publish:
>     requiredFieldsEval({ fields: ['summary', 'hero', 'category'] }),
>     seoEval({ titleField: 'title', descriptionField: 'meta_description' }),
>     a11yEval(),                              // embedded images need alt; heading levels must not skip
>     // NON-BLOCKING — quality nudges, never reject a publish:
>     readabilityEval({ fields: ['body'] }),   // warns on long-winded prose
>     linkEval(),                              // warns on empty / '#' / malformed link targets
>     // scope a rule to specific collections (default: every collection):
>     { ...a11yEval(), appliesTo: ['posts', 'pages'] },
>   ],
>   collections: [/* … */],
> })
> ```
>
> Two knobs: **`blocking`** (default `true`) — whether an `error` finding rejects the publish; set `blocking: false` to make a rule warn-only. **`appliesTo: ['slug', …]`** — scope a rule to those collections; omit it to apply everywhere. `warn`/`info` findings **never block**, even from a blocking rule — only an `ok:false` `error` does.
>
> **2. Lint on demand.** Surface the blockers in the editor before publish:
>
> ```ts
> const { ok, findings, blocking } = await kernel.lintDocument({ collection: 'posts', id, req })
> // ok === true exactly when `blocking` is empty. findings = every result; blocking = the publish-rejecting subset.
> ```
>
> Over REST: `GET /api/:collection/:id/lint`. **Lint is gated on UPDATE access** (it inspects the live draft and its findings echo content) — only an editor of the document can lint it, never a public reader, so drafts can't leak. A missing doc is `NotFound`; a non-editor is `Forbidden`.
>
> **3. Trust the gate.** The same `config.evals` run on **every** publish path — direct publish, scheduled drain, content releases (each member dry-run through the gate), branch merge, federation sync, and the agentic-workflow `evalGate` step. A rule that throws **fails closed** (it becomes a blocking error, never a silent pass and never a 500). So a document that lints green is one that will actually publish.
>
> **4. Write a custom rule when a built-in doesn't fit.** An `EvalRule` is just `{ name, blocking?, appliesTo?, run({ doc, collection, req, fields }) }` returning `EvalFinding[]`. Keep it **pure** — read only the doc, no network, no DB, no mutation — so the lint and the gate always agree. Return `{ ok:false, severity:'error', message, field }` to block; `severity:'warn'`/`'info'` to nudge.
>
> Tell me: «which collections, what must be true to publish (required fields, SEO/a11y, banned terms, disclaimers), and which checks should block vs. just warn».

## Example

**Brief:** "Posts must never publish without a `summary` and a `hero`, headings must be valid, and flag long-winded copy — but don't block on it."

```ts
evals: [
  requiredFieldsEval({ fields: ['summary', 'hero'], appliesTo: ['posts'] }),
  a11yEval(),                                              // blocking: alt text + heading order
  readabilityEval({ fields: ['body'], maxAvgSentenceWords: 22 }),  // warn only
]
```

An editor opens a draft missing its hero and calls lint:

```jsonc
{
  "ok": false,
  "blocking": [
    { "rule": "required-fields", "severity": "error", "field": "hero", "message": "\"hero\" is required before publishing.", "blocking": true }
  ],
  "findings": [
    { "rule": "required-fields", "ok": false, "severity": "error", "field": "hero", "message": "\"hero\" is required before publishing.", "blocking": true },
    { "rule": "readability", "ok": false, "severity": "warn", "field": "body", "message": "\"body\" averages 31 words/sentence (aim for ≤ 22). Shorter sentences read easier.", "blocking": false }
  ]
}
```

The admin shows the blocker (add a hero) and the nudge (tighten the prose). Adding the hero flips `ok` to `true`; publish now succeeds. The readability warning rides along in the audit meta but never blocks.

## Notes

- **Lint = publish gate.** `lintDocument` runs the **same `config.evals`** as publish — its result is exactly what publish would see, so you never get a surprise rejection.
- **Built-ins are pure & deterministic.** `requiredFieldsEval`, `seoEval`, `a11yEval`, `policyEval`, `brandEval`, `readabilityEval`, `linkEval` — each reads only its declared fields, so lint and gate always agree. A throwing rule fails closed.
- **Gated on update access.** Lint requires the right to *edit* the document (it exposes the draft), so a public reader can't harvest unpublished content through it.
- **Pairs with** the [agentic-workflow `evalGate` step](https://kernelcms.com/docs/agentic-workflows) (autonomous output runs the same CI) and the [draft/publish lifecycle](https://kernelcms.com/docs/versions-and-drafts) these rules gate. See the [content QA guide](https://kernelcms.com/docs/content-qa).
