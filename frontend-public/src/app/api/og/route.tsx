import { ImageResponse } from "next/og";

export const runtime = "edge";

const BRAND_BLUE = "#1d4ed8";
const BRAND_DARK = "#1e293b";
const BRAND_GRAY = "#64748b";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") ?? "Khoa Vật lý - HCMUS").slice(
    0,
    140,
  );
  const subtitle = (
    searchParams.get("subtitle") ??
    "Khoa Vật lý - Vật lý Kỹ thuật, ĐHQG TP.HCM"
  ).slice(0, 200);
  const slug = searchParams.get("slug") ?? "";

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)",
        padding: "60px 80px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: BRAND_BLUE,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            fontWeight: "bold",
          }}
        >
          PHY
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: BRAND_DARK,
            }}
          >
            Khoa Vật lý - HCMUS
          </div>
          <div style={{ fontSize: "18px", color: BRAND_GRAY }}>
            phys.hcmus.edu.vn
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <div
          style={{
            fontSize: title.length > 80 ? "56px" : "72px",
            fontWeight: "bold",
            color: BRAND_DARK,
            lineHeight: 1.1,
            letterSpacing: "-1px",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: "28px",
            color: BRAND_GRAY,
            lineHeight: 1.3,
          }}
        >
          {subtitle}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "20px",
          color: BRAND_GRAY,
        }}
      >
        <div>{slug ? `/${slug}` : "Trang chủ"}</div>
        <div
          style={{
            background: BRAND_BLUE,
            color: "white",
            padding: "10px 24px",
            borderRadius: "999px",
            fontWeight: "bold",
          }}
        >
          phys.hcmus.edu.vn
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
  );
}
