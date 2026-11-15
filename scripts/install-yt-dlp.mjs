// Downloads the standalone yt-dlp executable (bundles its own Python, so the
// host needs no Python install). Runs as a postinstall step and never fails the
// install: if the download fails, the app downloads it on first use instead.
import { chmod, mkdir, rename, stat } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";

function assetName() {
  if (process.platform === "win32") return "yt-dlp.exe";
  if (process.platform === "darwin") return "yt-dlp_macos";
  return process.arch === "arm64" ? "yt-dlp_linux_aarch64" : "yt-dlp_linux";
}

const target = path.join(
  process.cwd(),
  "bin",
  process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp",
);

async function main() {
  if (process.env.YT_DLP_SKIP_DOWNLOAD) return;
  try {
    await stat(target);
    console.log(`yt-dlp already present at ${target}`);
    return;
  } catch {}

  const url = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${assetName()}`;
  console.log(`Downloading ${url}`);
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status}`);
  }
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.download`;
  await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary));
  await chmod(temporary, 0o755);
  await rename(temporary, target);
  console.log(`yt-dlp installed at ${target}`);
}

main().catch((error) => {
  console.warn(`Could not download yt-dlp during install (${error.message}). It will be downloaded on first use.`);
});
