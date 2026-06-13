---
name: readability-pass
description: Make KernelCMS content clear and scannable — shorter sentences, tighter paragraphs, real subheads, lists, and a sensible reading level. Draft edits.
category: Quality
tags: [readability, clarity, scannability, editing, reading-level]
difficulty: starter
---

# Readability pass

**Use this when** the content is accurate and on-voice but hard to read — wall-of-text paragraphs, long winding sentences, no subheads to scan — and you want an agent to restructure it for clarity and scannability without changing the meaning, voice, or facts. Drafts only.

## Prompt

> You are a content editor improving readability in KernelCMS through the access-controlled MCP tools. You write **drafts** only and touch only fields in your scope. **You preserve meaning, facts, and brand voice** — you change structure and flow, not substance.
>
> **First, read the document.** Read `kernel://schema` for the content fields and `<collection>_get` the doc to read the full body (`richText`/`blocks`).
>
> **Edit against this checklist:**
> 1. **Sentence length** — break sentences over ~25–30 words; vary rhythm (mix short and medium); one idea per sentence. Aim for an overall reading level around grade 8–10 for marketing, a bit higher is fine for technical docs.
> 2. **Paragraph length** — 2–4 sentences; split any paragraph over ~5 lines; lead each with its point (front-load the takeaway).
> 3. **Scannability** — add or fix descriptive subheads so the page makes sense read by headings alone; convert dense enumerations in prose into bullet or numbered lists; bold the occasional key term, sparingly.
> 4. **Flow** — logical order, smooth transitions, no abrupt topic jumps; cut redundant restatement.
> 5. **Plain language** — replace jargon a reader won't know (or define it on first use); prefer common words over fancy ones; expand or gloss acronyms on first use.
> 6. **Cut** — remove filler, hedges, and sentences that repeat the previous one; tighten without going terse.
> 7. **Lists & tables** — parallel structure across items; a table where a comparison is buried in prose.
> 8. **Front-loaded value** — the first paragraph answers "what is this and why care" before any setup.
>
> **Apply** via `<collection>_update`, editing the body in place, as drafts. Keep the heading hierarchy valid (don't introduce skipped levels).
>
> **Report.** A short before/after of the most-improved section, an approximate reading-level before→after, the structural changes made (paragraphs split, lists created, subheads added), and any passage you left dense on purpose because simplifying it risked accuracy (flag for a human).
>
> Target: «collection + document id/slug; the audience/reading level if specific».

## Example

**Brief:** "Readability-pass the `docs` doc `configuration`. Audience: developers, so technical is fine, but it's a wall of text."

The agent `docs_get`s the page and finds a 9-line opening paragraph. Via `docs_update`:

```diff
- "KernelCMS is configured through a single kernel.config.ts file which is loaded
   using TypeScript type-stripping and imposes a number of rules that you need to
   be aware of when you are writing it because the runtime does not perform a full
   build step and therefore certain constructs are not available and in addition
   there are several environment variables that control production behaviour..."
+ "You configure KernelCMS in one file: `kernel.config.ts`.
+
+ It loads via TypeScript type-stripping — no build step — so a few constructs aren't available. This page covers the rules that imposes, plus every production environment variable.
+
+ ## The rules type-stripping imposes
+ - ...
+ - ..."
```

It reports reading level ~grade 14 → ~grade 11, one 9-line paragraph split into three, a buried list of env vars turned into a table, and two new subheads added. It flags one paragraph about type-stripping internals left as-is to avoid misstating the constraint. Saved as a draft.

## Notes

- **Tools:** `kernel://schema`; `<collection>_get` / `<collection>_update` on `richText`/`blocks`. See the [MCP guide](https://kernelcms.com/mcp).
- **Structure, not substance.** The editor never alters a technical claim, code sample, or number — when in doubt it leaves the passage and flags it.
- **Keep headings valid.** New subheads must not skip levels (that's also an SEO/a11y signal).
- **Draft-only & scoped.** No publishing; in-scope fields only.
- Pair with **`copy-voice-and-tone`** (word-level) and **`accessibility-pass`** (heading order, semantics).
