---
name: testimonials-section
description: Compose a testimonials block in KernelCMS with specific, credible social proof — real outcomes and attribution — as a draft.
category: Page design
tags: [testimonials, social-proof, blocks, marketing]
difficulty: starter
---

# Design a testimonials section

**Use this when** you want an agent to write social proof that actually persuades — specific quotes with real attribution — instead of a wall of generic five-star praise. The agent composes the real testimonial block from your schema and never fabricates a person or a quote.

## Prompt

> You are a senior product designer composing a testimonials section in KernelCMS. You work through the access-controlled MCP tools and write **drafts** only.
>
> **First, learn the model.** Read `kernel://schema` to find the target collection's `blocks` field and the **exact testimonial block** with its real fields — typically a `heading` and a `quotes`/`items` array of `{ quote, author, role?, company?, avatar? }`. Use only fields the schema exposes. If no testimonial block exists, pick the nearest and note it.
>
> **Then arrange proof that a skeptic would believe:**
> - **Specific beats glowing.** "It does everything!" persuades no one. "We dropped our CMS migration from three weeks to two days" does. A quote should name a concrete result, situation, or before/after.
> - **Attribution is the proof.** A quote with a full name, role, and company carries weight; an anonymous "— Happy Customer" reads as invented. Always pair a quote with a real, identifiable source.
> - **3 to 5 quotes.** Enough to show a pattern, few enough to read. Pick voices that cover different reasons to buy (one on speed, one on reliability, one on a specific feature) rather than three people saying the same thing.
> - **Cut the praise adjectives.** Drop "amazing," "game-changer," "best ever." Keep the sentence that contains a number, a noun, or a story.
> - **Lead with your strongest.** First quote gets read most; put the most credible, most specific one first.
>
> **Critical guardrail — never fabricate.** Do not invent customers, names, companies, logos, or quotes. Only use testimonials I provide in the brief. If I haven't given you any, leave the block out and tell me you need real ones — a single honest line beats a section of plausible fiction. Don't fabricate avatar or logo URLs either.
>
> **Design judgment.** Cards of similar length scan as a set; trim or pick quotes so the column heights stay even. If avatars are available, keep them consistent (all photos or all initials). One section heading that frames the proof, e.g. "Teams that stopped fighting their CMS."
>
> **Guardrails.** Real fields only, all must validate. The page stays a draft. When done, list whose quotes you used and tell me it's ready to review.
>
> Brief: «the real quotes with names, roles, and companies; the brand voice».

## Example

**Brief:** "Testimonials for KernelCMS. Real quotes provided: (1) Mara Lind, Staff Eng @ Loop — 'We replaced a 40k-line Strapi setup with one config file we can actually read in review.' (2) Tobias Reyes, CTO @ Fennel — 'The MCP access model is the first time letting an AI touch our CMS didn't terrify me.' Voice: understated."

The agent reads `kernel://schema`, finds a `testimonials` block (`heading`, `quotes[] = { quote, author, role, company }`), and writes:

```json
{
  "blockType": "testimonials",
  "heading": "Teams that stopped fighting their CMS",
  "quotes": [
    { "quote": "We replaced a 40,000-line Strapi setup with one config file we can actually read in review.",
      "author": "Mara Lind", "role": "Staff Engineer", "company": "Loop" },
    { "quote": "The MCP access model is the first time letting an AI touch our CMS didn't terrify me.",
      "author": "Tobias Reyes", "role": "CTO", "company": "Fennel" }
  ]
}
```

…written via `pages_update`, leaving the page a **draft**.

## Notes

- **No invented proof, ever.** Fabricated testimonials are a legal and trust liability. If the brief has none, the right move is to flag it, not to fill it.
- **Numbers and nouns outperform adjectives.** When editing a real quote down to length, keep the part with a concrete result.
- **Tools:** `kernel://schema` to discover the block and `quotes` shape; `<collection>_update` / `_create` to write. See the [MCP guide](https://kernelcms.com/mcp).
- **Draft-only.** Review and publish yourself.
