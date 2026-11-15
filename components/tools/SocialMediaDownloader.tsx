"use client";

import { useState } from "react";
import { ListVideo, LoaderCircle, Link2, Music2, Search, UserRound, Video } from "lucide-react";
import {
  socialPlatforms,
  type SocialDownloadMode,
  type SocialPlatformId,
} from "@/data/social-platforms";
import type { MediaLookup } from "@/lib/social-media";
import { MediaCard } from "./social-downloader/MediaCard";
import { SetBrowser } from "./social-downloader/SetBrowser";
import { downloadHref, itemKey } from "./social-downloader/utils";

export function SocialMediaDownloader({ platform }: { platform: SocialPlatformId }) {
  const config = socialPlatforms[platform];
  const [mode, setMode] = useState<SocialDownloadMode>(platform === "youtube" ? "video" : "links");
  const [input, setInput] = useState(platform === "website" ? config.placeholder : "");
  const [lookup, setLookup] = useState<MediaLookup>();
  const [lookupMode, setLookupMode] = useState<SocialDownloadMode>(mode);
  const [lookupUrls, setLookupUrls] = useState<string[]>([]);
  const [lookupVersion, setLookupVersion] = useState(0);
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState("");

  const urls = input.split(/\r?\n/u).map((url) => url.trim()).filter(Boolean);
  const isCollectionMode = mode === "profile" || mode === "channel";
  const isSingleUrlMode = isCollectionMode || platform === "website";
  const inputLabel =
    platform === "website"
      ? "Public webpage URL"
      : mode === "audio"
        ? "YouTube video links for audio"
        : mode === "video"
          ? "YouTube video links"
          : mode === "channel"
            ? "YouTube channel or playlist link"
            : mode === "profile"
              ? `${config.profileLabel} link`
              : "Media links";
  const modeOptions =
    platform === "website"
      ? [{ value: "links" as const, label: "Website URL", icon: Link2 }]
      : platform === "youtube"
        ? [
            { value: "audio" as const, label: "YouTube audio", icon: Music2 },
            { value: "video" as const, label: "YouTube video", icon: Video },
            { value: "channel" as const, label: "Channel", icon: ListVideo },
          ]
        : config.supportsProfile
          ? [
              { value: "links" as const, label: "Multiple links", icon: Link2 },
              { value: "profile" as const, label: config.profileLabel, icon: UserRound },
            ]
          : [{ value: "links" as const, label: `${config.name} links`, icon: Link2 }];

  async function requestLookup(
    lookupFor: { mode: SocialDownloadMode; urls: string[] },
    offset = 0,
  ) {
    const response = await fetch("/api/downloads/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, mode: lookupFor.mode, urls: lookupFor.urls, offset }),
    });
    const result = (await response.json()) as MediaLookup & { error?: string };
    if (!response.ok) throw new Error(result.error ?? "Could not read these links.");
    return result;
  }

  async function fetchMedia() {
    setLooking(true);
    setError("");
    setLookup(undefined);
    try {
      const result = await requestLookup({ mode, urls });
      setLookup(result);
      setLookupMode(mode);
      setLookupUrls(urls);
      setLookupVersion((version) => version + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not read these links.");
    } finally {
      setLooking(false);
    }
  }

  const isCollectionLookup = lookupMode === "profile" || lookupMode === "channel";
  const itemNoun =
    platform === "youtube" || platform === "tiktok" ? "video" : platform === "pinterest" ? "pin" : "item";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm leading-6 text-[var(--muted)]">
          {platform === "youtube"
            ? "Paste YouTube links or a channel, preview the videos, then download audio or video to your device."
            : platform === "website"
              ? "Paste a public webpage URL, preview the media found on it, then download it to your device."
              : `Paste public ${config.name} links, preview the media, then download it straight to your device.`}
        </p>
        {!config.supportsProfile && platform !== "website" ? (
          <p className="mt-3 rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-xs leading-5 text-[var(--muted)]">
            {config.name} only shows a full profile to people who are logged in, so whole profiles
            can&apos;t be downloaded here. Open each {config.postNoun} you want, copy its link, and
            paste the links below (up to 10 at once).
          </p>
        ) : null}
        <div
          className={`mt-5 grid ${modeOptions.length === 3 ? "grid-cols-3" : modeOptions.length === 1 ? "grid-cols-1" : "grid-cols-2"} gap-2 rounded-md bg-[var(--paper)] p-1`}
        >
          {modeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={mode === option.value}
                disabled={looking}
                onClick={() => {
                  setMode(option.value);
                  setError("");
                }}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded px-3 text-sm font-semibold transition-colors ${
                  mode === option.value
                    ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                <Icon aria-hidden="true" className="size-4" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label
          htmlFor={`${platform}-download-urls`}
          className="mb-2 block text-sm font-semibold text-[var(--ink)]"
        >
          {inputLabel}
        </label>
        <textarea
          id={`${platform}-download-urls`}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={
            platform === "website"
              ? config.placeholder
              : isCollectionMode
                ? `Paste a public ${mode === "channel" ? "YouTube channel or playlist" : config.profileLabel.toLowerCase()} link`
                : `${config.placeholder}\n${config.placeholder}`
          }
          rows={isSingleUrlMode ? 3 : 5}
          disabled={looking}
          className="min-h-24 w-full resize-y rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-3 font-mono text-sm leading-6 text-[var(--ink)] outline-none transition focus:border-[var(--accent-dark)] focus:ring-2 focus:ring-[var(--accent)]/55 disabled:opacity-60"
        />
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
          {mode === "audio"
            ? "Audio is saved as an MP3 file. One URL per line, up to 10."
            : mode === "video"
              ? "Saves video with sound. One URL per line, up to 10."
              : isCollectionMode
                ? `${itemNoun[0].toUpperCase()}${itemNoun.slice(1)}s are shown in sets of 50, newest first. Download a whole set, or pick ${itemNoun}s from it.`
                : platform === "website"
                  ? "Only use media you own or have permission to download."
                  : `${urls.length} ${urls.length === 1 ? "link" : "links"} · one URL per line, up to 10`}
        </p>
      </div>

      <button
        type="button"
        disabled={looking || urls.length === 0 || (isSingleUrlMode && urls.length !== 1)}
        onClick={fetchMedia}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {looking ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Search aria-hidden="true" className="size-4" />
        )}
        {looking ? "Fetching media…" : "Fetch media"}
      </button>

      {error ? (
        <p role="alert" className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {lookup && isCollectionLookup ? (
        <SetBrowser
          key={lookupVersion}
          platform={platform}
          mode={lookupMode}
          firstPage={lookup}
          itemNoun={itemNoun}
          loadSet={(offset) => requestLookup({ mode: lookupMode, urls: lookupUrls }, offset)}
        />
      ) : null}

      {lookup && !isCollectionLookup ? (
        <div className="space-y-3" aria-live="polite">
          <p className="text-sm font-semibold text-[var(--ink)]">
            {lookup.items.length} {lookup.items.length === 1 ? "item" : "items"} found
            {lookup.truncated ? " · only the first 10 links were read" : ""}
          </p>
          <ul className={`grid gap-4 ${lookup.items.length > 1 ? "sm:grid-cols-2" : ""}`}>
            {lookup.items.map((item) => (
              <MediaCard
                key={itemKey(item)}
                item={item}
                preferAudio={platform === "youtube" && lookupMode === "audio"}
                hrefFor={(quality) => downloadHref(platform, lookupMode, item, quality)}
              />
            ))}
          </ul>
          {lookup.failed.length ? (
            <div className="rounded-md border border-[var(--line)] bg-[var(--paper)] p-3 text-sm text-[var(--muted)]">
              <p className="font-semibold text-[var(--ink)]">
                {lookup.failed.length} {lookup.failed.length === 1 ? "link" : "links"} could not be read
              </p>
              <ul className="mt-1 space-y-1">
                {lookup.failed.map((failure) => (
                  <li key={failure.url} className="break-all">
                    {failure.url}: {failure.error}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <p className="text-xs leading-5 text-[var(--muted)]">
        Works with public posts and videos. Private videos, or ones that need you to log in,
        can&apos;t be downloaded. Only download content you own or have permission to save. Your
        files go straight to your device; we never keep a copy.
      </p>
    </div>
  );
}
