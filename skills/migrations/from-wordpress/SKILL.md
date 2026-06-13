---
name: from-wordpress
description: Migrate a WordPress site into KernelCMS — posts, pages, taxonomies, media, ACF fields, and Gutenberg or classic HTML — mapped and imported as drafts.
category: Migrations
tags: [migration, wordpress, gutenberg, acf]
difficulty: advanced
brand: WordPress
color: '#21759B'
logo: wordpress
---

# Migrate from WordPress to KernelCMS

**Use this when** you're moving a WordPress blog, site, or publication onto KernelCMS and want an agent to do the field-by-field mapping and the import — landing everything as **drafts** you review before cutover. WordPress is the single most common migration source, and its content model is messier than it looks: post content is HTML (classic editor) or Gutenberg block markup wrapped in HTML comments, custom fields may be raw postmeta or structured **ACF**, and taxonomies, authors, and the media library are all separate records that relationships must resolve. This skill grounds the migration in WordPress's two real export surfaces and maps each concept to a typed KernelCMS field.

There are two import paths, same as any migration into KernelCMS. For an *agent-driven, reviewed, transform-as-you-go* migration — the case here — the agent maps and creates documents over the MCP tools, so every row is a **draft** you can audit and nothing publishes until a human says so. For a large, trusted one-shot you can instead normalize the export to a portable `{ "<slug>": [rows] }` JSON and run `npx kernel import --file <export.json>` (the CLI bulk path: it auto-migrates then inserts, but it is **not** draft-gated — rows land as written). You can combine them: CLI for the bulk, agent for the tricky transforms.

## Prompt

> You are migrating a WordPress site into KernelCMS through the access-controlled MCP tools. Everything you create is a **draft** — review happens before any cutover. You can only write fields inside your `fieldScope`, and you physically cannot publish.
>
> **1. Choose and read the source.** WordPress exposes two surfaces — confirm which one you have:
>
> - **WXR XML** (Tools → Export → "All content", a `*.wordpress.YYYY-MM-DD.xml` file). One `<item>` per post/page/CPT/attachment. Content is the **raw editor source**: classic HTML or Gutenberg block markup (`<!-- wp:paragraph --> … <!-- /wp:paragraph -->`). Includes `wp:post_type`, `wp:status`, `wp:post_parent`, `wp:postmeta` (raw `meta_key`/`meta_value`, where ACF values live), `dc:creator` (author), `category` elements (with `domain="category"` or `domain="post_tag"`), and `<wp:term>`/attachment items. This is the **complete** export — drafts, private posts, every CPT, every meta row — but you parse Gutenberg/HTML and decode ACF yourself.
> - **WP REST API** (`/wp-json/wp/v2/posts?_embed&per_page=100&page=N`, same for `pages` and any CPT). Returns JSON where `content.rendered` is **already-rendered HTML** (shortcodes expanded, Gutenberg flattened to clean HTML), `title.rendered`, `slug`, `date`/`date_gmt`, `status`, and `_embedded` carries `author[0]`, `wp:featuredmedia[0].source_url`, and `wp:term` (categories + tags, already resolved). Cleaner HTML and pre-joined relations, but it **only returns published, REST-exposed content** by default and omits arbitrary postmeta/ACF unless the site registered those fields with `show_in_rest`. Paginate via the `X-WP-TotalPages` response header.
>
> Pick WXR when you need everything (drafts, CPTs, full ACF, private posts); pick REST when you want clean rendered HTML and resolved relations and the live site is reachable. State which you chose and why.
>
> **2. Learn the target model.** Read `kernel://schema` and each `kernel://collections/<slug>` descriptor. For every target collection list its fields, types, required fields, and which are in your `fieldScope`.
>
> **3. Build an explicit field map — and show it before importing.** For each WordPress post type, produce a table: `WordPress source → KernelCMS field`, with the transform. Model `post` and `page` (and each CPT) as **collections**; categories and tags as either a `select`/`relationship` to a taxonomy collection or inline; authors as an `authors` (or `users`) collection; the media library as an **upload** collection. Convert HTML/Gutenberg content to **richText** (KernelCMS ships `fromHTML` in `@kernel/richtext` — feed it `content.rendered` from REST, or the block-stripped HTML from WXR). Map each **ACF** field to a typed KernelCMS field (see Mapping). The **featured image** becomes an `upload` relationship. Flag every source field with no target home and every required target field with no source — do not guess.
>
> **4. Import in dependency order.** Create the records that others point at **first** — media/uploads, authors, taxonomy terms — then the posts/pages that reference them. For each row call `<collection>_create` with the mapped, validated payload. **Preserve the WordPress slug** (`post_name` / `slug`) so URLs survive. Keep a `wpId → kernelId` table per type to wire `author`, `categories`, and `featured image` relationships.
>
> **5. Handle the messy cases explicitly.** Gutenberg: strip the `<!-- wp:* -->` delimiter comments and convert the inner HTML with `fromHTML` (the importer already discards HTML comments, so block-wrapped classic HTML degrades gracefully). Classic editor: WordPress stores it with implicit paragraphs (the `wpautop` rule) — `\n\n` is a paragraph break and bare lines are not wrapped in `<p>`; normalize to `<p>` before `fromHTML` if the source is raw WXR. Shortcodes (`[gallery]`, `[caption]`, `[embed]`): REST's `content.rendered` has already expanded most of them; in WXR they are literal text — strip or convert known ones and **flag the rest**. Media: create the upload record from `source_url` (or the attachment item's `wp:attachment_url`); if you can't fetch the binary, record the URL and flag it. Authors: dedupe by `dc:creator` / `author.slug`.
>
> **6. Report.** Output: rows created per collection (with ids), rows skipped/flagged (and why), the unresolved-mapping list, and any failed media fetches. Tell the human to review the drafts (filter to `createdByType: agent`), spot-check the richText conversion, relationships, and featured images, then publish in the admin. Migration completes when a human publishes — not when you finish creating.
>
> Source: «WXR file path or REST base URL, plus the post types / CPTs / ACF groups to migrate».

## Mapping

### Content types and structure

| WordPress concept | WXR location | REST location | KernelCMS target |
| --- | --- | --- | --- |
| Post | `<item>` where `wp:post_type` = `post` | `/wp/v2/posts` | `posts` collection |
| Page | `wp:post_type` = `page` | `/wp/v2/pages` | `pages` collection (often `wp:post_parent` → self-relationship for hierarchy) |
| Custom post type | `wp:post_type` = `<cpt>` | `/wp/v2/<cpt>` | one collection per CPT |
| Title | `<title>` | `title.rendered` | `text`, `required: true`, set as `admin.useAsTitle` |
| Slug | `wp:post_name` | `slug` | `slug` field — **preserve** for URL parity |
| Body content | `content:encoded` (raw HTML / Gutenberg) | `content.rendered` (rendered HTML) | `richText` via `fromHTML` (or `blocks` if you keep a page-builder shape) |
| Excerpt | `excerpt:encoded` | `excerpt.rendered` | `textarea` or `richText` |
| Publish date | `wp:post_date_gmt` | `date_gmt` | `date` field (do **not** set `_status` — drafts only) |
| Status (`publish`/`draft`/`private`) | `wp:status` | `status` | record as data/flag; the human sets `_status` at publish |
| Author | `dc:creator` (login) | `_embedded.author[0]` | `relationship` → `authors`/`users` (resolve via author import) |
| Category | `<category domain="category" nicename="…">` | `_embedded['wp:term']` (taxonomy `category`) | `relationship` → `categories`, or `select` |
| Tag | `<category domain="post_tag" …>` | `_embedded['wp:term']` (taxonomy `post_tag`) | `relationship hasMany` → `tags`, or `select hasMany` |
| Featured image | `wp:postmeta` `_thumbnail_id` → attachment item | `_embedded['wp:featuredmedia'][0].source_url` | `upload` relationship → `media` |
| Media / attachment | `wp:post_type` = `attachment` (`wp:attachment_url`) | `/wp/v2/media` (`source_url`) | `upload` collection (`media`); fetch binary via `<collection>_create` after `upload` |
| Comments | `<wp:comment>` children of `<item>` | `/wp/v2/comments` | optional `comments` collection (often skipped or out of scope) |
| Page hierarchy | `wp:post_parent` | `parent` | self-`relationship` on `pages` |

### Gutenberg and classic HTML → richText

- **Gutenberg** stores block markup as HTML wrapped in comment delimiters: `<!-- wp:paragraph --><p>…</p><!-- /wp:paragraph -->`, `<!-- wp:heading {"level":3} --><h3>…</h3><!-- /wp:heading -->`, `<!-- wp:image {"id":42} --><figure class="wp-block-image"><img …/></figure><!-- /wp:image -->`. Core blocks omit the namespace (`wp:image`); custom blocks keep it (`wp:acf/hero`). Attributes are a JSON object inside the opening comment. KernelCMS's `fromHTML` **discards HTML comments during tokenization**, so feeding it block markup yields clean richText from the inner HTML automatically — the delimiters just vanish. Map recognized blocks (paragraph, heading, list, quote, image, code) to their richText/upload equivalents; for custom/embed blocks, decode the JSON attrs and **flag** anything without a target.
- **Classic editor** content is plain HTML with WordPress's `wpautop` convention: double newlines are paragraph breaks and many paragraphs are *not* explicitly wrapped in `<p>`. If you pull raw WXR, run the same paragraph-wrapping before `fromHTML`; REST's `content.rendered` has already applied `wpautop`, so it's ready to convert.
- `fromHTML` covers the common subset — paragraphs, h2–h4 (h1/h5/h6 clamp into range), lists, blockquote, `<pre>` code, `<hr>`, and the bold/italic/underline/strike/code/link inline marks — and runs everything through `sanitizeRichText`. Anything unrecognized degrades to text/paragraphs rather than breaking.

### ACF field types → KernelCMS field types

ACF values live in `wp:postmeta` (WXR) as a serialized `meta_key`/`meta_value` pair, or in REST under an `acf` object **only if** the field group enabled "Show in REST API". Decode per ACF type:

| ACF field type | KernelCMS field |
| --- | --- |
| `text`, `email`, `url`, `password` | `text` / `email` |
| `textarea` | `textarea` |
| `wysiwyg` | `richText` (via `fromHTML`) |
| `number`, `range` | `number` |
| `true_false` | `boolean` |
| `select`, `radio`, `button_group` | `select` (`hasMany` for multi-select) |
| `checkbox` | `select hasMany` |
| `date_picker`, `date_time_picker`, `time_picker` | `date` |
| `image`, `file` | `upload` relationship → `media` |
| `gallery` | `upload` relationship, `hasMany: true` |
| `post_object`, `page_link`, `relationship` | `relationship` (resolve target ids via the `wpId → kernelId` map; `hasMany` for `relationship`) |
| `taxonomy` | `relationship` → the taxonomy collection |
| `user` | `relationship` → `authors`/`users` |
| `link` | `group { text, url, target }` or `json` |
| `google_map` | `point` (lat/lng) plus a `text` address, or `json` |
| `color_picker` | `text` |
| `group` | `group` (map subfields recursively) |
| `repeater` | `array` (each ACF sub-row → an array row; map subfields) |
| `flexible_content` | `blocks` (each layout → a `BlockDef`; map subfields per layout) |
| `clone` | inline the cloned fields at the target level |

## Example

**Source (WP REST):** `GET /wp-json/wp/v2/posts/512?_embed`

```json
{
  "id": 512,
  "date_gmt": "2026-02-14T09:30:00",
  "slug": "shipping-faster",
  "status": "publish",
  "title": { "rendered": "Shipping Faster" },
  "content": {
    "rendered": "<!-- wp:paragraph --><p>We cut our deploy time in <strong>half</strong>.</p><!-- /wp:paragraph -->\n<!-- wp:heading {\"level\":2} --><h2>How</h2><!-- /wp:heading -->\n<!-- wp:list --><ul><li>Caching</li><li>Smaller images</li></ul><!-- /wp:list -->"
  },
  "excerpt": { "rendered": "<p>A short note on speed.</p>" },
  "acf": { "read_time": 4, "is_featured": true },
  "_embedded": {
    "author": [{ "slug": "nora", "name": "Nora Vik" }],
    "wp:featuredmedia": [{ "source_url": "https://old.example.com/wp-content/uploads/2026/02/cover.jpg" }],
    "wp:term": [
      [{ "taxonomy": "category", "slug": "engineering", "name": "Engineering" }],
      [{ "taxonomy": "post_tag", "slug": "performance", "name": "Performance" }]
    ]
  }
}
```

**Agent plan (after reading `kernel://schema`):** import `authors`, `categories`/`tags`, and the featured `media` upload first, then create the post. `content.rendered` goes through `fromHTML` — the `<!-- wp:* -->` comments are dropped and the inner HTML becomes richText. `date_gmt`/`status` are recorded but `_status` is **left as draft**.

**Resulting `posts_create` payload (a draft):**

```json
{
  "title": "Shipping Faster",
  "slug": "shipping-faster",
  "body": {
    "v": 1, "type": "doc",
    "children": [
      { "type": "paragraph", "children": [
        { "type": "text", "text": "We cut our deploy time in " },
        { "type": "text", "text": "half", "marks": [{ "type": "bold" }] },
        { "type": "text", "text": "." }
      ]},
      { "type": "heading", "level": 2, "children": [{ "type": "text", "text": "How" }] },
      { "type": "list", "ordered": false, "children": [
        { "type": "listItem", "children": [{ "type": "paragraph", "children": [{ "type": "text", "text": "Caching" }] }] },
        { "type": "listItem", "children": [{ "type": "paragraph", "children": [{ "type": "text", "text": "Smaller images" }] }] }
      ]}
    ]
  },
  "excerpt": "A short note on speed.",
  "author": "<kernelId for author slug 'nora'>",
  "categories": ["<kernelId for 'engineering'>"],
  "tags": ["<kernelId for 'performance'>"],
  "cover": "<kernelId for the uploaded cover.jpg media doc>",
  "read_time": 4,
  "is_featured": true,
  "published_at": "2026-02-14T09:30:00Z"
}
```

Report: `authors: 1 · categories: 1 · tags: 1 · media: 1 · posts: 1 created (draft). status was "publish" — set _status at publish time. Review createdByType:agent drafts, then publish.`

## Notes

- **WXR vs REST tradeoffs.** WXR (Tools → Export) is the *complete* export — drafts, private posts, every CPT, all `wp:postmeta`/ACF, attachment records — but content is the **raw editor source** (you parse Gutenberg block markup and classic HTML, and decode serialized ACF meta yourself). The REST API gives **clean rendered HTML** (`content.rendered`, shortcodes expanded, `wpautop` applied) and **pre-resolved relations** via `_embed` (author, featured media, terms), but by default returns **only published, REST-exposed content** and omits arbitrary postmeta/ACF unless the field group set `show_in_rest`. Rule of thumb: REST for clean published content on a reachable live site; WXR when you need drafts, every CPT, or full ACF — and combine when neither alone is complete.
- **Gutenberg vs classic.** Both are HTML at rest; Gutenberg just wraps it in `<!-- wp:* -->` comment delimiters with JSON attrs. KernelCMS `fromHTML` discards HTML comments, so block-wrapped content converts cleanly to richText without a Gutenberg parser. Classic content relies on `wpautop` (double-newline paragraphs, unwrapped lines) — normalize paragraphs before converting raw WXR; REST output is already normalized.
- **Shortcodes.** `[gallery]`, `[caption]`, `[embed]`, and plugin shortcodes are literal text in WXR and expanded HTML in REST's `content.rendered`. Convert known ones (a `[caption]` → a figure/image upload), and **flag** the rest rather than importing raw bracket syntax into richText.
- **Slugs and redirects.** Preserve `post_name` / `slug` on every document so existing URLs map 1:1. WordPress permalinks often include dates or a `/blog/` prefix — note the old URL shape so the human can add redirects at the edge after cutover.
- **Cross-links.** WordPress body content frequently links to other posts by their old absolute URL. After import, optionally rewrite intra-site links using the `wpId → kernelId` (or old-slug → new-slug) map so internal links resolve on the new site; flag any that don't.
- **Draft-only and scope.** Agents can't publish and can't write outside `fieldScope`, so a botched WordPress import is a pile of reviewable drafts, never a broken live site. Lifecycle/ownership fields (`_status`, an unscoped `author`) are stripped from agent writes — set them at the human review/publish step.
- **Tools.** `kernel://schema` + `kernel://collections/<slug>` (target model), `<collection>_create` (each row, including `media` uploads), `<collection>_list` / `_count` (idempotency on re-runs). For a trusted bulk one-shot, normalize to `{ "<slug>": [rows] }` and use `npx kernel import --file` instead (not draft-gated).
</content>
</invoke>
