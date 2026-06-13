---
name: connect-an-agent
description: Define a scoped agent in your KernelCMS config, serve it over MCP with `npx kernel mcp`, and wire Claude Desktop or Cursor to it.
category: Agent workflows
tags: [mcp, setup, claude-desktop, cursor, stdio]
difficulty: starter
---

# Connect an agent

**Use this when** you want an AI client (Claude Desktop, Cursor) to read and draft content in your KernelCMS instance over MCP. You register an `agent` in your config, serve the kernel as an MCP server, and point the client at it. The agent is a real, access-controlled principal — field-scoped and draft-only — not a privileged back door.

This is a human runbook, not an agent prompt: you run the steps, then the connected client does the work (see the other Agent-workflow skills for what to ask it).

## Prompt

This skill is operational — follow the runbook.

### 1. Define the agent in `kernel.config.ts`

Add an `agents` array. Each agent needs a unique `id` and a `token` (a bearer credential — **source it from the environment, never hardcode**). Give it the narrowest `roles` and `fieldScope` it needs.

```ts
import { defineConfig } from 'kernelcms'

export default defineConfig({
  agents: [
    {
      id: 'content-bot',
      token: process.env.CONTENT_BOT_TOKEN!, // from env — never a literal
      roles: ['editor'],                     // never 'admin' (rejected at startup)
      fieldScope: { allow: ['title', 'body', 'excerpt'] }, // deny-by-default
    },
  ],
  // …collections, globals, etc.
})
```

`roles` flow through the *same* access rules a human gets. `fieldScope.allow` is deny-by-default: only those top-level fields can be written; everything else is stripped from every write. The `admin` role is rejected when the config loads — granting it would widen role-gated rules for a non-human caller.

Put the token in your environment, e.g. `.env`:

```bash
CONTENT_BOT_TOKEN=$(openssl rand -hex 32)
```

### 2. Serve over stdio

```bash
npx kernel mcp --agent content-bot
```

With exactly one configured agent, `--agent` is optional; with several it is required. The server speaks MCP JSON-RPC over stdin/stdout — diagnostics go to stderr, so stdout stays pure protocol.

### 3. Wire Claude Desktop

Edit `claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/`; Windows: `%APPDATA%\Claude\`). The client spawns the process, so give it the working directory and the token via `env`:

```json
{
  "mcpServers": {
    "kernelcms": {
      "command": "npx",
      "args": ["kernel", "mcp", "--agent", "content-bot"],
      "env": { "CONTENT_BOT_TOKEN": "paste-the-token-here" }
    }
  }
}
```

Restart Claude Desktop. You'll see the `kernelcms` tools (`posts_list`, `posts_create`, …) and the `kernel://schema` resource.

### 4. Wire Cursor

Cursor reads `.cursor/mcp.json` in your project (or the global one in `~/.cursor/`). Same shape:

```json
{
  "mcpServers": {
    "kernelcms": {
      "command": "npx",
      "args": ["kernel", "mcp", "--agent", "content-bot"],
      "env": { "CONTENT_BOT_TOKEN": "paste-the-token-here" }
    }
  }
}
```

### 5. Verify

In the client, ask: *"List the available KernelCMS tools, then read the `kernel://schema` resource and tell me which collections exist and which fields you're scoped to write."* If it can list tools and read the schema, you're connected. The two introspection resources are `kernel://schema` (the whole model) and `kernel://collections/<slug>` (one collection's descriptor) — both serve only visible collections, so no auth/hidden field names (`email`, `api_key`, `reset_token`) ever leak.

## Example

You add `content-bot` scoped to `['title', 'body', 'excerpt']` with `roles: ['editor']`, set `CONTENT_BOT_TOKEN`, register the snippet above in `claude_desktop_config.json`, and restart Claude Desktop. In a chat you say *"Draft a post titled 'Shipping 0.5' summarizing the release."* Claude calls `posts_create` with `{ title, body, excerpt }`; the document is created as a **draft**, attributed `createdByType: agent`. A `_status: published` would be rejected — the agent can't publish.

## Notes

- **Tools are auto-generated** from your content model: `<slug>_list / _get / _count / _create / _update / _delete` per collection (`<slug>_versions` is added when the collection keeps a version history), `<slug>_get_global / _update_global` per global. Input schemas come from the shared JSON-Schema mapper, so they match your fields exactly and omit server-managed columns (`hash`, `api_key`, `_status`) — with `additionalProperties: false`, so an unscoped field can't be smuggled past the client. Auth and hidden collections are excluded from both tools and resources entirely. `<slug>_get` reads with `draft: true`, so the client always sees the latest draft (including the agent's own writes).
- **`--agent` selects the stdio principal.** One agent → optional; many → required, or the CLI errors with the list.
- **Multiple agents at once?** Serve over HTTP instead: `kernel mcp --http --port 4000 --host 127.0.0.1` resolves the principal per-request from `Authorization: Bearer <token>` (or `x-kernel-agent: <token>`). Each request is authenticated independently — agent A's token yields A's scope, B's yields B's — and no token is ever echoed. A missing/unknown token gets a `401` with no tools or resources served. It binds to `127.0.0.1` by default and CORS is off — don't expose it on `0.0.0.0` without a TLS proxy. Smoke-test it with `curl -X POST http://127.0.0.1:4000/mcp -H "Authorization: Bearer $CONTENT_BOT_TOKEN" -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`.
- **The token is a secret.** Keep it in env/`.env` (gitignored). Rotate by changing the env var; the config reads it fresh on boot.
- **Draft-only, always.** Whatever you connect, the agent authors drafts. A human publishes from the admin. See **`scope-an-agent-safely`** to choose a minimal `fieldScope`.
