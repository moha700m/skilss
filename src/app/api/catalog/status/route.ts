import { snapshot } from "@/lib/skills";

export const revalidate = 86_400;

export function GET() {
  return Response.json(snapshot, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
