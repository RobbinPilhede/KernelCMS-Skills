---
name: build-an-autonomous-workflow
description: Define a KernelCMS agentic workflow — an autonomous content pipeline (trigger → draft → quality gate → human review) where every step runs as a scoped, draft-only agent and nothing can go live unchecked.
category: Agent workflows
tags: [workflows, agentic, automation, pipeline, eval-gate, review]
difficulty: advanced
---

# Build an autonomous workflow

**Use this when** you want an AI agent to take a content job end-to-end — draft from a brief, fill gaps, translate, summarize — *automatically* on a trigger, but with hard guardrails so a human (or a passing quality check) is the only thing that lets content go live. This is the "agentic CMS": real autonomy, zero blast radius.

This is a configuration runbook: you define the workflow in `kernel.config.ts`; the engine runs it as a scoped agent.

## Prompt

This skill is operational — follow the runbook.

### 1. Have a scoped agent

A workflow runs its steps **as** one of your configured agents — so it inherits that agent's `fieldScope` and the hard draft-only brake. (See the *connect-an-agent* skill.)

```ts
agents: [
  { id: 'editor-bot', token: process.env.EDITOR_BOT_TOKEN!, roles: ['editor'], fieldScope: { allow: ['title', 'summary', 'body'] } },
]
```

### 2. Define the workflow

```ts
// Steps share state through a closure variable (they're defined together).
let draftId = ''

workflows: [
  {
    slug: 'draft_from_brief',          // snake_case
    agent: 'editor-bot',                // steps run as this scoped, draft-only principal
    trigger: { on: 'create', collection: 'briefs' },  // or { on: 'manual' }
    steps: [
      {
        name: 'draft',
        async run(ctx) {
          const brief = ctx.input as { topic: string }
          // ctx.kernel is pinned to editor-bot — it CANNOT publish or override access.
          const post = await ctx.kernel.create({
            collection: 'articles',
            data: { title: brief.topic, body: /* your LLM call here */ '' },
          })
          ctx.log(`drafted ${post.id}`)
          draftId = post.id
        },
      },
      {
        name: 'quality-gate',
        async run(ctx) {
          // Runs your configured `evals` (brand/policy/SEO/a11y). Throws → run fails,
          // content stays a draft. This is content CI for autonomous output.
          await ctx.evalGate({ collection: 'articles', id: draftId })
        },
      },
      {
        name: 'to-human',
        async run(ctx) {
          // Submits to the review inbox and pauses the run as `awaiting_review`.
          // It goes live ONLY when an editor approves.
          await ctx.requestReview({ collection: 'articles', id: draftId }, 'Drafted from a brief — please review.')
        },
      },
    ],
  },
]
```

### 3. The actual AI lives inside a step

KernelCMS provides the orchestration + guardrails; the generation is yours. Inside `run(ctx)` call your LLM (or compose blocks via `ctx.kernel.composePage(...)`), then write the result with `ctx.kernel.create/update`. Everything you write is a draft, field-scoped, and attributed to the agent.

### 4. Run it

- **Triggered** (`on: 'create'|'update'`): a matching write enqueues a **durable** run on the jobs queue. Drain it with a cron: `npx kernel jobs:run` (or `kernel.runDueJobs()`). The content write never blocks on a slow agent step.
- **Manual:** `await kernel.runWorkflow({ slug: 'draft_from_brief', input })`, or `POST /api/_admin/workflows/draft_from_brief/run` (admin/editor only).
- Inspect runs: `kernel.workflowRuns({ slug, status })` or `GET /api/_admin/workflow-runs`. States: `pending → running → completed | failed | awaiting_review`.

### 5. Trust the guardrails

Every step runs as the scoped agent: it **cannot publish** (draft-only brake), **cannot write outside `fieldScope`**, and **cannot pass `overrideAccess`** or a forged principal — the engine pins the agent on every call. Content advances only through `evalGate` (a passing quality check) and `requestReview` → a human approving in the inbox. A self-triggering loop (an agent writing into its own trigger collection) is automatically suppressed. So you can let it run unattended.

Provide: «the trigger (collection + create/update, or manual), what each step should do, which agent/scope it runs as, and your quality-gate evals».
