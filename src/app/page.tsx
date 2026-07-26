import { HomeContent } from "@/components/home-content";
import { getFeaturedSkills, skills, snapshot } from "@/lib/skills";

export default function HomePage() {
  const categoryCounts = [...skills.reduce((counts, skill) => {
    counts.set(skill.category, (counts.get(skill.category) ?? 0) + 1);
    return counts;
  }, new Map<string, number>())]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <HomeContent
      featured={getFeaturedSkills(6)}
      snapshot={snapshot}
      categoryCounts={categoryCounts}
    />
  );
}
