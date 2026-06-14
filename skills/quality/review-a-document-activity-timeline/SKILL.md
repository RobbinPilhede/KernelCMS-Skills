---
name: review-a-document-activity-timeline
description: Show editors one merged, access-checked activity feed per document in KernelCMS — versions, comments, review decisions, and audit entries in a single newest-first timeline — instead of stitching four separate sources together in the UI.
category: Quality
tags: [activity, audit, history, comments, timeline]
difficulty: starter
---

# Review a document's activity timeline

**Use this when** an editor opens a document and asks "what happened here?" — who changed it,
when, what they said in review, what the agent did. Instead of opening four panels (version
history, comments, the review log, the audit trail), `kernel.documentActivity` returns one
time-ordered feed, already gated so each viewer sees exactly what they're allowed to.

This is an operational read — no setup beyond having the source features on.

## Prompt

This skill is operational — follow the runbook.

### 1. Read the timeline

```ts
const { events, includesReviewerEvents } = await kernel.documentActivity({
  collection: 'articles',
  id: article.id,
  req, // the timeline is gated on THIS caller's read access to the document
})
```

Each event is `{ type, at, actor: { id, type }, action, data }`, newest-first:

| type | comes from | `action` | key `data` | who sees it |
| ---- | ---------- | -------- | ---------- | ----------- |
| `version` | version snapshots | the status (or `autosave`) | `versionId`, `changedFields`, `status` | any reader |
| `comment` | editorial comments | `comment` | `body`, `field`, `resolved`, `parentId` | any reader |
| `review` | agent-draft reviews | the decision | `note` | reviewers only |
| `audit` | the audit log | the audit action | `fields`, `meta` | reviewers only |

Over REST: `GET /api/:collection/:id/activity?types=&limit=` — `types` is a comma list
(`version,comment`) to filter, `limit` caps the feed (default 100, max 500).

```bash
curl "http://localhost:3000/api/articles/$ID/activity" -H "Authorization: Bearer $TOKEN"
curl "http://localhost:3000/api/articles/$ID/activity?types=comment,version&limit=20" -H "Authorization: Bearer $TOKEN"
```

### 2. Wire it into the editor

Render the feed as a right-rail "Activity" panel: group by day, show the actor + a human label
per `action`, and expand a `comment`'s body or a `version`'s `changedFields` inline. Use
`includesReviewerEvents` to decide whether to show the "Audit" / "Reviews" filter chips (they're
empty for a non-reviewer, so hide them).

### 3. Turn on the sources you want

The feed merges whatever is enabled — each source is skipped cleanly when off:

- `versions: { drafts: true }` on the collection → `version` events.
- `comments: true` → `comment` events.
- `review` (agents configured) → `review` events.
- `audit: true` → `audit` events.

### 4. Trust the boundaries

The timeline never exposes anything the caller couldn't already get from the underlying ops.

- **Gated on document read access.** A caller who can't read the document gets Forbidden/
  NotFound and zero events — the feed can't be used to probe a hidden document.
- **Reviewer-only sources stay reviewer-only.** `review` and `audit` events are returned only
  to an admin/editor (or a trusted server call); a non-reviewer gets `includesReviewerEvents:
  false` and only `version`/`comment` events — and the `types` filter can't bypass that gate.
- **Each source keeps its rules.** Version `changedFields` are field-access-stripped (a
  read-denied field never shows as "changed"); comments stay document-read-gated.
- **Read-only + bounded.** It performs no writes; `limit` is clamped.

Provide: «the collection(s) whose documents need an activity panel, which sources you've enabled
(versions / comments / review / audit), and who counts as a reviewer in your roles».
