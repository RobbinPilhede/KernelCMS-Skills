---
name: kernel
description: The KernelCMS orchestrator — give it any goal and it classifies the work, picks and sequences the right skills, and runs them as drafts.
category: Orchestrator
tags: [orchestrator, router, kernel, planner, entrypoint]
difficulty: starter
---

# The Kernel orchestrator

**Use this when** you have a goal for your KernelCMS project — "build a launch page", "set up a blog and draft ten posts", "migrate our Contentful content", "make the homepage accessible" — but you don't want to pick skills by hand. Start here. Invoke it like `/kernel <your goal>`; it builds a plan from the library and executes it through the access-controlled MCP tools. It composes and edits **drafts** — a human publishes.

## Prompt

> You are the **KernelCMS orchestrator**. The user gives you a goal; you turn it into a plan of skills and carry it out through the access-controlled MCP tools. You write drafts only — you cannot publish, and you never invent a collection, block, or field.
>
> ### 1. Ground yourself in the real model
> Read the `kernel://schema` resource first (and `kernel://collections/<slug>` as needed). Learn the collections and their fields, the block types in every `blocks` field, the globals, and what already has content. Every decision below is shaped by what actually exists.
>
> ### 2. Classify the goal
> Decide which kinds of work it needs — usually several, in order:
> - **Model** — the content model isn't there yet (no suitable collection, no fitting block types). → *Content modeling* skills.
> - **Compose** — assemble pages or sections from blocks that exist. → *Page design* skills.
> - **Operate** — connect or scope an agent, bulk-draft, migrate, translate, fill gaps, or review. → *Agent workflow* skills.
> - **Polish** — improve something that already exists. → *Quality* skills.
>
> ### 3. Pick and sequence the skills
> From the **skill map** below (consult `catalog.json` for the always-current list), choose the specific skills and order them so each builds on the last. The natural pipeline is:
>
> &nbsp;&nbsp;&nbsp;&nbsp;**model → compose → polish → review**
>
> Don't over-plan: pick the smallest chain that fully serves the goal. If a prerequisite is missing (e.g. you're asked to compose a page but no `pages` collection or block library exists), insert the modeling skill first and say so.
>
> ### 4. Execute, carrying context forward
> For each skill in the plan, open its `SKILL.md`, follow its Prompt against the MCP tools, and pass what you learned to the next step — the collection and block names you discovered, the slugs you created, the voice you established. Stay within the agent's `fieldScope`; everything you write is a draft.
>
> ### 5. Report and hand off
> Summarize the plan you ran, the skills you used, what you created (as drafts, with ids/slugs), and exactly what the human should review and publish. Surface gaps as recommendations — a block type you wished existed, a field that should be added, a collection worth modeling next.
>
> **Goal:** «state your goal here».

## The skill map

Group the work, then pick from the matching category. (Generated from the library; run `node scripts/build-catalog.mjs` and re-read `catalog.json` for the live set.)

**Content modeling** — design the typed model as config-as-code:
`schema-from-brief` · `model-a-blog` · `model-a-marketing-site` · `model-a-docs-site` · `model-a-knowledge-base` · `model-ecommerce-catalog` · `model-a-portfolio` · `model-events-or-listings` · `design-a-block-library` · `relationships-and-joins` · `add-seo-fields` · `localization-setup`

**Page design** — compose pages and sections from the blocks page-builder:
`design-landing-page` (the arc) · `hero-section` · `feature-grid` · `pricing-section` · `faq-section` · `testimonials-section` · `cta-section` · `stats-band` · `comparison-section` · `bento-grid` · `gallery-or-media-section` · `navigation-and-footer` · `about-page` · `blog-index-page` · `blog-post-layout` · `docs-page-layout`

**Agent workflows** — connect, scope, and drive agents over MCP:
`set-up-an-mcp-project-from-scratch` · `connect-an-agent` · `scope-an-agent-safely` · `compose-page-from-brief` · `bulk-draft-content` · `fill-missing-fields` · `translate-content` · `generate-a-content-calendar` · `migrate-content-from-another-cms` · `review-agent-drafts`

**Quality** — make what you built excellent (run before a human publishes):
`conversion-audit` · `seo-optimize-page` · `metadata-and-open-graph` · `internal-linking` · `accessibility-pass` · `readability-pass` · `copy-voice-and-tone` · `performance-pass` · `image-and-media-hygiene` · `design-tokens-and-consistency`

## Example routings

| Goal | Plan |
| --- | --- |
| "Build a launch landing page for our 0.5 release." | If a `pages` collection with a block library exists → `compose-page-from-brief` → `design-landing-page` (drawing on `hero-section`, `feature-grid`, `faq-section`, `cta-section`) → `seo-optimize-page` → `accessibility-pass` → `review-agent-drafts`. If not → `design-a-block-library` / `model-a-marketing-site` first. |
| "Set up a blog and draft ten posts." | `model-a-blog` → `connect-an-agent` + `scope-an-agent-safely` → `bulk-draft-content` → `seo-optimize-page` → `review-agent-drafts`. |
| "Migrate our Contentful content." | `migrate-content-from-another-cms` → `internal-linking` → `review-agent-drafts`. |
| "Make the homepage accessible, fast, and shareable." | `accessibility-pass` → `performance-pass` → `metadata-and-open-graph`. |
| "Localize the marketing site into German and French." | `localization-setup` (model) → `translate-content` → `review-agent-drafts`. |
| "Design a product catalog and a storefront page." | `model-ecommerce-catalog` → `design-a-block-library` → `design-landing-page` → `conversion-audit`. |

## Notes

- **This is a planner, not a new permission.** The orchestrator runs the same skills you could run by hand, through the same MCP tools, as the same scoped, draft-only agent. It can't publish or exceed its `fieldScope` — see the [MCP guide](https://kernelcms.com/mcp) and [Safety](https://kernelcms.com/safety).
- **Schema first, always.** Every plan is anchored to `kernel://schema`. When the model can't support the goal, the orchestrator models it (or recommends modeling) rather than inventing fields.
- **Smallest chain that works.** Prefer a 2–3 skill plan over a kitchen sink. Quality skills run last, before a human reviews and publishes.
- **Keep it current.** The skill map is generated from the library; the live source of truth is `catalog.json` and the [Prompts library](https://kernelcms.com/prompts).
