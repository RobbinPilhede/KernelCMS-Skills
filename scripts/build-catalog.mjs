/* Generate catalog.json from every skills SKILL.md file.
 *
 * The catalog is the machine-readable index of the library: it powers the
 * website's Prompts page and any tooling. It is generated, never hand-edited.
 * Zero dependencies — a tiny frontmatter + section parser is enough.
 *
 * Run: node scripts/build-catalog.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SKILLS = path.join(ROOT, 'skills')

/** Find every SKILL.md under skills/. */
function walk(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(p))
    else if (entry.name === 'SKILL.md') out.push(p)
  }
  return out
}

/** Minimal YAML frontmatter: scalars and [a, b] inline arrays. */
function parseFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!m) return { meta: {}, body: src }
  const meta = {}
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/)
    if (!kv) continue
    const key = kv[1]
    let val = kv[2].trim()
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
    } else {
      val = val.replace(/^['"]|['"]$/g, '')
    }
    meta[key] = val
  }
  return { meta, body: m[2] }
}

/** Pull the human title (first `# `) and the `## Prompt` block (blockquote or text). */
function extract(body) {
  const title = (body.match(/^#\s+(.+)$/m) || [, ''])[1].trim()
  const promptSection = body.split(/^##\s+Prompt\s*$/m)[1] || ''
  const stop = promptSection.search(/^##\s+/m)
  const raw = (stop === -1 ? promptSection : promptSection.slice(0, stop)).trim()
  // Strip a leading blockquote marker per line if the prompt is quoted.
  const prompt = raw
    .split('\n')
    .map((l) => l.replace(/^>\s?/, ''))
    .join('\n')
    .trim()
  return { title, prompt }
}

const skills = walk(SKILLS)
  .map((file) => {
    const src = fs.readFileSync(file, 'utf8')
    const { meta, body } = parseFrontmatter(src)
    const { title, prompt } = extract(body)
    const rel = path.relative(ROOT, file).split(path.sep).join('/')
    return {
      name: meta.name || path.basename(path.dirname(file)),
      title: title || meta.name,
      description: meta.description || '',
      category: meta.category || 'Uncategorized',
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      difficulty: meta.difficulty || 'intermediate',
      path: rel,
      prompt,
    }
  })
  .sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title))

const byCategory = {}
for (const s of skills) (byCategory[s.category] ||= []).push(s.name)

const catalog = {
  generatedFrom: 'skills/**/SKILL.md',
  count: skills.length,
  categories: Object.keys(byCategory).sort(),
  skills,
}

fs.writeFileSync(path.join(ROOT, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n')
console.log(`catalog.json: ${skills.length} skills across ${catalog.categories.length} categories`)
for (const c of catalog.categories) console.log(`  ${c}: ${byCategory[c].length}`)
