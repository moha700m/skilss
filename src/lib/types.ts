export type Locale = "ar" | "en";

export type SkillKind = "curated" | "automation";
export type SkillSourceType = "internal" | "external";

export interface Skill {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  kind: SkillKind;
  sourceType: SkillSourceType;
  sourceUrl: string;
  repositoryPath: string | null;
  author: string | null;
  hasScripts: boolean;
  hasReferences: boolean;
  hasAssets: boolean;
  license: string | null;
  featured: boolean;
  searchText: string;
}
export interface SkillsSnapshot {
  total: number;
  curated: number;
  automation: number;
  internal: number;
  external: number;
  categories: string[];
  syncedAt: string;
  upstreamCommit: string;
  upstreamCommitDate: string;
}
