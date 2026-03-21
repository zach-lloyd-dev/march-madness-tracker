import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "March Madness 2026 - NCAA Tournament Schedule & Scores";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #060d1f 0%, #0f1d3a 50%, #060d1f 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Glow orb */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(45,104,196,0.3) 0%, transparent 70%)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: "72px",
              fontWeight: 800,
              color: "white",
              letterSpacing: "-2px",
              display: "flex",
              gap: "16px",
            }}
          >
            <span>March Madness</span>
            <span style={{ color: "#4a90e2" }}>2026</span>
          </div>

          <div
            style={{
              fontSize: "28px",
              color: "#94a3b8",
              display: "flex",
              gap: "8px",
            }}
          >
            Every game. Every channel. Every stream.
          </div>

          <div
            style={{
              marginTop: "24px",
              display: "flex",
              gap: "16px",
            }}
          >
            {["Live Scores", "TV Channels", "Streaming", "Full Bracket"].map(
              (label) => (
                <div
                  key={label}
                  style={{
                    background: "rgba(45,104,196,0.15)",
                    border: "1px solid rgba(74,144,226,0.3)",
                    borderRadius: "12px",
                    padding: "10px 20px",
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#4a90e2",
                  }}
                >
                  {label}
                </div>
              )
            )}
          </div>

          <div
            style={{
              marginTop: "16px",
              fontSize: "16px",
              color: "#64748b",
            }}
          >
            marchmadness.zach-lloyd.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
