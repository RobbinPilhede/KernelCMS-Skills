# Contributing to KernelCMS Skills

Thanks for adding to the library. A good contribution is small, specific, and immediately usable.

## Add a skill

1. Pick (or create) a category under `skills/` — e.g. `skills/page-design/`.
2. Create a folder named in `kebab-case`: `skills/page-design/my-skill/`.
3. Add a `SKILL.md` with this frontmatter and shape:

   ```markdown
   ---
   name: my-skill               # kebab-case, unique, matches the folder
   description: One sentence (<160 chars). Used as the Claude Skill description and in the catalog.
   category: Page design        # must match a category title below
   tags: [hero, blocks]         # lowercase, for filtering
   difficulty: starter | intermediate | advanced
   ---

   # Human title

   **Use this when** … one paragraph of framing.

   ## Prompt
   > The ready-to-use prompt. Self-contained, specific, KernelCMS-native.

   ## Example
   A worked example: a brief in, and what the agent produces.

   ## Notes
   Caveats, the KernelCMS tools/APIs involved, and the guardrails that apply.
   ```

4. Run `node scripts/build-catalog.mjs` to regenerate `catalog.json`.
5. Open a PR.

## Categories

Keep skills in one of these (or propose a new one in your PR):

- **Page design** — composing pages and sections from the blocks page-builder.
- **Content modeling** — designing typed collections, fields, globals, SEO, locales.
- **Agent workflows** — connecting, scoping, and driving agents over MCP.
- **Quality** — SEO, accessibility, performance, copy voice, design tokens.

## Principles

- **KernelCMS-native and accurate.** Reference real APIs: `defineConfig`, collections, the `blocks` field, the MCP tools (`<coll>_create`/`_update`/…), `fieldScope`, drafts. Don't invent fields or tools.
- **Respect the guardrails.** Agents are field-scoped and draft-only. A skill never asks an agent to publish or to bypass access — it can't anyway, but don't imply it.
- **Beautiful by default.** Page-design skills should encode real design judgment (hierarchy, rhythm, restraint, accessibility), not "add a section."
- **Copy-paste ready.** The `## Prompt` block must work on its own, pasted into a chat with an MCP connection.
- **One concept per skill.** If it needs two prompts, it's two skills.
