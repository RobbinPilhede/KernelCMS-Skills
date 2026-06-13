---
name: blog-post-layout
description: Compose a readable long-form article layout in KernelCMS — clear header, measured body, scannable structure — as a draft.
category: Page design
tags: [blog, article, long-form, blocks, readability]
difficulty: intermediate
---

# Design a blog post layout

**Use this when** you want an agent to lay out a long-form article: a clean header, a body that's a pleasure to read, and structural blocks (pull quotes, code, images) used sparingly to break up the page. The agent composes the real article blocks from your schema and writes for readability, leaving the post a draft.

## Prompt

> You are a senior editorial designer laying out a long-form article in KernelCMS. You work through the access-controlled MCP tools and write **drafts** only.
>
> **First, learn the model.** Read `kernel://schema` to find the article collection and its real fields — a `title`, `excerpt`/`deck`, `author`, `publishedAt`, a `richText` body or a `blocks` body, and structural blocks like `pull_quote`, `code`, `image`, `callout`, `heading`. Use only what the schema exposes. If the body is a single `richText` field, structure it with real headings and lists; if it's a `blocks` field, compose typed content blocks. Never invent a block or field.
>
> **Then lay it out for the reader's eye, not the author's ego:**
> - **A header that orients.** Title, a one-sentence deck that promises what the piece delivers, author, and date. That's the contract; honor it in the body.
> - **Measure and rhythm.** Long-form lives or dies on rhythm: short opening paragraphs, real subheadings every few hundred words so the page is scannable, and lists where the content is genuinely a list. A wall of text loses readers no matter how good the prose.
> - **Subheadings are signposts, not labels.** "Why the build step had to go," not "Section 2." A skimmer should be able to read only the subheads and get the gist.
> - **Use structural blocks sparingly and with intent.** A pull quote highlights the one line worth remembering — not every third sentence. A code block shows the thing being discussed. An image earns its place by clarifying, not decorating. One device overused is worse than none.
> - **Open strong, close clean.** First paragraph states the stakes in plain language. Last paragraph lands the point or the next step — no "in conclusion."
>
> **Design judgment.** Body text wants a comfortable measure (the renderer handles width — don't fight it). Keep paragraphs short on screen; break dense ideas into two. Code blocks need a language tag if the schema supports it. Describe image intent in words; don't fabricate URLs.
>
> **Guardrails.** Real fields and blocks only, all must validate. Don't invent facts to fill the piece — write from the brief and flag anything you'd need confirmed. The post stays a draft. When done, give me the title, the deck, and the subheading outline, and tell me it's ready to review.
>
> Brief: «the article's topic, key points and any code/quotes, the audience and voice».

## Example

**Brief:** "Article: 'Why KernelCMS has no build step.' Audience: TS devs. Key points: Node strips types directly, erasable-TS constraints, the trade-off. One code block, one pull quote. Voice: clear, opinionated."

The agent reads `kernel://schema`, finds an `articles` collection with header fields plus a `body` blocks field exposing `paragraph`, `heading`, `code`, `pull_quote`. It writes:

```json
{
  "title": "Why KernelCMS has no build step",
  "deck": "Your config is TypeScript, and Node runs it as-is. Here's what that buys you, and what it costs.",
  "body": [
    { "blockType": "paragraph", "text": "Most TypeScript backends compile before they run. KernelCMS doesn't — Node imports your kernel.config.ts and erases the types in place. The payoff is immediate: edit the file, refresh, and the admin and APIs move with it." },
    { "blockType": "heading", "level": 2, "text": "The one rule: stay erasable" },
    { "blockType": "paragraph", "text": "Type-stripping can't run code, so the config must use only erasable TypeScript — no enums, no namespaces with runtime members, no constructor parameter properties." },
    { "blockType": "code", "language": "ts", "text": "// not allowed in config:\nenum Status { Draft, Live }\n// use instead:\nconst Status = { Draft: 'draft', Live: 'live' } as const" },
    { "blockType": "pull_quote", "text": "No build step means the file you read in review is the file that runs in production." },
    { "blockType": "heading", "level": 2, "text": "The trade-off" },
    { "blockType": "paragraph", "text": "You give up a few TypeScript features and gain a dependency-free runtime and an instant edit loop. For a content model — config, not hot-path logic — that's a trade worth making." }
  ]
}
```

…written via `articles_update` (or `_create`), leaving the post a **draft**.

## Notes

- **Readability is a structure problem, not a word problem.** Subheads, short paragraphs, and the occasional list do more for comprehension than any sentence-level polish.
- **One device, used once well.** A single pull quote on the best line beats five competing for attention.
- **richText vs blocks body.** If the body is one `richText` field, structure it with real headings/lists inside that field; if it's a `blocks` field, compose typed content blocks as above. Check the schema first.
- **Tools:** `kernel://schema` for the model; `<collection>_update` / `_create` to write. See the [MCP guide](https://kernelcms.com/mcp).
- **Pair with** `readability-pass` for rhythm and measure, `seo-optimize-page` / `metadata-and-open-graph` for the title, deck, and share card, and `blog-index-page` to surface it.
- **Draft-only.** Review and publish yourself.
