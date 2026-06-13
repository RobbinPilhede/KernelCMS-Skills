---
name: set-up-an-mcp-project-from-scratch
description: End-to-end runbook — init KernelCMS, define a model, add a scoped agent, connect Claude Desktop or Cursor over MCP, and compose the first page.
category: Agent workflows
tags: [setup, runbook, mcp, quickstart, end-to-end]
difficulty: starter
---

# Set up an MCP project from scratch

**Use this when** you're starting from nothing and want a KernelCMS instance an AI agent can drive over MCP. This is the full path: scaffold the project, model some content, register a scoped agent, wire a client, and have the agent compose its first page — all landing as a draft you publish. It threads together `connect-an-agent`, `scope-an-agent-safely`, and `compose-page-from-brief` into one sitting.

The bulk is a **human runbook** (you run the commands). The last section is the **agent prompt** the connected client runs.

## Prompt

### 1. Scaffold

```bash
mkdir my-cms && cd my-cms
npx kernel init            # writes kernel.config.ts (SQLite + a users + posts collection)
npm install kernelcms
```

`kernel init` gives you a zero-config starter: local SQLite, an auth `users` collection, and a public `posts` collection.

### 2. Model your content

Edit `kernel.config.ts`. Add the fields and a page-builder collection you want the agent to compose. A minimal `pages` collection with a `blocks` field:

```ts
import { defineConfig } from 'kernelcms'
import { sqliteAdapter } from 'kernelcms/sqlite'

export default defineConfig({
  secret: process.env.KERNEL_SECRET ?? 'dev-only-secret',
  db: sqliteAdapter({ url: 'file:./content.db' }),
  collections: [
    { slug: 'users', auth: true, fields: [{ name: 'name', type: 'text' }] },
    {
      slug: 'pages',
      access: { read: () => true },
      versions: { drafts: true }, // drafts + version history (drafts implies versioning)
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'slug', type: 'text' },
        {
          name: 'layout',
          type: 'blocks',
          blocks: [
            { slug: 'hero', fields: [
              { name: 'heading', type: 'text' }, { name: 'sub', type: 'text' } ] },
            { slug: 'feature_grid', fields: [
              { name: 'columns', type: 'number' },
              { name: 'items', type: 'array', fields: [
                { name: 'title', type: 'text' }, { name: 'body', type: 'text' } ] } ] },
            { slug: 'cta', fields: [
              { name: 'label', type: 'text' }, { name: 'href', type: 'text' } ] },
          ],
        },
      ],
    },
  ],
})
```

Run it and confirm it boots:

```bash
npx kernel dev            # migrates, then serves the REST API + admin
```

Create an admin user in the admin UI (you'll publish from here later). Stop the server when you've confirmed it runs.

### 3. Add a scoped agent

Append an `agents` array. Least privilege: only the fields the agent needs, never the `admin` role, token from env.

```ts
  agents: [
    {
      id: 'page-bot',
      token: process.env.PAGE_BOT_TOKEN!,        // from env — never a literal
      roles: ['editor'],                         // never 'admin' (rejected at startup)
      fieldScope: { allow: ['title', 'slug', 'layout'] }, // deny-by-default
    },
  ],
```

Generate a token into `.env` (gitignored):

```bash
echo "PAGE_BOT_TOKEN=$(openssl rand -hex 32)" >> .env
```

### 4. Serve over MCP and connect a client

```bash
npx kernel mcp --agent page-bot     # stdio; --agent optional if there's only one
```

Register it in the client. **Claude Desktop** (`claude_desktop_config.json`) or **Cursor** (`.cursor/mcp.json`) — same shape:

```json
{
  "mcpServers": {
    "kernelcms": {
      "command": "npx",
      "args": ["kernel", "mcp", "--agent", "page-bot"],
      "env": { "PAGE_BOT_TOKEN": "paste-the-token-here" }
    }
  }
}
```

Restart the client. You should see the `kernelcms` tools (`pages_list`, `pages_create`, …) and the `kernel://schema` resource.

### 5. Compose the first page (run this prompt in the client)

> Read the `kernel://schema` resource and find the `pages` collection and its `layout` blocks field — list the available block types and their fields. Then compose a first page from this brief: «your brief». Build the `layout` array as an ordered narrative using only real block types, fill each block's fields, and create it with `pages_create` (title + slug + layout). It will be a draft — you can't publish. When done, summarize the section order and tell me it's ready to review.

### 6. Publish (human)

Open the new page in the admin, check it in live preview, fill any field outside the agent's scope, and publish. Done — your first agent-composed page is live, on your decision.

## Example

You scaffold `my-cms`, add the `pages` collection above, register `page-bot` scoped to `['title','slug','layout']`, set `PAGE_BOT_TOKEN`, wire Claude Desktop, and prompt: *"Compose a homepage for a headless CMS aimed at TypeScript devs; one action: read the docs; voice: precise."* Claude reads `kernel://schema`, then calls `pages_create`:

```json
{ "title": "Home", "slug": "home", "layout": [
  { "blockType": "hero", "heading": "A headless CMS that doesn't hijack your framework.",
    "sub": "Config-as-code, end-to-end typed, runs on any container." },
  { "blockType": "feature_grid", "columns": 3, "items": [
    { "title": "No lock-in", "body": "A web-standard Request → Response server." },
    { "title": "Typed end to end", "body": "Your model drives the types and the API." },
    { "title": "Agent-native", "body": "Scoped, draft-only MCP built in." } ] },
  { "blockType": "cta", "label": "Read the docs", "href": "/docs" }
] }
```

The page lands as a **draft**. You open it in the admin, preview, and publish.

## Notes

- **Commands:** `npx kernel init` (scaffold), `npx kernel dev` (migrate + serve), `npx kernel mcp --agent <id>` (serve MCP over stdio). For many agents at once, `kernel mcp --http --port 4000` resolves the principal per-request from the bearer token (binds to `127.0.0.1`; don't expose without TLS).
- **Drafts need `versions.drafts`.** The agent authors drafts — set `versions: { drafts: true }` on collections it writes (`drafts: true` implies versioning), so there's a draft lifecycle and version history to review. That history also enables the `pages_versions` tool, filterable by `createdByType: 'agent'`.
- **The blocks field is the page builder.** Block types and fields you define are the only ones the agent can use — that's the guardrail that keeps composition valid. Add blocks in the config; the schema (and agent) pick them up.
- **Least privilege from day one.** Scope the agent to the few fields it needs; never grant `admin` (rejected at startup); source the token from env. See **`scope-an-agent-safely`**.
- **Draft-only.** Whatever the agent does in this setup, it can't publish — you do, from the admin. See **`review-agent-drafts`**.
- This skill composes **`connect-an-agent`**, **`scope-an-agent-safely`**, and **`compose-page-from-brief`** into one flow.
