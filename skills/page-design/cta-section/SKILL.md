---
name: cta-section
description: Compose a closing CTA block in KernelCMS — restate the promise, remove the last friction, ask for exactly one action — as a draft.
category: Page design
tags: [cta, conversion, blocks, marketing]
difficulty: starter
---

# Design a closing CTA section

**Use this when** you want an agent to write the last thing on the page — the closing call to action. After the reader has scrolled the whole story, this block restates the promise and asks for exactly one thing. The agent composes the real CTA block from your schema and leaves the page a draft.

## Prompt

> You are a senior product designer writing a closing CTA in KernelCMS. You work through the access-controlled MCP tools and write **drafts** only.
>
> **First, learn the model.** Read `kernel://schema` to find the target collection's `blocks` field and the **exact CTA block** with its real fields — typically a `heading`, optional `subhead`, and `label` + `href` (sometimes a secondary pair). Use only fields the schema exposes. If no CTA block exists, pick the nearest and note it.
>
> **Then write the close:**
> - **Restate the promise, don't repeat the hero.** The reader has earned new framing. Echo the core benefit in a fresh, more confident line now that the page has made its case. "Model your content in one file" lands harder at the bottom than at the top.
> - **One action.** A single primary button with a verb the reader can do right now (`Start free`, `Read the quickstart`). At most one quiet secondary link for the not-quite-ready (docs, a demo). Never two buttons of equal weight.
> - **Remove the last friction.** If a subhead is available, use it to answer the final hesitation in a few words — "No credit card," "Two minutes to first content," "Self-host or let us host it."
> - **Short.** A closing CTA is a headline, a half-sentence, and a button. Anything more is the reader scrolling past a wall, not clicking.
>
> **Design judgment.** This block usually sits in a contrasting band so it reads as the destination — keep the copy tight enough that it works as a single focal point, and make sure the button text clears 4.5:1 against that band. The CTA verb here should match the one in the hero, so the page's whole arc points at one action, not two competing ones.
>
> **Guardrails.** Real fields only, all must validate; the `href` must be a real path. The page stays a draft. When done, quote the closing headline and CTA back to me and tell me it's ready to review.
>
> Brief: «product, the one action, the core promise to restate, brand voice».

## Example

**Brief:** "Closing CTA for the KernelCMS landing page. One action: read the quickstart. Promise to restate: your whole content model in one typed file. Voice: calm, confident."

The agent reads `kernel://schema`, finds a `cta` block (`heading`, `subhead`, `label`, `href`), and writes:

```json
{
  "blockType": "cta",
  "heading": "Your whole content model in one file. Yours.",
  "subhead": "Two minutes to a typed API, an admin panel, and live preview. Self-host free.",
  "label": "Read the quickstart",
  "href": "/docs/quickstart"
}
```

…written via `pages_update`, leaving the page a **draft**.

## Notes

- **Match the hero's verb.** If the hero said "Read the quickstart," the closing CTA shouldn't suddenly say "Book a demo" — one page, one action.
- **The close is a focal point, not a paragraph.** When in doubt, cut a line.
- **Tools:** `kernel://schema` to discover the block; `<collection>_update` / `_create` to write. See the [MCP guide](https://kernelcms.com/mcp).
- **Pair with** `hero-section` (match the verb) and `conversion-audit` to confirm the page points at one action.
- **Draft-only.** Review and publish yourself.
