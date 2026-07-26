# SkillAtlas — أطلس المهارات

واجهة عربية/إنجليزية سريعة لاكتشاف مهارات وكلاء الذكاء الاصطناعي، مبنية على بيانات
[ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills).

SkillAtlas turns the upstream Markdown catalog and bundled `SKILL.md` files into a searchable,
production-ready directory without executing upstream code.

## What is included

- 997 indexed records in the current snapshot: 864 real `SKILL.md` files plus reconciled README entries.
- Instant Arabic/English search with category, source, type, script, and favorite filters.
- 997 statically generated skill pages with source, licensing, resource flags, and manual install guidance.
- Arabic-first RTL UI, English toggle, dark/light modes, responsive navigation, loading/error/empty states.
- Atlas Zero agent with deterministic catalog reasoning, safe in-site actions, and no model API key.
- Optional public research across GitHub, npm, and Arabic/English Wikipedia with visible sources.
- Optional Qwen3-0.6B local brain in a Web Worker using WebGPU; it downloads only after explicit consent.
- Agent Elements chat interface from [21st.dev](https://21st.dev/) with local browser conversation history.
- SEO metadata, JSON-LD, Open Graph image, sitemap, robots, web manifest, and catalog status API.
- Deterministic parser tests and a twice-daily GitHub Actions sync that commits only after tests and build pass.
- Production dependency overrides for patched `postcss` and `sharp` versions.

## Run locally

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production verification:

```bash
npm run check
npm run build
npm start
```

## Refresh the catalog

Clone or update the upstream repository, then point the sync script to that checkout:

```bash
npm run sync -- --source ../awesome-claude-skills
```

Windows PowerShell example:

```powershell
npm.cmd run sync -- --source ..\awesome-claude-skills
```

The generator writes:

- `src/data/skills.generated.json` — normalized, search-ready records.
- `src/data/snapshot.generated.json` — source commit, counts, categories, and reconciliation warnings.

Generation is deterministic. If the upstream commit has not changed, the existing `syncedAt` value is
preserved and no data diff is created.

## Automatic update workflow

`.github/workflows/sync-upstream.yml` runs twice every day and can also be started manually. It:

1. clones a shallow upstream snapshot;
2. parses every real `SKILL.md` and the README catalog as separate sources;
3. reconciles exact paths and keeps unresolved README listings without inventing broken file links;
4. runs parser tests, ESLint, TypeScript, and the full Next.js build;
5. commits generated JSON only when all checks pass and content changed.

No script, package, or executable from the upstream repository is run during synchronization.

## Architecture

```text
Upstream README + 864 SKILL.md files
                │
                ▼
      scripts/sync-skills.mjs
                │
        deterministic snapshot
                │
      ┌─────────┴─────────┐
      ▼                   ▼
Server Components    Client directory
SSG detail pages     search + filters
```

Main routes:

- `/` — landing and curated discovery.
- `/explore` — full searchable directory.
- `/skills/[slug]` — static skill details.
- `/learn` — Skills vs Tools vs MCP and safe install guidance.
- `/about` — methodology, attribution, limitations, and current snapshot.
- `/agent` — keyless agent, optional live research, and optional local WebGPU brain.
- `/privacy` — clear data-flow, storage, research, and safe-use disclosure.
- `/api/catalog/status` — generated catalog metadata.
- `/api/agent` — bounded deterministic agent endpoint.
- `/api/research` — allowlisted public research endpoint with request limits and no response cache.

## Deploy

The project is ready for Vercel or any Node.js host that can run the standard Next.js production server.

Set this variable to the production origin before building:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

Vercel needs no additional build configuration: install with `npm install`, build with `npm run build`.

Atlas Zero needs no paid AI credential. The optional local model is downloaded from Hugging Face by the
visitor's browser after consent (roughly 570 MB plus tokenizer/support files), then cached and executed
locally. Public research queries are sent only to the providers named in the interface.

## Source, safety, and licensing

SkillAtlas is an independent interface and is not an official Anthropic or Composio product.

The upstream README states Apache-2.0 for the repository while warning that individual skills may have
different licenses. The snapshot therefore keeps per-skill license metadata and does not assume that every
file can be redistributed. Full skill text is rendered in SkillAtlas only when a recognizable open license is
detected; otherwise the detail page links to the original source.

Presence in this directory is not a security audit or compatibility guarantee. Review `SKILL.md`, scripts,
dependencies, requested tools, and permissions before installing a skill.
