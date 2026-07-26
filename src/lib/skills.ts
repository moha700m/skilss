import rawSkills from "@/data/skills.generated.json";
import rawSnapshot from "@/data/snapshot.generated.json";
import type { Skill, SkillsSnapshot } from "@/lib/types";

export const skills = rawSkills as Skill[];
export const snapshot = rawSnapshot as SkillsSnapshot;

export function getSkillBySlug(slug: string) {
  return skills.find((skill) => skill.slug === slug);
}

export function getFeaturedSkills(limit = 6) {
  const selected = skills.filter((skill) => skill.featured);
  return (selected.length >= limit ? selected : skills).slice(0, limit);
}

export function getRelatedSkills(skill: Skill, limit = 4) {
  return skills
    .filter(
      (candidate) =>
        candidate.id !== skill.id &&
        (candidate.category === skill.category || candidate.kind === skill.kind),
    )
    .slice(0, limit);
}

export function getInstallCommand(skill: Skill) {
  if (!skill.repositoryPath) return null;

  const directory = skill.repositoryPath.replace(/\/SKILL\.md$/i, "");
  const targetName = directory.split("/").at(-1) ?? skill.slug;

  return [
    "git clone --depth 1 https://github.com/ComposioHQ/awesome-claude-skills.git",
    "mkdir -p ~/.config/claude-code/skills",
    `cp -R awesome-claude-skills/${directory} ~/.config/claude-code/skills/${targetName}`,
  ].join("\n");
}

export async function getSkillMarkdown(skill: Skill) {
  if (skill.sourceType !== "internal" || !skill.repositoryPath) return null;

  const declaredLicense = skill.license ?? "";
  const openLicensePatterns = [
    /\bApache(?: License)?[- ]?2(?:\.0)?\b/i,
    /\bMIT\b/i,
    /\bA?GPL[- ]?[23](?:\.0)?\b/i,
    /\bBSD(?:[- ][23](?:-Clause)?)?\b/i,
    /\bMPL[- ]?2(?:\.0)?\b/i,
    /\bCC0[- ]?1(?:\.0)?\b/i,
  ];
  const isOpenLicense = openLicensePatterns.some((pattern) => pattern.test(declaredLicense));
  if (!isOpenLicense) return null;

  const markdownPath = /SKILL\.md$/i.test(skill.repositoryPath)
    ? skill.repositoryPath
    : `${skill.repositoryPath}/SKILL.md`;
  const encodedPath = markdownPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const rawUrl = `https://raw.githubusercontent.com/ComposioHQ/awesome-claude-skills/${snapshot.upstreamCommit}/${encodedPath}`;

  try {
    const response = await fetch(rawUrl, {
      next: { revalidate: 86_400 },
      headers: { Accept: "text/plain" },
    });

    if (!response.ok) return null;
    return response.text();
  } catch {
    return null;
  }
}
