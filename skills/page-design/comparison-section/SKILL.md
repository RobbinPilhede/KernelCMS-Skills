---
name: comparison-section
description: Compose an honest us-vs-them comparison table in KernelCMS — real differences, fair framing, no straw men — as a draft.
category: Page design
tags: [comparison, table, blocks, marketing]
difficulty: intermediate
---

# Design a comparison section

**Use this when** you want an agent to build a comparison block — the "us vs them" table that helps an evaluator decide. Done honestly it's persuasive; done with straw men it backfires the moment a reader knows the competitor. The agent composes the real comparison block from your schema and frames the differences fairly, leaving the page a draft.

## Prompt

> You are a senior product designer composing an honest comparison section in KernelCMS. You work through the access-controlled MCP tools and write **drafts** only.
>
> **First, learn the model.** Read `kernel://schema` to find the target collection's `blocks` field and the **exact comparison/table block** with its real fields — typically a `heading`, a set of `columns` (you vs one or two named alternatives), and `rows[] = { feature, values[] }` where each value is a check/cross/text cell. Use only fields the schema exposes. If no comparison block exists, pick the nearest (a feature table) and note it.
>
> **Then build a comparison an informed reader would call fair:**
> - **Pick dimensions that matter, not ones you happen to win.** Choose the 5–8 criteria a real buyer weighs — lock-in, hosting, type safety, pricing model, extensibility — even the ones where you're only tied. A table you sweep 8–0 reads as rigged.
> - **No straw men.** Describe the competitor as their own users would. If they do something well, the cell says so. Conceding a point you lose buys credibility for the points you win.
> - **Cells are specific, not just checkmarks.** "Any container" beats a green check; "Next.js only" beats a red X. Concrete text is honest *and* more convincing than a row of ticks.
> - **Frame rows as buyer outcomes.** "Run it on your own infra" not "Self-hostable (technical)." The left column is what the reader gets, not internal jargon.
> - **Order rows by what the buyer cares about most.** Lead with the dimension that's actually their deciding factor.
>
> **Design judgment.** Keep your column first or clearly marked, but don't visually rig every other column to look broken. A table scans best with short, parallel cell text and a consistent value type per row (all check/cross, or all short phrases). On mobile the table often becomes stacked cards per row — keep feature labels self-explanatory so they survive the collapse.
>
> **Guardrails.** Real fields only, all must validate. **Never misrepresent a competitor** — only state differences you're confident are true; if unsure about a competitor's capability, leave it out or mark it for me to verify rather than guessing. The page stays a draft. When done, list the rows and which column you marked as yours, and tell me it's ready to review.
>
> Brief: «the alternatives to compare against, the criteria that matter to buyers, what's genuinely different, brand voice».

## Example

**Brief:** "Comparison: KernelCMS vs Payload vs Strapi. Criteria devs care about: framework lock-in, config style, AI/agent access, default database. Be fair. Voice: matter-of-fact."

The agent reads `kernel://schema`, finds a `comparison` block (`heading`, `columns[]`, `rows[] = { feature, values[] }`), and writes:

```json
{
  "blockType": "comparison",
  "heading": "How it compares",
  "columns": ["KernelCMS", "Payload", "Strapi"],
  "rows": [
    { "feature": "Framework lock-in", "values": ["None — any container", "Tied to Next.js", "Standalone Node server"] },
    { "feature": "Content model", "values": ["One typed config file", "TypeScript config", "Config UI + code"] },
    { "feature": "Agent/AI access", "values": ["Native MCP, field-scoped, draft-only", "Community plugins", "Community plugins"] },
    { "feature": "Default database", "values": ["SQLite, zero native deps", "Postgres/Mongo", "SQLite/Postgres"] }
  ]
}
```

…written via `pages_update`, leaving the page a **draft**. Note the Payload/Strapi cells state real strengths, not straw men.

## Notes

- **Fairness is the strategy.** The fastest way to lose a technical buyer is one cell they know is wrong. Concede the ties; win on the differences that are real.
- **Specific cells > checkmarks.** "Next.js only" tells the reader more than a red X, and it's harder to dispute.
- **Verify, don't guess.** If you're unsure whether a competitor supports something, leave the cell out or flag it — don't fabricate a weakness.
- **Tools:** `kernel://schema` to discover the block and `rows` shape; `<pages>_update` / `_create` to write. See the [MCP guide](https://kernelcms.com/mcp).
- **Draft-only.** Review and publish yourself.
