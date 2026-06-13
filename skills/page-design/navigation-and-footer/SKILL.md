---
name: navigation-and-footer
description: Compose site navigation and footer in KernelCMS from header/footer globals — grouped links, clear hierarchy — as a draft.
category: Page design
tags: [navigation, footer, globals, blocks]
difficulty: intermediate
---

# Design navigation and footer

**Use this when** you want an agent to build the two pieces of chrome every page shares: the top nav and the footer. These usually live in **globals** (a `header` and a `footer` singleton), not a page's blocks. The agent reads the real global shape from your schema, writes a tight, grouped link structure, and leaves it as a draft.

## Prompt

> You are a senior product designer composing a site's navigation and footer in KernelCMS. You work through the access-controlled MCP tools and write **drafts** only.
>
> **First, learn the model.** Read `kernel://schema` to find the **header and footer globals** (or whatever holds the nav) and their real fields — typically a `header` global with `links[] = { label, href }` plus a `cta`, and a `footer` global with grouped `columns[] = { heading, links[] }`, a tagline, and legal links. Use only the fields the schema exposes. Globals are read/written with `<slug>_get_global` and `<slug>_update_global` — not the collection CRUD tools. If nav lives in a page block instead, adapt, and say so.
>
> **Then design navigation that disappears — in the good way:**
> - **Top nav is ruthless.** 4 to 6 items, maximum. The primary nav is for the handful of destinations most people want — Product, Docs, Pricing, Blog — plus one CTA. Everything else belongs in the footer. A nav with ten items is a nav with no priorities.
> - **One CTA in the header.** A single action (`Start free`, `Sign in` + `Get started`) — the same one the whole site is pointing at. Don't compete with yourself.
> - **Label by destination, in the user's words.** "Docs," "Pricing," "Blog" — not "Resources" or "Solutions" mystery-meat dropdowns. If you must group, group by what the reader is trying to do.
> - **The footer is the sitemap.** Here completeness is fine — that's its job. Group links into 3–5 labeled columns (Product, Developers, Company, Legal), each a short scannable list. Put legal/social on a quiet bottom row.
> - **Order by importance.** Left-to-right in the nav and top-to-bottom in each footer column should track how much people want each link.
>
> **Design judgment.** The nav collapses to a menu on mobile — keep labels short and the count low so it works as a vertical list too. The footer's columns should be roughly balanced in length. Don't pad either with links that exist only to look full.
>
> **Guardrails.** Real global fields only, all hrefs real paths, all must validate. Write globals via `<slug>_update_global`. The change stays a draft — you cannot publish. When done, list the nav items and the footer column headings, and tell me it's ready to review.
>
> Brief: «the main destinations, the primary CTA, what belongs in the footer, brand voice».

## Example

**Brief:** "Header and footer for kernelcms.com. Nav: Product, Docs, Pricing, Blog + 'Start free' CTA. Footer columns: Product, Developers, Company, Legal. Voice: understated."

The agent reads `kernel://schema`, finds a `header` global (`links[] = { label, href }`, `cta = { label, href }`) and a `footer` global (`tagline`, `columns[] = { heading, links[] = { label, href } }`, `legal[]`). It calls `header_update_global` and `footer_update_global`:

```json
// header_update_global
{
  "links": [
    { "label": "Product", "href": "/" },
    { "label": "Docs", "href": "/docs" },
    { "label": "Pricing", "href": "/pricing" },
    { "label": "Blog", "href": "/blog" }
  ],
  "cta": { "label": "Start free", "href": "/docs/quickstart" }
}
```

```json
// footer_update_global
{
  "tagline": "A headless CMS that never hijacks your framework.",
  "columns": [
    { "heading": "Product", "links": [ { "label": "Features", "href": "/" }, { "label": "Pricing", "href": "/pricing" }, { "label": "Changelog", "href": "/changelog" } ] },
    { "heading": "Developers", "links": [ { "label": "Docs", "href": "/docs" }, { "label": "MCP", "href": "/mcp" }, { "label": "GitHub", "href": "https://github.com/kernelcms" } ] },
    { "heading": "Company", "links": [ { "label": "Blog", "href": "/blog" }, { "label": "About", "href": "/about" } ] },
    { "heading": "Legal", "links": [ { "label": "Privacy", "href": "/privacy" }, { "label": "Terms", "href": "/terms" } ] }
  ]
}
```

…leaving both globals as **drafts**.

## Notes

- **Globals, not collections.** Header and footer are singletons — use `<slug>_get_global` to read the current shape and `<slug>_update_global` to write. They don't have list/create/delete tools.
- **Nav is editing, footer is listing.** The skill in the header is cutting to 4–6; the skill in the footer is grouping completely. Different jobs.
- **Mobile.** A short header collapses gracefully into a menu; a ten-item one doesn't. Keep it lean.
- **Tools:** `kernel://schema` for the global shapes; `<slug>_get_global` / `<slug>_update_global` to write. See the [MCP guide](https://kernelcms.com/mcp).
- **Pair with** `internal-linking` so the footer's link map matches the real site, and `accessibility-pass` to confirm the mobile menu and focus order hold up.
- **Draft-only.** Review and publish yourself.
