---
name: model-ecommerce-catalog
description: Design a typed KernelCMS product catalog — products, variants, collections, media, and pricing — as config-as-code with the right field types.
category: Content modeling
tags: [ecommerce, products, variants, pricing, media]
difficulty: intermediate
---

# Model an e-commerce catalog

**Use this when** you want an agent to model a product catalog in KernelCMS: `products` with `variants`, browsable `collections`, `media`, and prices that are correct to the cent. The output is a typed `kernel.config.ts` — the read-side catalog model, not a checkout. (KernelCMS ships a `commerce()` plugin with `products` + `orders` + a server-recomputed checkout; if the brief needs orders, point to that. This skill models the catalog itself.)

## Prompt

> You are modeling an e-commerce catalog in KernelCMS as config-as-code with `defineConfig`. Use only real field types: `text`, `textarea`, `slug`, `code`, `number`, `boolean`, `date`, `select`, `json`, `point`, `richText`, `group`, `array`, `blocks`, `relationship`, `upload`, and the `join` reverse-relationship. Relationship/upload fields take `relationTo`, `hasMany`, `onDelete`.
>
> **Model it like this:**
> 1. **`media`** — an `upload: true` collection. If `config.image` (the sharp adapter) is set, declare `imageSizes` for `thumbnail`/`card`/`og` and `focalPoint: true`; otherwise originals only.
> 2. **`product_collections`** (the merchandising kind — e.g. "Summer", "Sale"): `title`, `slug` (unique), `description` (richText), `hero` (upload → media). Add a `join` named `products` (`on: 'collections'`) to list members.
> 3. **`products`** — `title` (text, required), `slug` (slug, unique, required, index), `description` (richText), `images` (upload → media, `hasMany`), `collections` (relationship → product_collections, `hasMany`, `onDelete: 'setNull'`), `status` (select: draft/active/archived), and a **`variants`** `array`.
> 4. **Pricing — store integer minor units, never floats.** Price fields are `number` with `integer: true, min: 0` named like `price_cents`. Add a `currency` `select` (ISO codes). Money in cents avoids float rounding; a virtual computed field can format it for display.
> 5. **Variants** — model as an `array` on the product when variants are simple (size/color rows), or as their own `variants` collection with `relationTo: 'products'` when they need their own URLs, stock, or SKUs queried independently. Each variant row: `sku` (text, unique if its own collection), `options` (array of `{ name, value }` or a `group`), `price_cents` (number, integer — overrides the base when set), `inventory` (number, integer, min 0).
>
> **Versions/drafts.** Give `products` `versions: { drafts: true }` so a product can be staged and previewed before going live, with `access.publish` gating the active state.
>
> **Access.** Public reads on the catalog; writes auth-only. Consider row-level scoping if vendors manage only their own products.
>
> **Admin.** `admin.useAsTitle: 'title'`, `defaultColumns`, `defaultSort`. Use `tabs` to split Content / Pricing / Inventory in the editor.
>
> Output the full config, then justify: array-variants vs. variant-collection, why prices are integer cents, why `media` is its own upload collection, and the `onDelete` choice on `collections`.

## Example

**Brief:** "Apparel store. Products have size/color variants with per-variant SKU and stock. Browsable collections. Prices in USD, never wrong by a cent. Stage products before publishing."

The agent chooses a **dedicated `variants` collection** (per-variant SKU + stock queried independently) and emits (excerpt):

```ts
import { defineConfig } from 'kernelcms'
import { sqliteAdapter } from 'kernelcms/sqlite'

const CURRENCIES = ['USD', 'EUR', 'GBP'] as const

export default defineConfig({
  secret: process.env.KERNEL_SECRET ?? 'dev-only-secret',
  db: sqliteAdapter({ url: 'file:./content.db' }),
  collections: [
    { slug: 'media', upload: true, access: { read: () => true },
      fields: [{ name: 'alt', type: 'text' }] },
    {
      slug: 'product_collections',
      labels: { singular: 'Collection', plural: 'Collections' },
      admin: { useAsTitle: 'title' },
      access: { read: () => true },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'slug', type: 'slug', required: true, unique: true },
        { name: 'description', type: 'richText' },
        { name: 'hero', type: 'upload', relationTo: 'media' },
        { type: 'join', name: 'products', collection: 'products', on: 'collections', limit: 200 },
      ],
    },
    {
      slug: 'products',
      versions: { drafts: true },
      admin: { useAsTitle: 'title', defaultColumns: ['title', 'status', 'updatedAt'], defaultSort: '-updatedAt' },
      access: { read: () => true, update: ({ req }) => Boolean(req.user) },
      fields: [
        { type: 'tabs', tabs: [
          { label: 'Content', fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'slug', type: 'slug', required: true, unique: true, index: true },
            { name: 'description', type: 'richText' },
            { name: 'images', type: 'upload', relationTo: 'media', hasMany: true },
            { name: 'collections', type: 'relationship', relationTo: 'product_collections', hasMany: true, onDelete: 'setNull' },
          ] },
          { label: 'Pricing', fields: [
            { name: 'price_cents', type: 'number', required: true, integer: true, min: 0,
              admin: { description: 'Base price in minor units (cents). 1999 = $19.99' } },
            { name: 'currency', type: 'select', options: [...CURRENCIES], defaultValue: 'USD' },
            // virtual display helper — derived on read, never stored
            { name: 'price_display', type: 'text', virtual: true,
              compute: ({ doc }) => `$${((Number(doc.price_cents) || 0) / 100).toFixed(2)}` },
          ] },
        ] },
        { name: 'status', type: 'select', defaultValue: 'draft', index: true,
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Active', value: 'active' },
            { label: 'Archived', value: 'archived' },
          ] },
        { type: 'join', name: 'variants', collection: 'variants', on: 'product', limit: 100 },
      ],
    },
    {
      slug: 'variants',
      admin: { useAsTitle: 'sku' },
      access: { read: () => true, update: ({ req }) => Boolean(req.user) },
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products', required: true, onDelete: 'cascade' },
        { name: 'sku', type: 'text', required: true, unique: true },
        { name: 'options', type: 'array', fields: [
          { name: 'name', type: 'text' },   // "Size"
          { name: 'value', type: 'text' },  // "M"
        ] },
        { name: 'price_cents', type: 'number', integer: true, min: 0,
          admin: { description: 'Overrides the product base price when set.' } },
        { name: 'inventory', type: 'number', integer: true, min: 0, defaultValue: 0 },
      ],
    },
  ],
})
```

**Rationale (abridged):** Variants are their own collection because each needs a unique SKU and queryable stock; `onDelete: 'cascade'` on `variant.product` means deleting a product removes its orphan variants (a variant with no product is meaningless). Prices are integer `price_cents` to kill float drift; `price_display` is a *virtual* field so formatting lives in one place and is never stored. `media` is a separate upload collection so images are reused across products and get resized derivatives. `collections` uses `setNull` — deleting a merchandising collection must never delete products.

## Notes

- **Money is integer minor units.** `number` with `integer: true` storing cents; format with a `virtual` compute field. Never a `number` float for currency.
- **Array vs. collection for variants:** array when variants are presentational rows with no independent identity; a dedicated collection when they need unique SKUs, stock, or their own queries/URLs. The `onDelete` direction differs — see **`relationships-and-joins`**.
- **Resized images** require `config.image` (the `@kernel/image-sharp` adapter) before `imageSizes` does anything; without it you store originals.
- **Orders/checkout** are out of scope here — use the `commerce({ payment })` plugin, which recomputes totals server-side from real prices. This skill is the catalog model only.
- **Drafts** let you stage a product; `access.publish` gates the move to active. Run `kernel generate:types` when done.
