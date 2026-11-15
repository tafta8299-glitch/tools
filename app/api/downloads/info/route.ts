import {
  describeMediaError,
  isModeAllowed,
  isSocialDownloadMode,
  isSocialPlatformId,
  lookupMedia,
  maxCollectionOffset,
  validateMediaUrl,
} from "@/lib/social-media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Reads title, thumbnail and preview details for links. Nothing is downloaded. */
export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { platform, mode, urls: rawUrls, offset: rawOffset } = payload ?? {};
  const offset = rawOffset === undefined ? 0 : rawOffset;
  if (!Number.isInteger(offset) || (offset as number) < 0 || (offset as number) > maxCollectionOffset) {
    return Response.json({ error: "Invalid page offset." }, { status: 400 });
  }
  if (!isSocialPlatformId(platform) || !isSocialDownloadMode(mode) || !Array.isArray(rawUrls)) {
    return Response.json({ error: "A platform, mode, and list of URLs are required." }, { status: 400 });
  }
  if (!isModeAllowed(platform, mode)) {
    return Response.json(
      {
        error:
          mode === "profile"
            ? "Whole profiles can't be listed for this site. Paste links to the posts you want instead."
            : "Choose a mode supported by the selected platform.",
      },
      { status: 400 },
    );
  }

  const isSingleUrlMode = platform === "website" || mode === "profile" || mode === "channel";
  if (!rawUrls.length || (isSingleUrlMode && rawUrls.length !== 1)) {
    return Response.json(
      { error: isSingleUrlMode ? "Paste one link at a time in this mode." : "Paste at least one link." },
      { status: 400 },
    );
  }

  const urls = await Promise.all(rawUrls.map((url: unknown) => validateMediaUrl(url, platform)));
  if (urls.some((url) => url === undefined)) {
    return Response.json(
      {
        error:
          platform === "website"
            ? "Enter a link to a public webpage, starting with http:// or https://."
            : "One or more links are not from this site. Check the links and try again.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await lookupMedia({
      platform,
      mode,
      urls: urls as string[],
      offset: offset as number,
    });
    if (!result.items.length) {
      return Response.json(
        { error: result.failed[0]?.error ?? "No downloadable media was found for this link." },
        { status: 422 },
      );
    }
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Media lookup failed.", error);
    return Response.json({ error: describeMediaError(error, platform, mode) }, { status: 422 });
  }
}
