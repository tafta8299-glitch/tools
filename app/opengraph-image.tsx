import { ImageResponse } from "next/og";

export const alt = "Trovflex Tools: free online tools for everyday tasks";
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
          padding: "76px 84px",
          backgroundColor: "#f5f7f4",
          color: "#17231d",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              backgroundColor: "#17231d",
              color: "#d9f36a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 38,
              fontWeight: 700,
            }}
          >
            t.
          </div>
          <div style={{ fontSize: 30, fontWeight: 700 }}>Trovflex Tools</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.08 }}>
            Free online tools.
          </div>
          <div style={{ fontSize: 38, color: "#476213" }}>Less busywork.</div>
        </div>
        <div style={{ fontSize: 24, color: "#66736b" }}>
          Image · PDF · Text · Developer tools
        </div>
      </div>
    ),
    size,
  );
}