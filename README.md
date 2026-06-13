<div align="center">

# 🧠 KernelCMS Skills

### A knowledge base of agent skills & prompts for building beautiful, production-grade products on [KernelCMS](https://kernelcms.com).

<p>
  <a href="https://kernelcms.com/prompts"><img alt="Browse the library" src="https://img.shields.io/badge/browse-the%20library-111?style=for-the-badge" /></a>
  <a href="https://kernelcms.com/mcp"><img alt="MCP" src="https://img.shields.io/badge/MCP-agent--native-111?style=for-the-badge" /></a>
  <a href="./LICENSE"><img alt="MIT" src="https://img.shields.io/badge/license-MIT-111?style=for-the-badge" /></a>
</p>

<p>
  <img alt="49 skills" src="https://img.shields.io/badge/skills-49-2563eb" />
  <img alt="5 categories" src="https://img.shields.io/badge/categories-5-2563eb" />
  <img alt="orchestrator" src="https://img.shields.io/badge/%2Fkernel-orchestrator-059669" />
  <img alt="zero deps" src="https://img.shields.io/badge/dependencies-0-059669" />
</p>

<strong><a href="#-start-here-the-orchestrator">Start here</a></strong> ·
<a href="#-the-library">The library</a> ·
<a href="#-three-ways-to-use-a-skill">How to use</a> ·
<a href="#-anatomy-of-a-skill">Anatomy</a> ·
<a href="https://github.com/RobbinPilhede/KernelCMS">KernelCMS</a>

</div>

---

KernelCMS lets you hand an AI agent your CMS over the [Model Context Protocol](https://kernelcms.com/mcp) — as a **scoped, draft-only, access-controlled principal**. This is the library that makes those agents *good at it*: copy-pasteable prompts and drop-in [Claude Agent Skills](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview) that teach an agent how to model content, compose pages from your blocks, write on-brand copy, and ship beautiful, accessible, SEO-clean pages — all **within your typed guardrails**.

> Every skill is plain Markdown with YAML frontmatter, grounded in the real KernelCMS API. No fluff, no invented fields — the kind of prompt a senior engineer or designer would actually keep.

<br />

## ⚡ Start here: the orchestrator

Don't want to pick a skill by hand? **Just describe the goal.** The [`/kernel`](./skills/orchestrator/kernel/SKILL.md) orchestrator reads your content model, classifies the work, picks and **sequences** the right skills, and runs them — as drafts.

```text
/kernel build a launch landing page for our 0.5 release
```

<div align="center">

```
        your goal
            │
      ┌─────▼─────┐   reads kernel://schema, classifies the work
      │  /kernel  │   ───────────────────────────────────────────►
      └─────┬─────┘
            │  picks + sequences the right skills
   ┌────────┼─────────────┬───────────────┐
   ▼        ▼             ▼               ▼
 model  →  compose   →   polish    →    review
(schema) (blocks)      (seo / a11y)   (human publishes)
```

</div>

It plans the smallest chain that serves the goal, carries context between steps, and stays a draft until a human publishes. It's a **planner, not a new permission** — it runs the same skills, through the same access-controlled tools, as the same scoped agent.

<br />

## 📚 The library

**49 skills across 5 categories.** Browse the always-current catalog at **[kernelcms.com/prompts](https://kernelcms.com/prompts)**, or dive into [`skills/`](./skills).

| Category | Count | What it teaches an agent | Highlights |
| :-- | :--: | :-- | :-- |
| **🧭 [Orchestrator](./skills/orchestrator)** | 1 | Route any goal to the right skills, in order | [`kernel`](./skills/orchestrator/kernel/SKILL.md) |
| **🎨 [Page design](./skills/page-design)** | 16 | Compose beautiful pages & sections from your blocks page-builder | [`design-landing-page`](./skills/page-design/design-landing-page/SKILL.md) · [`hero-section`](./skills/page-design/hero-section/SKILL.md) · [`pricing-section`](./skills/page-design/pricing-section/SKILL.md) · [`bento-grid`](./skills/page-design/bento-grid/SKILL.md) |
| **🗂️ [Content modeling](./skills/content-modeling)** | 12 | Design typed content models from a brief — collections, fields, blocks | [`schema-from-brief`](./skills/content-modeling/schema-from-brief/SKILL.md) · [`model-a-blog`](./skills/content-modeling/model-a-blog/SKILL.md) · [`design-a-block-library`](./skills/content-modeling/design-a-block-library/SKILL.md) |
| **🤖 [Agent workflows](./skills/agent-workflows)** | 10 | Connect, scope, and drive agents over MCP | [`connect-an-agent`](./skills/agent-workflows/connect-an-agent/SKILL.md) · [`bulk-draft-content`](./skills/agent-workflows/bulk-draft-content/SKILL.md) · [`migrate-content-from-another-cms`](./skills/agent-workflows/migrate-content-from-another-cms/SKILL.md) |
| **✨ [Quality](./skills/quality)** | 10 | SEO, accessibility, performance, copy, design-system passes | [`seo-optimize-page`](./skills/quality/seo-optimize-page/SKILL.md) · [`accessibility-pass`](./skills/quality/accessibility-pass/SKILL.md) · [`conversion-audit`](./skills/quality/conversion-audit/SKILL.md) |

<br />

## 🚀 Three ways to use a skill

Every `SKILL.md` works three ways — pick whatever fits your tool:

<table>
<tr>
<td width="33%" valign="top">

### 1. As a prompt
Copy the **Prompt** block straight into Claude Desktop, Cursor, or any chat — alongside a [KernelCMS MCP](https://kernelcms.com/mcp) connection.

</td>
<td width="33%" valign="top">

### 2. As a Claude Skill
Drop the folder into `.claude/skills/` and the agent loads it on demand.

```bash
cp -r skills/page-design/\
design-landing-page \
  ~/.claude/skills/
```

</td>
<td width="33%" valign="top">

### 3. As a reference
Read it yourself to learn the KernelCMS-native way to do the thing — accurate, opinionated, current.

</td>
</tr>
</table>

### Quickstart

```bash
git clone https://github.com/RobbinPilhede/KernelCMS-Skills.git
cd KernelCMS-Skills

# Point an agent at your CMS (see the MCP guide):
npx kernel mcp --agent content-bot

# Then give the agent a goal and a skill — it composes drafts, never publishes.
```

<br />

## 🧱 Anatomy of a skill

```markdown
---
name: design-landing-page
description: One-line summary — used for discovery and as the Claude Skill description.
category: Page design
tags: [landing, blocks, marketing]
difficulty: starter | intermediate | advanced
---

# Human-readable title

**Use this when** … a one-paragraph framing.

## Prompt
> The actual, ready-to-use prompt. Self-contained, specific, KernelCMS-native.

## Example
A worked example — a real brief in, and what the agent produces.

## Notes
Caveats, the KernelCMS tools/APIs involved, and the guardrails that keep you safe.
```

The [`catalog.json`](./catalog.json) index and the [website library](https://kernelcms.com/prompts) are **generated** from this frontmatter — run [`node scripts/build-catalog.mjs`](./scripts/build-catalog.mjs) after adding a skill.

<br />

## 🛡️ Safety

These skills drive agents that operate through KernelCMS's access pipeline. An agent is **field-scoped** and **draft-only** by design — it composes and edits drafts, but a human publishes. Nothing in a prompt can change that; the guarantees live in `@kernel/core`, not in the words. See the [MCP guide](https://kernelcms.com/mcp) and [Safety](https://kernelcms.com/safety).

<br />

## 🤝 Contributing

Add a skill, a whole category, or sharpen an existing one — a great PR is just a new `SKILL.md`. See **[CONTRIBUTING.md](./CONTRIBUTING.md)**.

<div align="center">
<br />
<sub>Built for <a href="https://kernelcms.com">KernelCMS</a> · MIT licensed · <a href="https://kernelcms.com/prompts">kernelcms.com/prompts</a></sub>
</div>
