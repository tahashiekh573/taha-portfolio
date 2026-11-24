import { ImageResponse } from "next/og";
import { getSiteContent } from "@/lib/content";

export const alt = "Muhammad Taha — AI/ML Engineer & Software Developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const { profile } = await getSiteContent();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "radial-gradient(circle at 20% 0%, #1e3a8a 0%, #060a16 55%), #060a16",
          color: "#e8ecf6",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30, color: "#a3adc2" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            MT
          </div>
          Taha.dev
        </div>
        <div style={{ marginTop: 48, fontSize: 84, fontWeight: 700, letterSpacing: -2, display: "flex" }}>{profile.name}</div>
        <div
          style={{
            marginTop: 16,
            fontSize: 40,
            backgroundImage: "linear-gradient(90deg,#60a5fa,#a78bfa)",
            backgroundClip: "text",
            color: "transparent",
            display: "flex",
          }}
        >
          AI/ML Engineer · Software Engineer · AI Agent Developer
        </div>
        <div style={{ marginTop: 36, fontSize: 28, color: "#a3adc2", display: "flex" }}>{profile.location}</div>
      </div>
    ),
    size,
  );
}
