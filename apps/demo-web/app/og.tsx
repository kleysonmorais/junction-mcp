import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

export function renderOgImage(title: string, subtitle: string) {
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
          background: "#fdfefe",
          backgroundImage:
            "radial-gradient(circle at 85% 15%, rgba(61,24,54,0.12), transparent 55%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#3d1836",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#fdfefe",
                display: "flex",
              }}
            />
          </div>
          <span style={{ fontSize: 30, fontWeight: 600, color: "#141417" }}>
            junction-mcp
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 64,
            maxWidth: 920,
          }}
        >
          <span
            style={{
              fontSize: 60,
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "#141417",
            }}
          >
            {title}
          </span>
          <span
            style={{
              marginTop: 24,
              fontSize: 28,
              lineHeight: 1.5,
              color: "#5a5a63",
            }}
          >
            {subtitle}
          </span>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
