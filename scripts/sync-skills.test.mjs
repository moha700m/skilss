import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  generateCatalog,
  githubFileUrl,
  normalizeSlug,
  parseFrontmatter,
  parseReadmeEntries,
} from "./sync-skills.mjs";

test("parseFrontmatter handles quoted and folded YAML values", () => {
  const parsed = parseFrontmatter(`---
name: "sample-skill"
description: >
  First line with a colon: yes.
  Second line.
license: 'MIT'
requires:
  mcp: [rube]
---
# Sample Skill
`);

  assert.equal(parsed.hasFrontmatter, true);
  assert.equal(parsed.attributes.name, "sample-skill");
  assert.equal(parsed.attributes.description, "First line with a colon: yes. Second line.");
  assert.equal(parsed.attributes.license, "MIT");
  assert.match(parsed.body, /^# Sample Skill/);
});

test("parseReadmeEntries retains categories, automation subcategories, and authors", () => {
  const entries = parseReadmeEntries(`# Catalog

## Skills

### Development & Code Tools
- [Local Tool](./local-tool/) - Useful local tool. *By [@maker](https://github.com/maker)*

### App Automation via Composio
**CRM & Sales**
- [HubSpot Automation](./hubspot-automation/) - Automate contacts.

## Getting Started
- [Ignored](https://example.com) - Outside the skills section.
`);

  assert.equal(entries.length, 2);
  assert.deepEqual(
    entries.map(({ name, category, kind, author }) => ({ name, category, kind, author })),
    [
      { name: "Local Tool", category: "Development & Code Tools", kind: "curated", author: "@maker" },
      { name: "HubSpot Automation", category: "CRM & Sales", kind: "automation", author: null },
    ],
  );
});

test("slug and GitHub URL helpers produce portable values", () => {
  assert.equal(normalizeSlug("  C++ & Café / أدوات  "), "c-plus-plus-and-cafe-ادوات");
  assert.equal(
    githubFileUrl("https://github.com/acme/catalog", "abc123", "skills/My Skill/SKILL.md"),
    "https://github.com/acme/catalog/blob/abc123/skills/My%20Skill/SKILL.md",
  );
});

test("generateCatalog merges README entries with local skills and detects resources", async (t) => {
  const fixture = await fs.mkdtemp(path.join(os.tmpdir(), "skills-sync-"));
  t.after(() => fs.rm(fixture, { recursive: true, force: true }));

  await fs.mkdir(path.join(fixture, "local-tool", "scripts"), { recursive: true });
  await fs.mkdir(path.join(fixture, "local-tool", "references"), { recursive: true });
  await fs.mkdir(path.join(fixture, "local-tool", "assets"), { recursive: true });
  await fs.mkdir(path.join(fixture, "composio-skills", "hubspot-automation"), { recursive: true });

  await Promise.all([
    fs.writeFile(path.join(fixture, "README.md"), `# Fixture

## Skills

### Development & Code Tools
- [Local Tool](./local-tool/) - README description. *By [@maker](https://github.com/maker)*
- [Remote Tool](https://github.com/remote/tool) - External description.

### App Automation via Composio
**CRM & Sales**
- [HubSpot Automation](./hubspot-automation/) - Manage contacts and deals.

## Getting Started
`, "utf8"),
    fs.writeFile(path.join(fixture, "local-tool", "SKILL.md"), `---
name: local-tool
description: Longer frontmatter description.
license: MIT
---
# Local Tool
`, "utf8"),
    fs.writeFile(path.join(fixture, "local-tool", "scripts", "run.mjs"), "", "utf8"),
    fs.writeFile(path.join(fixture, "local-tool", "references", "guide.md"), "", "utf8"),
    fs.writeFile(path.join(fixture, "local-tool", "assets", "icon.svg"), "", "utf8"),
    fs.writeFile(path.join(fixture, "local-tool", "LICENSE.txt"), "MIT", "utf8"),
    fs.writeFile(path.join(fixture, "composio-skills", "hubspot-automation", "SKILL.md"), `---
name: hubspot-automation
description: Generic automation description.
---
# HubSpot Automation via Rube MCP
`, "utf8"),
  ]);

  const result = await generateCatalog({
    sourceDirectory: fixture,
    repository: "acme/catalog",
    commit: "abc123",
    ref: "abc123",
    commitDate: "2026-07-24T00:00:00Z",
    syncedAt: "2026-07-26T00:00:00.000Z",
  });

  assert.equal(result.snapshot.total, 3);
  assert.equal(result.snapshot.internal, 2);
  assert.equal(result.snapshot.external, 1);
  assert.equal(result.snapshot.curated, 2);
  assert.equal(result.snapshot.automation, 1);
  assert.equal(result.snapshot.mergedReadmeEntries, 2);
  assert.equal(result.snapshot.issues.unresolvedInternalLinks, 0);

  const local = result.skills.find((skill) => skill.slug === "local-tool");
  assert.equal(local.description, "README description.");
  assert.equal(local.author, "@maker");
  assert.equal(local.sourceType, "internal");
  assert.equal(local.repositoryPath, "local-tool/SKILL.md");
  assert.equal(local.hasScripts, true);
  assert.equal(local.hasReferences, true);
  assert.equal(local.hasAssets, true);
  assert.equal(local.license, "MIT");
  assert.equal(local.featured, true);
  assert.match(local.sourceUrl, /\/blob\/abc123\/local-tool\/SKILL\.md$/);

  const automation = result.skills.find((skill) => skill.name === "HubSpot Automation");
  assert.equal(automation.category, "CRM & Sales");
  assert.equal(automation.kind, "automation");
  assert.equal(automation.repositoryPath, "composio-skills/hubspot-automation/SKILL.md");

  const external = result.skills.find((skill) => skill.name === "Remote Tool");
  assert.equal(external.author, "@remote");
  assert.equal(external.sourceUrl, "https://github.com/remote/tool");
});

test("unresolved README records keep stable IDs when the upstream commit changes", async (t) => {
  const fixture = await fs.mkdtemp(path.join(os.tmpdir(), "skills-sync-id-"));
  t.after(() => fs.rm(fixture, { recursive: true, force: true }));
  await fs.writeFile(path.join(fixture, "README.md"), `## Skills

### Development & Code Tools
- [Coming Soon](./coming-soon/) - Listed before its directory exists.

## Getting Started
`, "utf8");

  const common = {
    sourceDirectory: fixture,
    repository: "acme/catalog",
    commitDate: "2026-07-24T00:00:00Z",
    syncedAt: "2026-07-26T00:00:00.000Z",
  };
  const first = await generateCatalog({ ...common, commit: "first", ref: "first" });
  const second = await generateCatalog({ ...common, commit: "second", ref: "second" });

  assert.equal(first.skills[0].id, second.skills[0].id);
  assert.notEqual(first.skills[0].sourceUrl, second.skills[0].sourceUrl);
  assert.equal(first.skills[0].repositoryPath, null);
  assert.equal(first.snapshot.issues.unresolvedInternalLinks, 1);
});
