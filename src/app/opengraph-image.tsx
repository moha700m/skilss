import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SkillAtlas — Skills, mapped";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#111117",
          color: "#f7f4ed",
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 28, fontWeight: 700 }}>
          <div style={{ display: "flex", flexWrap: "wrap", width: 48, gap: 4 }}>
            {['#8b70f7', '#b9ef68', '#45c2d3', '#f7f4ed'].map((color) => (
              <div key={color} style={{ width: 20, height: 20, borderRadius: 5, background: color }} />
            ))}
          </div>
          SkillAtlas
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 950 }}>
          <div style={{ color: "#b9ef68", fontSize: 22, fontWeight: 600, marginBottom: 18 }}>
            SKILLS, MAPPED.
          </div>
          <div style={{ fontSize: 70, lineHeight: 1.05, letterSpacing: -3, fontWeight: 700 }}>
            Give your agent a new skill.
          </div>
          <div style={{ marginTop: 24, color: "#aaa6b5", fontSize: 28 }}>
            Discover, inspect, and install practical AI agent skills.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#777381", fontSize: 18 }}>
          <span>Arabic + English</span>
          <span>Powered by open catalog data</span>
        </div>
      </div>
    ),
    size,
  );
}
