import assert from "node:assert/strict";
import test from "node:test";

import { detectLocale, normalizeText, runAgent } from "../src/lib/agent/core.mjs";

function skill(overrides) {
  const name = overrides.name;
  const slug = overrides.slug ?? name.toLocaleLowerCase().replace(/\s+/g, "-");
  return {
    id: `skill-${slug}`,
    slug,
    name,
    description: "A practical catalog skill.",
    category: "Other Curated Skills",
    kind: "curated",
    sourceType: "internal",
    sourceUrl: `https://github.com/example/catalog/blob/abc/${slug}/SKILL.md`,
    repositoryPath: `${slug}/SKILL.md`,
    author: null,
    hasScripts: false,
    hasReferences: false,
    hasAssets: false,
    license: null,
    featured: false,
    searchText: `${name} ${overrides.description ?? ""} ${overrides.category ?? ""} ${slug}`,
    ...overrides,
  };
}

const fixtureSkills = [
  skill({
    name: "CSV Data Summarizer",
    description: "Analyzes CSV datasets and produces concise statistical summaries and insights.",
    category: "Analytics & Data",
    featured: true,
    hasScripts: true,
    license: "MIT",
  }),
  skill({
    name: "pdf",
    description: "Reads, creates, and inspects PDF documents.",
    category: "Document Processing",
    featured: true,
    license: "MIT",
  }),
  skill({
    name: "xlsx",
    description: "Creates and analyzes Excel spreadsheet workbooks.",
    category: "Spreadsheets & Databases",
    featured: true,
    license: "Apache-2.0",
  }),
  skill({
    name: "Gmail Automation",
    description: "Automates Gmail email sending, labels, search, and replies.",
    category: "Email",
    kind: "automation",
  }),
  skill({
    name: "Outlook Automation",
    description: "Automates Outlook email and inbox workflows.",
    category: "Email",
    kind: "automation",
  }),
  skill({
    name: "Twitter Algorithm Optimizer",
    description: "Analyzes posts and improves Twitter content for algorithmic reach.",
    category: "Social Media",
    license: "AGPL-3.0",
  }),
  skill({
    name: "Brand Guidelines",
    description: "Applies a brand's colors and typography to design artifacts.",
    category: "Business & Marketing",
    license: "Complete terms in LICENSE.txt",
  }),
  skill({
    name: "External Research Assistant",
    description: "Researches public web sources and prepares a cited report.",
    category: "Data & Analysis",
    sourceType: "external",
    sourceUrl: "https://github.com/example/research-assistant",
    repositoryPath: null,
  }),
];

const fixtureSnapshot = {
  total: fixtureSkills.length,
  curated: 6,
  automation: 2,
  internal: 7,
  external: 1,
  categories: [...new Set(fixtureSkills.map((item) => item.category))],
  syncedAt: "2026-07-26T01:23:23.547Z",
  upstreamCommit: "be2a406907dbc61b73e6827ded415c96139d13a2",
  upstreamCommitDate: "2026-07-24T07:48:01Z",
  categoryCounts: { Email: 2, "Analytics & Data": 1, "Document Processing": 1 },
};

function ask(content, previous = []) {
  return runAgent({
    messages: [...previous, { role: "user", content }],
    skills: fixtureSkills,
    snapshot: fixtureSnapshot,
  });
}

test("normalization handles Arabic variants and locale detection", () => {
  assert.equal(normalizeText("إِدَارَةُ الـمَلَفَّات"), "اداره الملفات");
  assert.equal(detectLocale("أحتاج تحليل بيانات"), "ar");
  assert.equal(detectLocale("Analyze a CSV"), "en");
});

test("Arabic task search expands intent terms and ranks catalog matches", () => {
  const response = ask("أريد مهارة لتحليل بيانات CSV");

  assert.equal(response.locale, "ar");
  assert.equal(response.meta.mode, "keyless");
  assert.equal(response.meta.intent, "search");
  assert.equal(response.matches[0].name, "CSV Data Summarizer");
  assert.ok(response.actions.some((action) => action.type === "open_skill"));
  assert.ok(response.actions.every((action) => ["navigate", "open_skill", "search", "favorite", "copy", "open_source"].includes(action.type)));
});

test("natural-language PDF recommendations preserve a precise skill identity", () => {
  const english = ask("best skill for PDF analysis");
  const arabic = ask("أفضل مهارة لتحليل PDF");

  assert.equal(english.matches[0]?.name, "pdf");
  assert.equal(arabic.matches[0]?.name, "pdf");
  assert.ok(english.actions.some((action) => action.href === "/skills/pdf"));
  assert.ok(arabic.actions.some((action) => action.href === "/skills/pdf"));
});

test("comparison resolves two named skills and returns separate open actions", () => {
  const response = ask("قارن بين pdf و xlsx");

  assert.equal(response.meta.intent, "compare");
  assert.deepEqual(response.matches.map((match) => match.name), ["pdf", "xlsx"]);
  assert.equal(response.actions.filter((action) => action.type === "open_skill").length, 2);
});

test("statistics and sync answers come from the injected catalog snapshot", () => {
  const stats = ask("كم مهارة في الدليل؟");
  const sync = ask("متى آخر مزامنة؟");

  assert.equal(stats.meta.intent, "stats");
  assert.equal(stats.meta.catalogTotal, fixtureSkills.length);
  assert.match(stats.reply, /مهارة/);
  assert.equal(sync.meta.intent, "sync");
  assert.equal(sync.meta.upstreamCommit, fixtureSnapshot.upstreamCommit);
  assert.ok(sync.actions.some((action) => action.href?.includes(fixtureSnapshot.upstreamCommit)));
});

test("license responses distinguish open, custom, and missing declarations", () => {
  const open = ask("ما ترخيص Twitter Algorithm Optimizer؟");
  const custom = ask("ترخيص Brand Guidelines");
  const missing = ask("license for Gmail Automation");

  assert.equal(open.meta.intent, "license");
  assert.match(open.reply, /AGPL-3\.0/);
  assert.match(custom.reply, /LICENSE\.txt/);
  assert.match(missing.reply, /does not record an explicit license/i);
  assert.ok(open.actions.some((action) => action.type === "open_source"));
});

test("install command is generated only for an in-repository skill", () => {
  const internal = ask("ثبت Twitter Algorithm Optimizer");
  const external = ask("install External Research Assistant");

  const copy = internal.actions.find((action) => action.type === "copy");
  assert.ok(copy?.text?.includes("git clone --depth 1"));
  assert.ok(copy?.text?.includes("twitter-algorithm-optimizer"));
  assert.equal(external.actions.some((action) => action.type === "copy"), false);
  assert.ok(external.actions.some((action) => action.type === "open_source"));
});

test("follow-up ordinals resolve a result from earlier assistant context", () => {
  const first = ask("email automation");
  const second = ask("أضف الثانية للمفضلة", [
    { role: "user", content: "email automation" },
    { role: "assistant", content: first.reply },
  ]);

  assert.equal(first.matches.length, 2);
  assert.equal(second.meta.intent, "favorite");
  assert.equal(second.matches[0].name, first.matches[1].name);
  assert.equal(second.actions.find((action) => action.type === "favorite")?.skillId, first.matches[1].id);
});

test("navigation produces an allowlisted internal path and output does not echo markup", () => {
  const navigation = ask("افتح دليل التعلم");
  const hostile = ask("<script>alert(1)</script>");

  assert.equal(navigation.meta.intent, "navigate");
  assert.deepEqual(navigation.actions[0], { type: "navigate", label: "اذهب إلى صفحة التعلّم", href: "/learn" });
  assert.doesNotMatch(hostile.reply, /[<>]/);
});

test("unsafe catalog paths and URL protocols never become executable actions", () => {
  const unsafe = skill({
    name: "Unsafe Fixture",
    repositoryPath: "../unsafe/SKILL.md",
    sourceUrl: "javascript:alert(1)",
  });
  const common = {
    skills: [unsafe],
    snapshot: { ...fixtureSnapshot, total: 1 },
  };
  const install = runAgent({
    ...common,
    messages: [{ role: "user", content: "install Unsafe Fixture" }],
  });
  const source = runAgent({
    ...common,
    messages: [{ role: "user", content: "open source for Unsafe Fixture" }],
  });

  assert.equal(install.actions.some((action) => action.type === "copy"), false);
  assert.equal(source.actions.some((action) => action.type === "open_source"), false);
  assert.ok(source.actions.every((action) => !action.href?.startsWith("javascript:")));
});
