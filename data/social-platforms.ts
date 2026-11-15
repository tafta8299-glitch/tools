export const socialPlatforms = {
  instagram: {
    name: "Instagram",
    slug: "instagram-downloader",
    hostnames: ["instagram.com", "www.instagram.com", "m.instagram.com", "instagr.am"],
    placeholder: "https://www.instagram.com/reel/...",
    profileLabel: "Instagram profile",
    // Instagram only shows a profile's post list to logged-in visitors.
    supportsProfile: false,
    postNoun: "post or reel",
  },
  tiktok: {
    name: "TikTok",
    slug: "tiktok-downloader",
    hostnames: [
      "tiktok.com",
      "www.tiktok.com",
      "m.tiktok.com",
      "vm.tiktok.com",
      "vt.tiktok.com",
    ],
    placeholder: "https://www.tiktok.com/@username/video/...",
    profileLabel: "TikTok profile",
    supportsProfile: true,
    postNoun: "video",
  },
  youtube: {
    name: "YouTube",
    slug: "youtube-downloader",
    hostnames: [
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "music.youtube.com",
      "youtu.be",
    ],
    placeholder: "https://www.youtube.com/watch?v=...",
    profileLabel: "YouTube channel",
    supportsProfile: true,
    postNoun: "video",
  },
  facebook: {
    name: "Facebook",
    slug: "facebook-downloader",
    hostnames: [
      "facebook.com",
      "www.facebook.com",
      "m.facebook.com",
      "fb.watch",
      "web.facebook.com",
    ],
    placeholder: "https://www.facebook.com/watch/?v=...",
    profileLabel: "Facebook profile or page",
    supportsProfile: false,
    postNoun: "video or post",
  },
  pinterest: {
    name: "Pinterest",
    slug: "pinterest-downloader",
    hostnames: ["pinterest.com", "www.pinterest.com", "pin.it"],
    placeholder: "https://www.pinterest.com/pin/...",
    profileLabel: "Pinterest profile or board",
    supportsProfile: true,
    postNoun: "pin",
  },
  reddit: {
    name: "Reddit",
    slug: "reddit-downloader",
    hostnames: ["reddit.com", "www.reddit.com", "old.reddit.com", "redd.it"],
    placeholder: "https://www.reddit.com/r/.../comments/...",
    profileLabel: "Reddit profile or subreddit",
    supportsProfile: false,
    postNoun: "post",
  },
  x: {
    name: "X (Twitter)",
    slug: "x-downloader",
    hostnames: ["x.com", "www.x.com", "twitter.com", "www.twitter.com"],
    placeholder: "https://x.com/username/status/...",
    profileLabel: "X profile",
    supportsProfile: false,
    postNoun: "post",
  },
  website: {
    name: "Website",
    slug: "website-media-downloader",
    hostnames: [],
    placeholder:
      "https://quranacademy.edu.pk/SnapshotView/MediaID/5829/Title/07-002-Ummat-e-Muslima-par-Azaab-kay-Saaye",
    profileLabel: "Website",
    supportsProfile: false,
    postNoun: "page",
  },
} as const;

export type SocialPlatformId = keyof typeof socialPlatforms;
export type SocialDownloadMode = "links" | "profile" | "audio" | "video" | "channel";

export function getSocialPlatformBySlug(slug: string): SocialPlatformId | undefined {
  return (Object.keys(socialPlatforms) as SocialPlatformId[]).find(
    (platform) => socialPlatforms[platform].slug === slug,
  );
}
