---
name: generate-a-content-calendar
description: Drive an agent to plan a content calendar and draft each entry in KernelCMS — scheduled by a human at publish time, never by the agent.
category: Agent workflows
tags: [calendar, planning, drafts, editorial, scheduling]
difficulty: intermediate
---

# Generate a content calendar

**Use this when** you want an agent to plan an editorial calendar — themes, cadence, titles, angles across the next N weeks — and seed each slot as a draft. The agent does the planning and drafting; a human schedules the publishes (agents can't publish or schedule). The result is a populated pipeline you can refine and release on your own dates.

## Prompt

> You are planning a content calendar in KernelCMS through the access-controlled MCP tools. You create **drafts** only — you cannot publish or schedule a publish, and you can only write fields inside your `fieldScope`.
>
> **1. Learn the model.** Read `kernel://schema` for the target collection. Note the title/slug fields, the body field, and any field you might use to record the *intended* date (e.g. a plain `planned_for` date field) — **only if it's in your scope**. There is no agent-settable publish schedule; record intended dates as ordinary draft data for a human to act on.
>
> **2. Check what exists.** Call `<collection>_list` / `_count` to see what's already planned or published, so the calendar fills gaps instead of duplicating.
>
> **3. Plan the calendar.** Lay out the slots: for each, give a date/cadence slot, a theme, a working title, the angle, and the target audience. Balance the mix (don't stack five how-tos in a row); align to any campaigns or seasonality in the brief. Present the plan as a table first.
>
> **4. Draft each slot.** For each entry, call `<collection>_create` with a real title, slug, a short outline or full draft body per the brief, and the intended date in a scoped date field if one exists. Keep a manifest of id → slot.
>
> **5. Report the schedule plan.** Output the calendar table mapped to draft ids, and tell the human: review the drafts (filter to `createdByType: agent`), then **schedule the publishes** in the admin on the intended dates — that step is theirs.
>
> Calendar spec: «collection, date range + cadence, themes/campaigns, audience, voice».

## Example

**Spec:** "An 8-week calendar for the blog, two posts a week, themed around the 0.5 launch then evergreen how-tos. Voice: practical."

The agent reads `kernel://schema`, finds `posts` with a scoped `planned_for` date field, checks `posts_count`, then plans:

```
Week 1  Mon  Launch    "Field scoping, now per-agent"
Week 1  Thu  Launch    "What 'draft-only' actually buys you"
Week 2  Mon  How-to    "Scope an agent in five minutes"
…
```

It drafts each via `posts_create`:

```json
{ "title": "Field scoping, now per-agent", "slug": "field-scoping-per-agent",
  "planned_for": "2026-06-15", "body": "Outline: …" }
```

All 16 land as **drafts**. Report: the calendar table mapped to ids, plus *"Review the agent drafts, then schedule each publish on its `planned_for` date in the admin."*

## Notes

- **Agents can't schedule.** A scheduled publish (`publishAt`) is a publish — rejected for an agent principal. Record intended dates as ordinary draft fields; a human sets the actual schedule when they publish. This skill plans and drafts; it does not — and cannot — auto-release.
- **Use a real, scoped date field** for `planned_for` (or similar). If your model has none, keep the dates in the report and add the field to the collection + the agent's scope if you want them stored.
- **Fill gaps, don't duplicate.** `*_list` / `*_count` first so the calendar extends what exists.
- **Draft-only.** Every slot is reviewable before it's anywhere near live.
- **Tools:** `kernel://schema` (discovery), `<collection>_list` / `_count` (gap-check), `<collection>_create` (each draft).
- Pairs with **`bulk-draft-content`** (to flesh out the drafts) and **`review-agent-drafts`** (to schedule + publish).
