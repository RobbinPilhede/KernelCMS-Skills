---
name: faq-section
description: Compose an FAQ block in KernelCMS that answers the real objections plainly — 4–6 questions, honest answers — as a draft.
category: Page design
tags: [faq, blocks, marketing, copy]
difficulty: starter
---

# Design an FAQ section

**Use this when** you want an agent to write the section that removes the last reasons not to act. A good FAQ isn't filler — it's objection handling in disguise. The agent composes the real FAQ block from your schema and answers like a person, not a policy.

## Prompt

> You are a senior product designer and copywriter writing an FAQ section in KernelCMS. You work through the access-controlled MCP tools and write **drafts** only.
>
> **First, learn the model.** Read `kernel://schema` to find the target collection's `blocks` field and the **exact FAQ block** with its real fields — usually a `heading` and an `items` array of `{ question, answer }` (names may differ; use what the schema gives). If no FAQ block exists, pick the nearest and note it.
>
> **Then write questions the reader actually has, not the ones you wish they had:**
> - **4 to 6 questions.** Each one a genuine objection or hesitation: price, lock-in, migration, security, "is this for me," "what happens if I leave." If a question's answer is "obviously yes," it's not earning its slot.
> - **Phrase the question in the reader's voice.** "Can I move my data out later?" not "What is your data portability policy?" Doubt sounds like a worried human, so write it that way.
> - **Answer plainly and lead with the answer.** First word should resolve it — "Yes," "No," "It depends, and here's when." Then one or two sentences of why. Don't bury the answer under marketing.
> - **Be honest about limits.** Naming a real trade-off ("No, not yet — it's on the roadmap") builds more trust than dodging. A page with no admitted weaknesses reads as a sales pitch.
> - **Order by anxiety.** Biggest blocker first. The reader stops reading once they're reassured, so front-load the deal-breakers.
>
> **Design judgment.** FAQs usually render as an accordion — keep questions short enough to scan with everything collapsed, since that's the default view. One concept per item; if an answer needs three paragraphs, the question is really two questions.
>
> **Guardrails.** Real fields only, all must validate. Don't promise features that don't exist — if you're unsure, frame it as something for me to confirm. The page stays a draft. When done, list the questions in order and tell me it's ready to review.
>
> Brief: «product, audience, the real objections and the honest answers, brand voice».

## Example

**Brief:** "FAQ for KernelCMS. Audience: devs evaluating it against Payload and Strapi. Real objections: framework lock-in, can I leave, is the AI access safe, does it scale past SQLite. Voice: direct, no spin."

The agent reads `kernel://schema`, finds an `faq` block (`heading`, `items[] = { question, answer }`), and writes:

```json
{
  "blockType": "faq",
  "heading": "Questions you're probably asking",
  "items": [
    { "question": "Do I have to use a specific framework?",
      "answer": "No. The admin and API are a web-standard Request → Response server — unlike Payload, nothing ties you to Next.js. Run it on any container." },
    { "question": "Can I get my data out later?",
      "answer": "Yes. Your model is plain TypeScript and your data lives in your own SQL database (SQLite or Postgres). There's no proprietary store to escape." },
    { "question": "Is it safe to connect an AI agent?",
      "answer": "Yes. An agent runs through the same access pipeline as a human, but field-scoped and draft-only — it can't publish or write fields outside its scope, even with permissive rules." },
    { "question": "Does it scale past SQLite?",
      "answer": "Yes. SQLite is the zero-dependency default; set DATABASE_URL and the same config runs on Postgres without code changes." }
  ]
}
```

…written via `pages_update`, leaving the page a **draft**.

## Notes

- **The FAQ is where honesty pays.** One admitted limitation does more for trust than ten polished non-answers.
- **Accordion-first.** Most FAQ blocks render collapsed by default — write questions that scan on their own, before anyone clicks to expand.
- **Tools:** `kernel://schema` to discover the block and `items` shape; `<collection>_update` / `_create` to write. See the [MCP guide](https://kernelcms.com/mcp).
- **Pair with** `pricing-section` (where the billing objections come from) and `seo-optimize-page` — a real FAQ is the natural source for structured-data questions.
- **Draft-only.** Review and publish yourself.
