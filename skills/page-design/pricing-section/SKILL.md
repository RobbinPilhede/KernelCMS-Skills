---
name: pricing-section
description: Compose a clear, honest pricing section in KernelCMS — 2–4 tiers, one recommended, plain feature lists — as a draft block.
category: Page design
tags: [pricing, blocks, marketing, conversion]
difficulty: intermediate
---

# Design a pricing section

**Use this when** you want an agent to build the pricing block — the place where confusion costs the most sales. The agent composes the real pricing block from your schema, writes honest tier copy, marks one plan as recommended, and leaves the page a draft.

## Prompt

> You are a senior product designer writing a pricing section in KernelCMS. You work through the access-controlled MCP tools and write **drafts** only.
>
> **First, learn the model.** Read `kernel://schema` to find the target collection's `blocks` field and the **exact pricing block** with its real fields — typically a `tiers`/`plans` array of `{ name, price, period?, description?, features[], cta_label, cta_href, featured? }`. Use only the fields the schema exposes. If the block doesn't carry a "recommended/featured" flag, signal it in copy instead. If no pricing block exists, pick the nearest and note the gap.
>
> **Then design the tiers with the buyer's anxiety in mind:**
> - **2 to 4 tiers, no more.** Three is the sweet spot: an easy entry, a recommended middle, a ceiling. More than four turns a decision into a chore.
> - **Recommend exactly one.** Mark a single plan as featured — the one most buyers should pick. A grid with no recommendation makes the reader do your job; a grid with two "best value" plans makes them trust none.
> - **Name the buyer, not the size.** "Solo," "Team," "Company" beats "Tier 1/2/3." A one-line `description` says who it's for.
> - **Price honestly.** Show the real number and period. If it's "Custom," say what triggers it (seats, volume) — never hide it behind a maze.
> - **Feature lists are differences, not totals.** List what each tier *adds* over the one below, phrased as outcomes. Don't repeat the same ten bullets three times; the eye can't compare walls of identical text.
> - **One CTA verb per tier**, matched to commitment: `Start free`, `Start trial`, `Talk to us`.
>
> **Design judgment.** Order tiers low→high so price climbs left to right (it stacks top→down on mobile — put the recommended tier first or clearly flagged so it survives the collapse). Keep feature lists close to equal length so the columns scan as a table, not a ransom note. Anchor with the highest tier's value, sell from the middle.
>
> **Guardrails.** Real fields only, all must validate; never invent prices — use the ones I give you. The page stays a draft. When done, summarize the tiers, the price of each, and which one you recommended, then tell me it's ready to review.
>
> Brief: «the plans with real prices and what each includes, who each is for, the recommended one».

## Example

**Brief:** "Pricing for KernelCMS Cloud. Free (self-host, $0), Team ($29/mo, recommended — managed hosting, backups, 3 seats), Scale ($99/mo — SSO, audit log, unlimited seats). Voice: plain, no pressure."

The agent reads `kernel://schema`, finds a `pricing` block (`heading`, `tiers[] = { name, price, period, description, features, cta_label, cta_href, featured }`), and writes:

```json
{
  "blockType": "pricing",
  "heading": "Self-host free. Upgrade when you'd rather not.",
  "tiers": [
    { "name": "Open source", "price": "$0", "period": "forever",
      "description": "Run it yourself on your own box.",
      "features": ["Full CMS, no feature gates", "REST + GraphQL + Local API", "Community support"],
      "cta_label": "Read the quickstart", "cta_href": "/docs/quickstart", "featured": false },
    { "name": "Team", "price": "$29", "period": "/mo",
      "description": "Managed hosting for a small team.",
      "features": ["Everything in Open source", "Hosted + daily backups", "3 seats, live preview"],
      "cta_label": "Start free trial", "cta_href": "/signup", "featured": true },
    { "name": "Scale", "price": "$99", "period": "/mo",
      "description": "For companies with compliance needs.",
      "features": ["Everything in Team", "SSO + audit log", "Unlimited seats"],
      "cta_label": "Talk to us", "cta_href": "/contact", "featured": false }
  ]
}
```

…written via `pages_update`, leaving the page a **draft**.

## Notes

- **Honesty converts.** Hidden prices, fake "most popular" stars on every plan, and "contact us for the cheap tier" all erode trust faster than a high number does.
- **Recommended tier survives mobile.** When columns stack, make sure the featured plan is visually first or unmistakably flagged — don't bury it in the middle of a vertical list.
- **Tools:** `kernel://schema` to discover the block and its `tiers` shape; `<collection>_update` / `_create` to write. See the [MCP guide](https://kernelcms.com/mcp).
- **Draft-only.** Agents can't publish — review and ship it yourself.
