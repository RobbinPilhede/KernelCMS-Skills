<h1 align="center">KernelCMS Skills</h1>

<p align="center"><strong>A knowledge base of agent skills & prompts for building beautiful, production-grade products on <a href="https://kernelcms.com">KernelCMS</a>.</strong></p>

<p align="center">
  <a href="https://kernelcms.com/prompts">Browse the library</a> ·
  <a href="https://kernelcms.com/mcp">MCP server</a> ·
  <a href="https://github.com/RobbinPilhede/KernelCMS">KernelCMS</a>
</p>

---

KernelCMS lets you hand an AI agent your CMS through the [Model Context Protocol](https://kernelcms.com/mcp) — as a scoped, draft-only, access-controlled principal. **KernelCMS Skills** is the library that makes those agents *good at it*: curated, copy-pasteable prompts and drop-in [Claude Agent Skills](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview) that teach an agent how to model content, compose pages from your blocks, write on-brand copy, and ship beautiful, accessible, SEO-clean pages — within your typed guardrails.

Every skill is plain Markdown with YAML frontmatter, so it works three ways:

1. **As a prompt** — copy the prompt block straight into Claude Desktop, Cursor, or any chat, alongside a KernelCMS MCP connection.
2. **As a Claude Agent Skill** — drop the folder into `.claude/skills/` (or your project's skills dir) and the agent loads it on demand.
3. **As a reference** — read it yourself to learn the KernelCMS-native way to do the thing.

## Quickstart

```bash
git clone https://github.com/RobbinPilhede/KernelCMS-Skills.git
# Use a skill as a Claude Agent Skill:
cp -r KernelCMS-Skills/skills/page-design/design-landing-page ~/.claude/skills/
# …or just open any SKILL.md and copy the Prompt block.
```

Point your agent at a KernelCMS MCP server (`npx kernel mcp`, see the [MCP guide](https://kernelcms.com/mcp)), give it a skill, and describe what you want. The agent works through the access-controlled tools — it composes drafts, never publishes.

## What's inside

| Category | What it helps an agent do |
| --- | --- |
| **Page design** | Compose complete pages and sections from your blocks page-builder — hero, features, pricing, FAQ, testimonials, CTAs, bento grids — beautiful and on-brand. |
| **Content modeling** | Design typed content models from a brief: blogs, docs sites, stores, portfolios, plus SEO fields and localization. |
| **Agent workflows** | Connect and scope an agent, compose a page from a brief, bulk-draft content, review an agent's drafts, migrate from another CMS. |
| **Quality** | SEO, accessibility, performance, copy voice, and design-token discipline passes over what the agent built. |

Browse the full, always-current catalog at **[kernelcms.com/prompts](https://kernelcms.com/prompts)**, or explore [`skills/`](./skills).

## How a skill is structured

```markdown
---
name: design-landing-page
description: One-line summary used for discovery and as the Claude Skill description.
category: Page design
tags: [landing, blocks, marketing]
difficulty: intermediate
---

# Human-readable title

**Use this when** … a one-paragraph framing.

## Prompt
> The actual, ready-to-use prompt for the agent. Self-contained and specific.

## Example
A worked example — input brief, and what the agent produces.

## Notes
Caveats, the KernelCMS APIs/tools involved, and how the guardrails keep you safe.
```

## Safety

These skills drive agents that operate through KernelCMS's access pipeline. An agent is **field-scoped** and **draft-only** by design — it composes and edits drafts, but a human publishes. Nothing here can change that; the guarantees live in `@kernel/core`, not in a prompt. See the [MCP guide](https://kernelcms.com/mcp) and [Safety](https://kernelcms.com/safety).

## Contributing

Add a skill, a whole category, or improve an existing one — see [CONTRIBUTING.md](./CONTRIBUTING.md). The catalog and the website library are generated from skill frontmatter, so a good PR is just a new `SKILL.md`.

## License

MIT.
