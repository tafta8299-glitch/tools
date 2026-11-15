import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { access, chmod, mkdir, rename } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadableStream } from "node:stream/web";

const executableName = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";

function releaseAssetName() {
  if (process.platform === "win32") return "yt-dlp.exe";
  if (process.platform === "darwin") return "yt-dlp_macos";
  return process.arch === "arm64" ? "yt-dlp_linux_aarch64" : "yt-dlp_linux";
}

async function isExecutable(file: string) {
  try {
    await access(file, process.platform === "win32" ? constants.F_OK : constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function downloadYtDlp(target: string) {
  const url = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${releaseAssetName()}`;
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok || !response.body) {
    throw new Error(`Could not download yt-dlp (HTTP ${response.status}).`);
  }
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.download`;
  await pipeline(
    Readable.fromWeb(response.body as unknown as WebReadableStream),
    createWriteStream(temporary),
  );
  await chmod(temporary, 0o755);
  await rename(temporary, target);
}

let resolving: Promise<string> | undefined;

/**
 * Finds the standalone yt-dlp executable: YT_DLP_PATH, then the copy installed by
 * scripts/install-yt-dlp.mjs, then a copy cached under `.data/bin` (downloaded on
 * first use if none exists).
 */
export function resolveYtDlp(): Promise<string> {
  resolving ??= (async () => {
    if (process.env.YT_DLP_PATH) return process.env.YT_DLP_PATH;

    const installed = path.join(process.cwd(), "bin", executableName);
    if (await isExecutable(installed)) return installed;

    const cached = path.join(process.cwd(), ".data", "bin", executableName);
    if (!(await isExecutable(cached))) await downloadYtDlp(cached);
    return cached;
  })().catch((error: unknown) => {
    resolving = undefined;
    throw error;
  });
  return resolving;
}

export type YtDlpProcess = Promise<{ stdout: string }> & {
  stdout: NodeJS.ReadableStream | null;
  stderr: NodeJS.ReadableStream | null;
  kill: () => void;
};

const maxCapturedStdout = 32 * 1024 * 1024;

/**
 * Runs yt-dlp. Rejects with an Error carrying `stderr` on a non-zero exit or timeout.
 * With `captureStdout`, the resolved value holds everything yt-dlp printed.
 */
export function runYtDlp(
  binary: string,
  args: string[],
  { captureStdout = false, timeoutMs }: { captureStdout?: boolean; timeoutMs?: number } = {},
): YtDlpProcess {
  const child = spawn(binary, args, { windowsHide: true });
  let stderr = "";
  const stdoutChunks: Buffer[] = [];
  let stdoutLength = 0;
  let timedOut = false;

  child.stderr.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
    if (stderr.length > 64_000) stderr = stderr.slice(-64_000);
  });
  if (captureStdout) {
    child.stdout.on("data", (chunk: Buffer) => {
      stdoutLength += chunk.length;
      if (stdoutLength <= maxCapturedStdout) stdoutChunks.push(chunk);
    });
  }

  const timer = timeoutMs
    ? setTimeout(() => {
        timedOut = true;
        child.kill();
      }, timeoutMs)
    : undefined;

  const done = new Promise<{ stdout: string }>((resolve, reject) => {
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("close", (code) => {
      clearTimeout(timer);
      if (code === 0 && !timedOut) {
        resolve({ stdout: Buffer.concat(stdoutChunks).toString("utf8") });
        return;
      }
      const message = timedOut ? "yt-dlp timed out" : `yt-dlp exited with code ${code}`;
      reject(Object.assign(new Error(message), { stderr, exitCode: code }));
    });
  });

  return Object.assign(done, {
    stdout: child.stdout,
    stderr: child.stderr,
    kill: () => {
      child.kill();
    },
  });
}
