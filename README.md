This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Social media download tools

The Instagram, TikTok, YouTube, Facebook, Pinterest, Reddit, and X download
pages run the standalone `yt-dlp` executable, which bundles its own Python, so
the server needs no Python install. `npm install` downloads it to `bin/` via
`scripts/install-yt-dlp.mjs`; if that download fails, the app downloads it to
`SOCIAL_DOWNLOADS_DIR/bin` on first use. Set `YT_DLP_PATH` to use a different
executable. FFmpeg comes from `ffmpeg-static`; set `FFMPEG_PATH` to override it.

Flow: **Fetch media** reads metadata only (title, thumbnail, preview) via
`POST /api/downloads/info`. **Download** is a plain link to
`GET /api/downloads?platform=&mode=&url=`, which streams the file to the
browser as it arrives from the platform (`lib/media-stream.ts`). Nothing is
written to disk: single files are relayed byte for byte, and when a platform
serves picture and sound separately, ffmpeg joins them on the fly into a
streamable MP4 (or converts to MP3 for YouTube audio). Optional setting:
`MAX_CONCURRENT_DOWNLOADS` (default 6 simultaneous streams). Profile/channel
links list up to 50 items to pick from.

The downloader does not use account logins or browser cookies. It works only
with public links supported by the installed yt-dlp version; platforms may
change their public pages or restrict automated access.
