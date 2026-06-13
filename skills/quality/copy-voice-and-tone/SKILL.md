---
name: copy-voice-and-tone
description: Enforce a brand voice across KernelCMS content — kill hype and cliché, tighten sentences, keep tense and person consistent — as scoped draft edits.
category: Quality
tags: [copywriting, voice, tone, editing, brand]
difficulty: starter
---

# Copy voice and tone

**Use this when** the structure of a page is fine but the words aren't — too much hype, generic marketing filler, inconsistent voice — and you want an agent to rewrite the copy in a defined brand voice, cutting clichés and tightening, while preserving meaning and facts. Edits land as drafts.

## Prompt

> You are a brand copy editor working in KernelCMS through the access-controlled MCP tools. You write **drafts** only and touch only fields in your scope. You **never change facts, numbers, claims, or product names** — only how they're said.
>
> **First, read the voice and the content.** Take the brand voice spec from the brief (or infer it from the strongest existing page and state your inference). Then read `kernel://schema` for the content fields and `<collection>_get` the document to read every headline, subhead, body block, CTA label, and meta field.
>
> **Edit against this checklist:**
> 1. **Kill hype words** — revolutionary, seamless, powerful, robust, cutting-edge, game-changing, world-class, next-generation, effortless, unlock, supercharge, leverage, delight. Replace with a concrete claim or cut.
> 2. **Kill clichés & filler** — "in today's fast-paced world," "take it to the next level," "best-in-class," "and much more," "the perfect solution." Delete or specify.
> 3. **Specifics over adjectives** — replace "blazing fast" with the actual fact ("cold-starts in under a second"), "easy" with the step count.
> 4. **Tighten** — cut hedges (just, really, very, simply), redundant pairs ("each and every"), and throat-clearing openers. Prefer active voice and strong verbs.
> 5. **Consistency** — one person (usually second-person "you"), one tense, consistent capitalization of product/feature names, consistent terminology (don't alternate "post" / "article" / "entry").
> 6. **Headlines earn their place** — each states an outcome, not a category label; the H1 makes a promise; subheads add information, not restate the head.
> 7. **CTA labels** — verb + object, specific ("Read the quickstart"), never "Learn more" / "Submit" / "Click here".
> 8. **Length fit** — respect field limits (e.g. `meta_title` ≤70, `meta_description` ≤160) and keep headlines scannable.
>
> **Apply edits** via `<collection>_update`, as drafts. Keep the same structure; rewrite in place.
>
> **Report.** A before→after table of the meaningful rewrites, the voice you applied, and any line you left alone because changing it risked the meaning (flag for a human).
>
> Target + voice: «collection + document id/slug; the brand voice in one line, e.g. "calm, precise, a little contrarian; never hypes"».

## Example

**Brief:** "Voice-edit the `pages` doc `home`. Voice: precise, confident, a little contrarian; concrete over clever; no hype."

The agent `pages_get`s the page and rewrites via `pages_update`:

```diff
- hero.heading: "Revolutionize your content with the most powerful headless CMS ever built."
+ hero.heading: "A headless CMS that doesn't hijack your framework."

- hero.subhead: "Effortlessly supercharge your workflow and unlock seamless productivity."
+ hero.subhead: "Model your content in one kernel.config.ts. REST, GraphQL, a typed Local API, and a React admin from the same file."

- features[0].body: "Best-in-class performance that's blazing fast and much more."
+ features[0].body: "Zero native dependencies and a SQLite default — light installs, fast cold starts."

- cta.label: "Learn more"
+ cta.label: "Read the 3-step quickstart"
```

It reports leaving one testimonial quote untouched (a customer's exact words — flagged, not edited) and notes the page now uses "you" consistently and never says "powerful." Saved as a draft.

## Notes

- **Tools:** `kernel://schema`; `<collection>_get` / `<collection>_update` across `blocks`, `richText`, headline, and meta fields. See the [MCP guide](https://kernelcms.com/mcp).
- **Facts are off-limits.** The editor never invents or alters a claim, metric, price, or quote — only the phrasing. Verbatim quotes are flagged, never rewritten.
- **Field limits are real.** Rewrites must still fit `maxLength` (the SEO plugin caps `meta_title` at 70, `meta_description` at 160).
- **Draft-only & scoped.** No publishing; in-scope fields only.
- Pair with **`readability-pass`** for structure/rhythm and **`seo-optimize-page`** for keyword fit.
