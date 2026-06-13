---
name: review-agent-drafts
description: Review what an agent created in KernelCMS using `*_versions` filtered to `createdByType: agent` plus the live preview, then publish the keepers as a human.
category: Agent workflows
tags: [review, versions, audit, publish, governance]
difficulty: intermediate
---

# Review agent drafts

**Use this when** an agent has drafted content and you need to decide what to publish. KernelCMS attributes every version to the principal that wrote it, so you can isolate *exactly* what the agent authored, read it in the live preview, and publish the good ones yourself. The agent can't publish — this skill is the human (or human-supervised) gate on the other side of the leash.

It works two ways: an agent can *gather and summarize* the review material for you (read-only), but **only a human user publishes** — the publish step is not available to an agent principal.

## Prompt

> You are auditing agent-authored drafts in KernelCMS so a human can decide what to publish. You are **read-only** for this task: gather, summarize, and recommend — do not publish (you can't anyway), and flag anything you'd reject.
>
> **1. Find the agent's work.** If you don't have ids, enumerate the batch first with `<collection>_list` (filter with `where` on draft status / a date range). Then, for each candidate, call `<collection>_versions` with `{ id, createdByType: 'agent' }` to list only the snapshots an agent authored — that filter is the audit's backbone, so attribution is unambiguous. (`<collection>_versions` exists only for collections that keep a version history.)
>
> **2. Read each draft.** Call `<collection>_get` (it reads the latest draft) to see the current content. Compare against the version history if you need to see what the agent changed and when.
>
> **3. Judge it.** For each draft, check: required fields present and sensible; copy is accurate and on-voice; no hallucinated facts, broken links, or placeholder text; nothing outside the brief. Note any field the agent *couldn't* set (outside its scope) that a human still needs to fill — e.g. `author`, `seo`, a hero image.
>
> **4. Report a publish plan.** Output a table: id, title, verdict (publish / fix / reject), and the one thing each needs. Tell the human which to open in the admin live preview, and which fields they must complete before publishing. Make clear the publish action is theirs.
>
> Scope: «collection, and the batch (by date, by ids, or "everything the agent drafted")».

### The human publish step (not an agent action)

After review, the human opens each keeper in the admin, completes any out-of-scope fields (author, SEO, media), checks it in **live preview**, and publishes from there. Publishing is gated by the collection's `access.publish` rule — which, when omitted, falls back to the `update` rule, so set it explicitly if you want to forbid a role from publishing. Either way it is never satisfied by an agent principal, so this transition is always a deliberate human decision (or a human-role caller you trust). If a draft must be reverted, restore an earlier snapshot from the version history in the admin.

## Example

A bot drafted 16 launch posts. You ask the agent to audit them. It calls `posts_list` to get the draft ids, then for each calls `posts_versions` with `createdByType: 'agent'` and `posts_get`, and reports:

```
id            title                              verdict   needs
post_a1  Migrating from Contentful…          publish   add author + hero image
post_a2  Why we don't lock you to a framework publish   ready
post_a3  The 0.5 release, explained          fix       broken link in para 3
post_a4  10x your content velocity (!!)      reject    off-voice hype, rewrite brief
```

You open `post_a1` and `post_a2` in the admin, fill the author and image (fields outside the agent's scope), preview, and publish. `post_a3` you fix and publish; `post_a4` you delete or re-brief.

## Notes

- **`createdByType: 'agent'`** on `<collection>_versions` is the key filter — it isolates agent-authored snapshots from human edits, so attribution is unambiguous in the audit.
- **`*_get` reads the latest draft**, so you review current content, not the last published version.
- **Publishing is a human action.** `access.publish` gates the draft→published transition; agents are rejected. The reviewer (a user) makes the call in the admin, where live preview shows the rendered result.
- **Mind the scope gap.** Fields outside the agent's `fieldScope` will be empty — that's by design. Your review checklist must include "what did the agent *not* get to set."
- **Tools:** `<collection>_list` (enumerate), `<collection>_versions` (attributed history), `<collection>_get` (current draft). All read-only.
- Pairs with **`bulk-draft-content`** and **`compose-page-from-brief`** as the gate at the end of those flows.
