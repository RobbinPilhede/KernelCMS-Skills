---
name: conversion-audit
description: Audit a KernelCMS landing page for conversion — one clear action, low friction, real proof, an honest value prop — and apply scoped draft fixes.
category: Quality
tags: [conversion, landing-page, cta, proof, marketing]
difficulty: intermediate
---

# Conversion audit

**Use this when** a landing or marketing page is built and you want an agent to review it as a conversion specialist — is the single action obvious, is the value prop clear in five seconds, is there real proof, where's the friction — and tighten the copy and structure to support that one action. Drafts only.

## Prompt

> You are a conversion-rate specialist auditing a KernelCMS landing page through the access-controlled MCP tools. You write **drafts** only and touch only fields in your scope. You **never fabricate proof** — no invented metrics, testimonials, or logos.
>
> **First, read the page.** Read `kernel://schema` for the page's `blocks` and content fields, then `<collection>_get` the document. Identify the page's *one intended action* from the brief (sign up, install, book a demo).
>
> **Audit against this checklist:**
> 1. **The five-second test** — does the hero make the value prop (who it's for + the outcome) clear immediately? Headline = outcome, not category; subhead adds the concrete how.
> 2. **One primary action** — a single, repeated primary CTA with consistent label/destination; secondary actions visually subordinate; no competing primary CTAs fighting for the click.
> 3. **CTA quality** — verb + specific object ("Start the quickstart", "Install kernelcms"), placed after the value is established and repeated at the close; reduces the cost of the click ("free", "no card") truthfully.
> 4. **Proof & trust** — real social proof near the top (logos, a concrete metric, a named testimonial); proof is specific, attributed, and not vague ("trusted by many"). Flag any proof that looks fabricated or unattributed for a human.
> 5. **Friction** — count the steps to the action; remove unnecessary form fields, gated content, and detours; address the top 2–3 objections (price, lock-in, effort) before the close, ideally in an FAQ.
> 6. **Clarity over cleverness** — no jargon or hype obscuring what it does; the reader always knows what happens next.
> 7. **Narrative arc** — hero → proof → value → how → objections → close; cut any section that doesn't move the reader toward the action.
> 8. **Risk reversal** — guarantee, free tier, "cancel anytime", or open-source/MIT stated where relevant and true.
>
> **Apply** the copy/structure fixes you can make truthfully — sharpen the headline, unify CTA labels, reorder or cut a section, surface an existing testimonial higher — via `<collection>_update`, as drafts. **Do not add proof that isn't already in the content; request it instead.**
>
> **Report.** State the page's single action and whether it's currently obvious; list the friction points found and what you changed; and list what you *can't* fix without new material (a real metric, a customer quote, a logo) as a request to the human.
>
> Target + goal: «collection + document id/slug; the one action the page should drive».

## Example

**Brief:** "Conversion-audit the `pages` doc `home`. The one action is `npm install kernelcms`."

The agent `pages_get`s the page and finds a clever-but-vague hero, two competing CTAs ("Get started" and "Explore"), and a testimonial buried at the bottom. Via `pages_update`:

```diff
- hero.heading: "Content, reimagined for the modern web."
+ hero.heading: "A headless CMS that doesn't hijack your framework."
- hero.subhead: (missing)
+ hero.subhead: "Model your content in one kernel.config.ts. Self-host on any container. npm install kernelcms."

CTAs: "Get started" + "Explore"  →  one primary "Install kernelcms" (repeated in hero + close), "Read the docs" demoted to secondary

Moved the named testimonial block from position #7 up to position #2 (proof right after the hero)
```

It reports the action is now unambiguous and one detour was cut, then requests three things it won't fabricate: a concrete adoption metric for the hero, permission to show two customer logos, and the MIT/free-tier line surfaced near the CTA. Saved as a draft.

## Notes

- **Tools:** `kernel://schema`; `<collection>_get` / `<collection>_update` on `blocks` and copy fields. See the [MCP guide](https://kernelcms.com/mcp).
- **No fabricated proof — ever.** The agent reorders, surfaces, and sharpens existing proof; new metrics/quotes/logos are *requested*, never invented. This is the integrity guardrail.
- **One action.** The whole audit is in service of a single conversion goal from the brief; competing primary CTAs are the most common fix.
- **Draft-only & scoped.** No publishing; in-scope fields only.
- Pair with **`copy-voice-and-tone`** (sharpen the words) and **`design-landing-page`** (Page design) if the structure needs a rebuild, not a tune-up.
