import { getProgress, isProgressToken } from "@/lib/download-progress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/downloads/status?token= — how far a browser download has got. */
export function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!isProgressToken(token)) {
    return Response.json({ error: "A valid token is required." }, { status: 400 });
  }
  const progress = getProgress(token);
  return Response.json(progress ?? { status: "unknown" }, {
    status: progress ? 200 : 404,
    headers: { "Cache-Control": "no-store" },
  });
}
