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

In the client, ask: *"List the available KernelCMS tools, then read `kernel://schema` and tell me which collections exist."* If it can list tools and read the schema, you're connected.

## Example

You add `content-bot` scoped to `['title', 'body', 'excerpt']` with `roles: ['editor']`, set `CONTENT_BOT_TOKEN`, register the snippet above in `claude_desktop_config.json`, and restart Claude Desktop. In a chat you say *"Draft a post titled 'Shipping 0.5' summarizing the release."* Claude calls `posts_create` with `{ title, body, excerpt }`; the document is created as a **draft**, attributed `createdByType: agent`. A `_status: published` would be rejected — the agent can't publish.

## Notes

- **Tools are auto-generated** from your content model: `<slug>_list / _get / _count / _versions / _create / _update / _delete` per collection, `<slug>_get_global / _update_global` per global. Auth and hidden collections are excluded entirely.
- **`--agent` selects the stdio principal.** One agent → optional; many → required, or the CLI errors with the list.
- **Multiple agents at once?** Serve over HTTP instead: `kernel mcp --http --port 4000` resolves the principal per-request from `Authorization: Bearer <token>`. It binds to `127.0.0.1` by default — don't expose it without a TLS proxy.
- **The token is a secret.** Keep it in env/`.env` (gitignored). Rotate by changing the env var; the config reads it fresh on boot.
- **Draft-only, always.** Whatever you connect, the agent authors drafts. A human publishes from the admin. See **`scope-an-agent-safely`** to choose a minimal `fieldScope`.
