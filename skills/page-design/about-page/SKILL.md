---
name: about-page
description: Compose a credible, human about/story page in KernelCMS — why it exists, who's behind it, what it stands for — as a draft.
category: Page design
tags: [about, story, blocks, copy]
difficulty: intermediate
---

# Design an about page

**Use this when** you want an agent to write the about page — the one place a company gets to sound like people instead of a product. A good about page builds trust through specifics: why the thing exists, who's behind it, what it refuses to do. The agent composes the real blocks from your schema and writes like a human, leaving the page a draft.

## Prompt

> You are a senior writer composing an about page in KernelCMS. You work through the access-controlled MCP tools and write **drafts** only.
>
> **First, learn the model.** Read `kernel://schema` to find the page collection's `blocks` field and the available blocks — likely some mix of `prose`/`rich_text`, `heading`, `stat_band`, `team`, `timeline`, `quote`, `image`, `cta`. Use only blocks and fields the schema exposes. If there's no dedicated "team" or "timeline" block, build the story from prose and what exists, and note the gap.
>
> **Then tell the story like a person would, not a press release:**
> - **Open with why it exists.** Not "Founded in 2024." Start with the problem that made this worth building — the specific frustration, the thing that was broken. A real origin earns more trust than a mission statement.
> - **Be concrete, be human.** Name the moment, the decision, the trade-off. "We were maintaining 40k lines of CMS config no one could read in review" beats "We believe in developer experience." Specifics are credibility.
> - **Say what you stand for by saying what you won't do.** Values are cheap; constraints are real. "We keep heavy dependencies out of core" or "agents are draft-only, always" tells the reader who you are better than "we value quality."
> - **Show the people, if you have them.** Real names, real roles, plain bios. A team block with actual humans signals a real company. Never invent people, photos, or bios — only use what's in the brief.
> - **Close with an invitation, not a sale.** The about page's CTA is softer than a landing page's — "Read the docs," "Join the community," "See how it works." You're earning a relationship, not closing a deal.
>
> **Design judgment.** An about page reads top-to-bottom like a short essay — give it a narrative arc (problem → decision → what we built → who we are → where it's going), generous whitespace, and one or two structural beats (a stat band, a pull quote, a team grid) to break the prose. Don't fabricate image URLs; describe an asset's intent in words.
>
> **Guardrails.** Real blocks and fields only; never invent people, numbers, dates, or facts — write from the brief and flag anything you'd need confirmed. The page stays a draft. When done, give me the section outline and the opening line, and tell me it's ready to review.
>
> Brief: «why the thing exists, the real origin story, the team (real names/roles), what you stand for, brand voice».

## Example

**Brief:** "About page for KernelCMS. Origin: built by devs tired of CMSes that own the framework and bury config in a UI. Stands for: config-as-code, no lock-in, lean core. Team: Sven Akerlund (founder, ex-platform eng), Elin Vass (DX). Voice: plain, a little dry."

The agent reads `kernel://schema`, finds a `pages` collection whose `layout` blocks include `prose`, `heading`, `quote`, `team`, and `cta`. It writes:

```json
{
  "layout": [
    { "blockType": "prose", "text": "We built KernelCMS because every CMS we'd shipped on eventually started running the project instead of serving it — owning the framework, hiding the content model in a UI, and turning a code review into a guessing game." },
    { "blockType": "heading", "level": 2, "text": "One file you can actually read" },
    { "blockType": "prose", "text": "So we made the rule simple: your whole content model is one typed config file, reviewable in a pull request. Heavy dependencies stay out of core. And when an AI touches your content, it's a scoped, draft-only principal — never a back door." },
    { "blockType": "quote", "text": "If you can't read it in review, it shouldn't be running your site." },
    { "blockType": "team", "heading": "Who's building it",
      "members": [
        { "name": "Sven Akerlund", "role": "Founder", "bio": "Spent a decade on platform teams watching content tooling drift away from the codebase." },
        { "name": "Elin Vass", "role": "Developer experience", "bio": "Cares more about the edit-refresh loop than any feature list." }
      ] },
    { "blockType": "cta", "heading": "See how it fits together", "label": "Read the docs", "href": "/docs" }
  ]
}
```

…written via `pages_update`, leaving the page a **draft**.

## Notes

- **Constraints beat values.** "Here's what we refuse to do" is more credible than any adjective-filled mission statement.
- **Never invent people.** Team bios, names, and photos must come from the brief — fabricated humans are a trust and legal problem.
- **Tools:** `kernel://schema` to discover blocks; `<pages>_update` / `_create` to write. See the [MCP guide](https://kernelcms.com/mcp).
- **Draft-only.** Review and publish yourself.
