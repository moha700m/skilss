#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_REPOSITORY = "https://github.com/ComposioHQ/awesome-claude-skills";
const DEFAULT_OUTPUT = path.join("src", "data");
const IGNORED_DIRECTORIES = new Set([".git", ".next", "node_modules"]);
const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

function toPosix(value) {
  return value.replaceAll(path.sep, "/").replaceAll("\\", "/");
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (trimmed.length < 2) return trimmed;

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }

  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replaceAll("''", "'");
  }

  return trimmed;
}

export function parseFrontmatter(markdown) {
  const normalized = markdown.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  const attributes = {};

  if (lines[0]?.trim() !== "---") {
    return { attributes, body: normalized, hasFrontmatter: false };
  }

  const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (closingIndex === -1) {
    return { attributes, body: normalized, hasFrontmatter: false };
  }

  for (let index = 1; index < closingIndex; index += 1) {
    const match = lines[index].match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (rawValue === ">" || rawValue === "|" || rawValue === ">-" || rawValue === "|-") {
      const block = [];
      while (index + 1 < closingIndex && (/^\s+/.test(lines[index + 1]) || lines[index + 1] === "")) {
        index += 1;
        block.push(lines[index].replace(/^\s{1,4}/, ""));
      }
      attributes[key] = rawValue.startsWith(">") ? block.join(" ") : block.join("\n");
    } else {
      attributes[key] = parseScalar(rawValue);
    }
  }

  return {
    attributes,
    body: lines.slice(closingIndex + 1).join("\n").trimStart(),
    hasFrontmatter: true,
  };
}

function stripMarkdown(value) {
  return String(value ?? "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[`*_~]/g, "")
    .replace(/\\([\\`*_[\]{}()#+\-.!])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value, maximum = 640) {
  if (value.length <= maximum) return value;
  const shortened = value.slice(0, maximum - 1);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace > maximum * 0.7 ? lastSpace : shortened.length).trim()}…`;
}

function cleanDescription(value) {
  return truncate(stripMarkdown(value));
}

export function normalizeSlug(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .replace(/\+/g, " plus ")
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function humanizeSlug(value) {
  const words = String(value ?? "")
    .replace(/^[-_]+/, "")
    .split(/[-_\s]+/)
    .filter(Boolean);
  return words.map((word) => word.charAt(0).toLocaleUpperCase("en") + word.slice(1)).join(" ");
}

function extractTitle(body, fallback) {
  const heading = body.match(/^#\s+(.+)$/m)?.[1];
  if (!heading) return humanizeSlug(fallback);
  return stripMarkdown(heading)
    .replace(/\s+via\s+Rube\s+MCP$/i, "")
    .replace(/\s+Skill$/i, "")
    .trim();
}

function fallbackDescription(body) {
  const paragraphs = body.replace(/```[\s\S]*?```/g, "").split(/\n\s*\n/);
  for (const paragraph of paragraphs) {
    if (/^\s*(#|[-*]\s|\d+\.\s)/.test(paragraph)) continue;
    const cleaned = cleanDescription(paragraph);
    if (cleaned.length >= 24) return cleaned;
  }
  return "No description provided by the upstream skill.";
}

function extractAuthor(description) {
  const linked = description.match(/\s*\*By\s+\[([^\]]+)\]\(([^)]+)\)\*\.?\s*$/i);
  if (linked) {
    return {
      author: stripMarkdown(linked[1]) || null,
      description: description.slice(0, linked.index).trim(),
    };
  }

  const plain = description.match(/\s*\*By\s+([^*]+)\*\.?\s*$/i);
  if (plain) {
    return {
      author: stripMarkdown(plain[1]) || null,
      description: description.slice(0, plain.index).trim(),
    };
  }

  return { author: null, description };
}

export function parseReadmeEntries(markdown) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const entries = [];
  let inSkillsSection = false;
  let sectionCategory = null;
  let subcategory = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (line === "## Skills") {
      inSkillsSection = true;
      continue;
    }
    if (inSkillsSection && /^##\s+/.test(line)) break;
    if (!inSkillsSection) continue;

    const heading = line.match(/^###\s+(.+)$/);
    if (heading) {
      sectionCategory = stripMarkdown(heading[1]);
      subcategory = null;
      continue;
    }

    const strongHeading = line.match(/^\*\*([^*]+)\*\*$/);
    if (strongHeading) {
      subcategory = stripMarkdown(strongHeading[1]);
      continue;
    }

    const item = line.match(/^-\s+\[([^\]]+)\]\(([^)]+)\)\s*(?:-\s*)?(.*)$/);
    if (!item || !sectionCategory) continue;

    const [, rawName, rawHref, rawDescription] = item;
    const authorParts = extractAuthor(rawDescription);
    const isAutomation = sectionCategory === "App Automation via Composio";
    entries.push({
      name: stripMarkdown(rawName),
      href: rawHref.trim(),
      description: cleanDescription(authorParts.description),
      author: authorParts.author,
      category: isAutomation ? subcategory || sectionCategory : sectionCategory,
      sectionCategory,
      kind: isAutomation ? "automation" : "curated",
      lineNumber: index + 1,
    });
  }

  return entries;
}

async function walkFiles(rootDirectory) {
  const files = [];

  async function visit(absoluteDirectory, relativeDirectory = "") {
    const entries = await fs.readdir(absoluteDirectory, { withFileTypes: true });
    entries.sort((left, right) => collator.compare(left.name, right.name));

    for (const entry of entries) {
      const relativePath = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) {
          await visit(path.join(absoluteDirectory, entry.name), relativePath);
        }
      } else if (entry.isFile()) {
        files.push(relativePath);
      }
    }
  }

  await visit(rootDirectory);
  return files;
}

function groupFilesByOwningSkill(allFiles, skillDirectories) {
  const groups = new Map([...skillDirectories].map((directory) => [directory, []]));

  for (const file of allFiles) {
    let current = path.posix.dirname(file);
    while (current && current !== ".") {
      if (skillDirectories.has(current)) {
        groups.get(current).push(file);
        break;
      }
      current = path.posix.dirname(current);
    }
    if (skillDirectories.has(".") && current === ".") groups.get(".").push(file);
  }

  return groups;
}

function encodeGitHubPath(repositoryPath) {
  return repositoryPath.split("/").map((segment) => encodeURIComponent(segment)).join("/");
}

export function githubFileUrl(repository, ref, repositoryPath, lineNumber = null) {
  const encodedPath = encodeGitHubPath(repositoryPath);
  return `${repository}/blob/${encodeURIComponent(ref)}/${encodedPath}${lineNumber ? `#L${lineNumber}` : ""}`;
}

function normalizeRepository(value) {
  if (!value) return DEFAULT_REPOSITORY;
  const trimmed = value.trim().replace(/\.git$/, "").replace(/\/$/, "");
  if (/^[\w.-]+\/[\w.-]+$/.test(trimmed)) return `https://github.com/${trimmed}`;

  const githubMatch = trimmed.match(/github\.com[/:]([^/]+)\/([^/]+)$/i);
  if (githubMatch) return `https://github.com/${githubMatch[1]}/${githubMatch[2]}`;
  return trimmed;
}

function runGit(sourceDirectory, args) {
  try {
    return execFileSync("git", ["-C", sourceDirectory, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

export function getGitMetadata(sourceDirectory, overrides = {}) {
  const remote = overrides.repository || runGit(sourceDirectory, ["remote", "get-url", "origin"]);
  const commit = overrides.commit || runGit(sourceDirectory, ["rev-parse", "HEAD"]) || process.env.GITHUB_SHA || "unknown";
  const commitDate = overrides.commitDate || runGit(sourceDirectory, ["show", "-s", "--format=%cI", "HEAD"]);
  return {
    repository: normalizeRepository(remote || DEFAULT_REPOSITORY),
    commit,
    commitDate: commitDate || null,
    ref: overrides.ref || commit || "main",
  };
}

function normalizeRelativeHref(href) {
  if (/^[A-Za-z][A-Za-z\d+.-]*:/.test(href) || href.startsWith("//") || href.startsWith("#")) {
    return null;
  }

  let decoded = href.split(/[?#]/, 1)[0].replaceAll("\\", "/");
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // Keep malformed but still useful upstream paths as-is.
  }
  decoded = decoded.replace(/^\.\//, "").replace(/^\/+/, "").replace(/\/+$/, "");
  const normalized = path.posix.normalize(decoded);
  return normalized === "." || normalized.startsWith("../") ? null : normalized;
}

function inferAuthorFromUrl(value) {
  try {
    const parsed = new URL(value);
    if (parsed.hostname.toLocaleLowerCase("en") !== "github.com") return null;
    const owner = parsed.pathname.split("/").filter(Boolean)[0];
    return owner ? `@${owner}` : null;
  } catch {
    return null;
  }
}

function addToIndex(index, key, value) {
  if (!key) return;
  const values = index.get(key) || [];
  if (!values.includes(value)) values.push(value);
  index.set(key, values);
}

function singleMatch(index, key) {
  const matches = index.get(key) || [];
  return matches.length === 1 ? matches[0] : null;
}

function resourceFlags(skillDirectory, files) {
  const relativeFiles = files.map((file) => path.posix.relative(skillDirectory, file));
  const licenseCandidates = relativeFiles
    .filter((file) => /^(?:license|licence)(?:\..+)?$|^(?:copying|notice)(?:\..+)?$/i.test(path.posix.basename(file)))
    .sort((left, right) => left.split("/").length - right.split("/").length || collator.compare(left, right));

  return {
    hasScripts: relativeFiles.some((file) => file.split("/").slice(0, -1).some((part) => part.toLocaleLowerCase("en") === "scripts")),
    hasReferences: relativeFiles.some((file) => {
      const lowerParts = file.toLocaleLowerCase("en").split("/");
      return lowerParts.slice(0, -1).some((part) => part === "references" || part === "reference") || /^(?:references?)\./.test(lowerParts.at(-1));
    }),
    hasAssets: relativeFiles.some((file) => file.split("/").slice(0, -1).some((part) => {
      const lower = part.toLocaleLowerCase("en");
      return lower === "assets" || lower === "asset";
    })),
    licensePath: licenseCandidates[0] || null,
  };
}

function stableHash(value, length = 14) {
  return createHash("sha256").update(value).digest("hex").slice(0, length);
}

function searchText(skill) {
  return [skill.name, skill.description, skill.category, skill.author, skill.slug]
    .filter(Boolean)
    .join(" ")
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .toLocaleLowerCase("en")
    .replace(/\s+/g, " ")
    .trim();
}

function publicSkill(skill) {
  return {
    id: skill.id,
    slug: skill.slug,
    name: skill.name,
    description: skill.description,
    category: skill.category,
    kind: skill.kind,
    sourceType: skill.sourceType,
    sourceUrl: skill.sourceUrl,
    repositoryPath: skill.repositoryPath,
    author: skill.author,
    hasScripts: skill.hasScripts,
    hasReferences: skill.hasReferences,
    hasAssets: skill.hasAssets,
    license: skill.license,
    featured: skill.featured,
    searchText: searchText(skill),
  };
}

function assignUniqueSlugs(skills) {
  const counts = new Map();
  for (const skill of skills) {
    const base = normalizeSlug(skill.name) || normalizeSlug(skill._metadataName) || "skill";
    counts.set(base, (counts.get(base) || 0) + 1);
    skill._baseSlug = base;
  }

  for (const skill of skills) {
    const canonical = skill._canonicalKey || skill.repositoryPath || skill.sourceUrl || skill.name;
    skill.slug = counts.get(skill._baseSlug) === 1
      ? skill._baseSlug
      : `${skill._baseSlug}-${stableHash(canonical, 7)}`;
    skill.id = `skill-${stableHash(`${skill.sourceType}:${canonical}`)}`;
  }
}

function matchReadmeEntry(entry, indexes) {
  const relativeHref = normalizeRelativeHref(entry.href);
  if (relativeHref) {
    let candidateDirectory = relativeHref;
    if (/\/SKILL\.md$/i.test(candidateDirectory)) candidateDirectory = path.posix.dirname(candidateDirectory);
    const direct = indexes.byDirectory.get(candidateDirectory)
      || indexes.byDirectory.get(`composio-skills/${candidateDirectory}`);
    if (direct) return direct;

    const directoryName = path.posix.basename(candidateDirectory);
    const byDirectoryName = singleMatch(indexes.byDirectoryName, normalizeSlug(directoryName));
    if (byDirectoryName) return byDirectoryName;
  }

  const byName = singleMatch(indexes.byName, normalizeSlug(entry.name));
  if (byName) return byName;

  if (!relativeHref) {
    try {
      const pathname = new URL(entry.href).pathname.replace(/\/$/, "");
      const urlName = pathname.split("/").filter(Boolean).at(-1);
      const byUrlName = singleMatch(indexes.byName, normalizeSlug(urlName));
      if (byUrlName) return byUrlName;
    } catch {
      // Non-URL external references remain standalone README entries.
    }
  }

  return null;
}

function unresolvedReadmeSkill(entry, gitMetadata) {
  const relativeHref = normalizeRelativeHref(entry.href);
  const sourceType = relativeHref ? "internal" : "external";
  const sourceUrl = sourceType === "external"
    ? entry.href
    : githubFileUrl(gitMetadata.repository, gitMetadata.ref, "README.md", entry.lineNumber);

  return {
    _canonicalKey: relativeHref ? `readme:${relativeHref}` : `external:${entry.href.replace(/\/$/, "")}`,
    _metadataName: entry.name,
    name: entry.name,
    description: entry.description || "No description provided in the upstream README.",
    category: entry.category,
    kind: entry.kind,
    sourceType,
    sourceUrl,
    repositoryPath: null,
    author: entry.author || (sourceType === "external" ? inferAuthorFromUrl(entry.href) : null),
    hasScripts: false,
    hasReferences: false,
    hasAssets: false,
    license: null,
    featured: false,
  };
}

function deduplicateStandaloneEntries(skills, issues) {
  const seen = new Map();
  const deduplicated = [];

  for (const skill of skills) {
    if (skill.repositoryPath) {
      deduplicated.push(skill);
      continue;
    }

    const key = `${skill.sourceType}:${skill.sourceUrl.replace(/\/$/, "")}:${normalizeSlug(skill.name)}`;
    if (!seen.has(key)) {
      seen.set(key, skill);
      deduplicated.push(skill);
      continue;
    }

    issues.duplicateReadmeEntries.push(skill.name);
    const existing = seen.get(key);
    if (!existing.description && skill.description) existing.description = skill.description;
    if (!existing.author && skill.author) existing.author = skill.author;
  }

  return deduplicated;
}

export async function generateCatalog({
  sourceDirectory,
  repository,
  ref,
  commit,
  commitDate,
  syncedAt,
  previousSnapshot = null,
} = {}) {
  if (!sourceDirectory) throw new Error("sourceDirectory is required");
  const source = path.resolve(sourceDirectory);
  const readmePath = path.join(source, "README.md");
  const [readme, allFiles] = await Promise.all([
    fs.readFile(readmePath, "utf8"),
    walkFiles(source),
  ]);

  const gitMetadata = getGitMetadata(source, { repository, ref, commit, commitDate });
  const readmeEntries = parseReadmeEntries(readme);
  const skillPaths = allFiles.filter((file) => path.posix.basename(file).toLocaleUpperCase("en") === "SKILL.MD");
  const skillDirectories = new Set(skillPaths.map((file) => path.posix.dirname(file)));
  const filesBySkill = groupFilesByOwningSkill(allFiles, skillDirectories);
  const issues = {
    missingFrontmatter: [],
    missingName: [],
    missingDescription: [],
    unresolvedInternalLinks: [],
    duplicateReadmeEntries: [],
    repeatedLocalMatches: [],
  };

  const localSkills = [];
  for (const repositoryPath of skillPaths) {
    const absolutePath = path.join(source, ...repositoryPath.split("/"));
    const markdown = await fs.readFile(absolutePath, "utf8");
    const parsed = parseFrontmatter(markdown);
    const directory = path.posix.dirname(repositoryPath);
    const directoryName = path.posix.basename(directory);
    const metadataName = stripMarkdown(parsed.attributes.name || directoryName);
    const flags = resourceFlags(directory, filesBySkill.get(directory) || []);
    const description = cleanDescription(parsed.attributes.description) || fallbackDescription(parsed.body);

    if (!parsed.hasFrontmatter) issues.missingFrontmatter.push(repositoryPath);
    if (!parsed.attributes.name) issues.missingName.push(repositoryPath);
    if (!parsed.attributes.description) issues.missingDescription.push(repositoryPath);

    localSkills.push({
      _canonicalKey: `repository:${repositoryPath}`,
      _directory: directory,
      _metadataName: metadataName,
      _readmeEntry: null,
      name: extractTitle(parsed.body, metadataName) || humanizeSlug(metadataName),
      description,
      category: directory.startsWith("composio-skills/") ? "More App Automations" : "Other Curated Skills",
      kind: directory.startsWith("composio-skills/") ? "automation" : "curated",
      sourceType: "internal",
      sourceUrl: githubFileUrl(gitMetadata.repository, gitMetadata.ref, repositoryPath),
      repositoryPath,
      author: stripMarkdown(parsed.attributes.author) || null,
      hasScripts: flags.hasScripts,
      hasReferences: flags.hasReferences,
      hasAssets: flags.hasAssets,
      license: stripMarkdown(parsed.attributes.license) || (flags.licensePath ? `See ${flags.licensePath}` : null),
      featured: false,
    });
  }

  const indexes = {
    byDirectory: new Map(),
    byDirectoryName: new Map(),
    byName: new Map(),
  };
  for (const skill of localSkills) {
    indexes.byDirectory.set(skill._directory, skill);
    addToIndex(indexes.byDirectoryName, normalizeSlug(path.posix.basename(skill._directory)), skill);
    addToIndex(indexes.byName, normalizeSlug(skill._metadataName), skill);
    addToIndex(indexes.byName, normalizeSlug(skill.name), skill);
  }

  const standalone = [];
  let mergedReadmeEntries = 0;
  for (const entry of readmeEntries) {
    const local = matchReadmeEntry(entry, indexes);
    if (!local) {
      const unresolved = unresolvedReadmeSkill(entry, gitMetadata);
      standalone.push(unresolved);
      if (unresolved.sourceType === "internal") {
        issues.unresolvedInternalLinks.push(`${entry.href} (README.md:${entry.lineNumber})`);
      }
      continue;
    }

    if (local._readmeEntry) {
      issues.repeatedLocalMatches.push(`${entry.name} -> ${local.repositoryPath}`);
      continue;
    }

    local._readmeEntry = entry;
    local.name = entry.name || local.name;
    local.description = entry.description || local.description;
    local.category = entry.category;
    local.kind = entry.kind;
    local.author = entry.author || local.author;
    local.featured = entry.kind === "curated";
    mergedReadmeEntries += 1;
  }

  let skills = deduplicateStandaloneEntries([...localSkills, ...standalone], issues);
  assignUniqueSlugs(skills);
  skills.sort((left, right) => {
    if (left.featured !== right.featured) return left.featured ? -1 : 1;
    if (left.kind !== right.kind) return left.kind === "curated" ? -1 : 1;
    return collator.compare(left.category, right.category) || collator.compare(left.name, right.name);
  });
  skills = skills.map(publicSkill);

  const categoryCountsMap = new Map();
  for (const skill of skills) categoryCountsMap.set(skill.category, (categoryCountsMap.get(skill.category) || 0) + 1);
  const categories = [...categoryCountsMap.keys()].sort(collator.compare);
  const issueCounts = Object.fromEntries(Object.entries(issues).map(([key, values]) => [key, values.length]));
  const effectiveSyncedAt = syncedAt
    || (previousSnapshot?.upstreamCommit === gitMetadata.commit ? previousSnapshot.syncedAt : null)
    || new Date().toISOString();

  const snapshot = {
    total: skills.length,
    curated: skills.filter((skill) => skill.kind === "curated").length,
    automation: skills.filter((skill) => skill.kind === "automation").length,
    internal: skills.filter((skill) => skill.sourceType === "internal").length,
    external: skills.filter((skill) => skill.sourceType === "external").length,
    categories,
    syncedAt: effectiveSyncedAt,
    upstreamCommit: gitMetadata.commit,
    upstreamCommitDate: gitMetadata.commitDate,
    categoryCounts: Object.fromEntries(categories.map((category) => [category, categoryCountsMap.get(category)])),
    sourceRepository: gitMetadata.repository,
    localSkillFiles: skillPaths.length,
    readmeEntries: readmeEntries.length,
    mergedReadmeEntries,
    issues: issueCounts,
  };

  return { skills, snapshot, issueDetails: issues };
}

async function readJsonIfPresent(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT" || error instanceof SyntaxError) return null;
    throw error;
  }
}

async function writeIfChanged(filePath, value) {
  const content = `${JSON.stringify(value, null, 2)}\n`;
  try {
    if (await fs.readFile(filePath, "utf8") === content) return false;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  await fs.writeFile(filePath, content, "utf8");
  return true;
}

function parseArguments(argv) {
  const options = { output: DEFAULT_OUTPUT, quiet: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument === "--quiet") options.quiet = true;
    else if (["--source", "--output", "--repo", "--ref", "--synced-at"].includes(argument)) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${argument} requires a value`);
      index += 1;
      if (argument === "--source") options.source = value;
      if (argument === "--output") options.output = value;
      if (argument === "--repo") options.repository = value;
      if (argument === "--ref") options.ref = value;
      if (argument === "--synced-at") options.syncedAt = value;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return options;
}

function usage() {
  return [
    "Generate the Claude Skills Hub metadata catalog.",
    "",
    "Usage:",
    "  node scripts/sync-skills.mjs --source <upstream-path> [options]",
    "",
    "Options:",
    "  --output <path>       Output directory (default: src/data)",
    "  --repo <owner/repo>   Override the inferred GitHub repository",
    "  --ref <git-ref>       Override the GitHub ref used in source links",
    "  --synced-at <iso>     Override the synchronization timestamp",
    "  --quiet               Suppress the summary",
    "  -h, --help            Show this help",
  ].join("\n");
}

async function runCli() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  if (!options.source) throw new Error("Missing required --source <upstream-path> argument");

  const outputDirectory = path.resolve(options.output);
  await fs.mkdir(outputDirectory, { recursive: true });
  const skillsPath = path.join(outputDirectory, "skills.generated.json");
  const snapshotPath = path.join(outputDirectory, "snapshot.generated.json");
  const previousSnapshot = await readJsonIfPresent(snapshotPath);
  const result = await generateCatalog({
    sourceDirectory: path.resolve(options.source),
    repository: options.repository,
    ref: options.ref,
    syncedAt: options.syncedAt,
    previousSnapshot,
  });

  const [skillsChanged, snapshotChanged] = await Promise.all([
    writeIfChanged(skillsPath, result.skills),
    writeIfChanged(snapshotPath, result.snapshot),
  ]);

  if (!options.quiet) {
    const { snapshot } = result;
    console.log(`Synced ${snapshot.total} skills (${snapshot.internal} internal, ${snapshot.external} external).`);
    console.log(`Curated: ${snapshot.curated}; automation: ${snapshot.automation}; categories: ${snapshot.categories.length}.`);
    console.log(`README entries: ${snapshot.readmeEntries}; merged with local files: ${snapshot.mergedReadmeEntries}.`);
    console.log(`Upstream: ${snapshot.upstreamCommit} (${snapshot.upstreamCommitDate || "date unavailable"}).`);
    console.log(`Output: ${toPosix(path.relative(process.cwd(), outputDirectory) || ".")} (${skillsChanged || snapshotChanged ? "updated" : "unchanged"}).`);

    const problems = Object.entries(result.issueDetails).filter(([, values]) => values.length > 0);
    if (problems.length) {
      console.warn("Warnings:");
      for (const [name, values] of problems) {
        console.warn(`- ${name}: ${values.length}`);
        for (const value of values.slice(0, 5)) console.warn(`  - ${value}`);
        if (values.length > 5) console.warn(`  - …and ${values.length - 5} more`);
      }
    }
  }
}

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) {
  runCli().catch((error) => {
    console.error(`sync-skills: ${error.message}`);
    process.exitCode = 1;
  });
}
