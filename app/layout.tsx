import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { BookOpen, Layers3 } from "lucide-react";
import { CategoryMenu } from "@/components/CategoryMenu";
import { getCategorySlug, tools } from "@/data/tools";
import { siteName, siteUrl } from "@/data/site";
import "./globals.css";

const siteDescription =
  "Free online tools for images, PDFs, videos, text, and developer tasks. Create, convert, edit, and download files with Trovflex Tools.";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Trovflex Tools | Free Online Tools",
    template: "%s | Trovflex Tools",
  },
  description: siteDescription,
  applicationName: siteName,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName,
    title: "Trovflex Tools | Free Online Tools",
    description: siteDescription,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Trovflex Tools: free online tools for everyday tasks",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trovflex Tools | Free Online Tools",
    description: siteDescription,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

const categories = [...new Set(tools.map((tool) => tool.category))].map((category) => ({
  name: category,
  slug: getCategorySlug(category),
  count: tools.filter((tool) => tool.category === category).length,
}));

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--paper)] text-[var(--ink)]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${siteUrl}/#organization`,
                  name: siteName,
                  url: siteUrl,
                },
                {
                  "@type": "WebSite",
                  "@id": `${siteUrl}/#website`,
                  name: siteName,
                  url: siteUrl,
                  description: siteDescription,
                  publisher: { "@id": `${siteUrl}/#organization` },
                  inLanguage: "en",
                },
              ],
            }).replace(/</g, "\\u003c"),
          }}
        />
        <div className="border-b border-[var(--line)] bg-[var(--paper)]">
          <header className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Trovflex Tools home">
              <span className="grid size-9 place-items-center rounded-md bg-[var(--ink)] text-[var(--accent)]">
                <span className="text-lg font-bold leading-none">t.</span>
              </span>
              <span className="text-base font-semibold tracking-tight">Trovflex Tools</span>
            </Link>
            <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/tools"
                className="min-h-10 inline-flex items-center gap-2 rounded-sm px-2 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-dark)]"
              >
                <Layers3 aria-hidden="true" className="size-4" />
                <span>Browse tools</span>
              </Link>
              <Link
                href="/blog"
                aria-label="Guides blog"
                className="min-h-10 inline-flex items-center gap-2 rounded-sm px-2 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-dark)]"
              >
                <BookOpen aria-hidden="true" className="size-4" />
                <span className="hidden sm:inline">Guides</span>
              </Link>
              <CategoryMenu categories={categories} />
            </nav>
          </header>
        </div>
        {children}
      </body>
    </html>
  );
}
