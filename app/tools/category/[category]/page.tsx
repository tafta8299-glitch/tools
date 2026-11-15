import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ToolCard } from "@/components/ToolCard";
import { getBlogPostsByCategory } from "@/data/blog-posts";
import {
  getCategorySlug,
  getCategoryLinkLabel,
  getRelatedCategories,
  tools,
} from "@/data/tools";
import { siteName, siteUrl } from "@/data/site";
import { notFound } from "next/navigation";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

const categoryContent: Record<
  string,
  { title: string; description: string }
> = {
  Generators: {
    title: "Free QR Code and Barcode Generators",
    description:
      "Create QR codes for links and contact details, or make barcodes for products, labels, and projects.",
  },
  Security: {
    title: "Free Password and Security Tools",
    description:
      "Generate strong passwords and SHA-2 hashes with browser-based security utilities.",
  },
  Text: {
    title: "Free Online Text Tools",
    description:
      "Convert text case, count words and characters, and compare text with practical writing utilities.",
  },
  Design: {
    title: "Free Color Tools for Design",
    description:
      "Pick colors and copy HEX, RGB, or HSL values for design and interface work.",
  },
  Developer: {
    title: "Free Online Developer Tools",
    description:
      "Format JSON, convert data, encode URLs and Base64, generate identifiers, and work with timestamps.",
  },
  Converters: {
    title: "Free Online Unit and File Converters",
    description:
      "Convert measurements, images, documents, and timestamps between useful formats and values.",
  },
  Images: {
    title: "Free Online Image Tools",
    description:
      "Compress, resize, crop, and convert individual images or process a batch with shared settings.",
  },
  Documents: {
    title: "Free Online PDF Tools",
    description:
      "Merge or split PDFs, convert documents, and process multiple files together with browser-based tools.",
  },
  Videos: {
    title: "Free Online Video Resolution Tools",
    description:
      "Resize one video or process a batch to 720p, 1024 pixels tall, or 4K UHD.",
  },
  Downloads: {
    title: "Social Media Download Tools",
    description:
      "Find download tools for publicly available videos and media from TikTok, Instagram, YouTube, Facebook, Pinterest, Reddit, and X.",
  },
  Games: {
    title: "Free Game Helper Tools",
    description:
      "Plan ahead in your favorite games, starting with a Palworld breeding calculator that shows which Pals hatch from which parents.",
  },
};

function getCategoryFromSlug(slug: string) {
  return tools.find((tool) => getCategorySlug(tool.category) === slug)?.category;
}

export function generateStaticParams() {
  return [...new Set(tools.map((tool) => tool.category))].map((category) => ({
    category: getCategorySlug(category),
  }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = getCategoryFromSlug(categorySlug);

  if (!category) {
    return {
      title: "Category not found",
      robots: { index: false, follow: false },
    };
  }

  const content = categoryContent[category];
  const canonical = `/tools/category/${categorySlug}`;

  return {
    title: content.title,
    description: content.description,
    alternates: { canonical },
    openGraph: {
      title: `${content.title} | ${siteName}`,
      description: content.description,
      type: "website",
      url: `${siteUrl}${canonical}`,
      siteName,
      images: ["/opengraph-image"],
    },
    twitter: {
      title: `${content.title} | ${siteName}`,
      description: content.description,
      images: ["/opengraph-image"],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const category = getCategoryFromSlug(categorySlug);

  if (!category) {
    notFound();
  }

  const content = categoryContent[category];
  const categoryTools = tools.filter((tool) => tool.category === category);
  const categoryPosts = getBlogPostsByCategory(category);
  const relatedCategoryNames = getRelatedCategories(category);
  const canonical = `${siteUrl}/tools/category/${categorySlug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: content.title,
        description: content.description,
        url: canonical,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: categoryTools.map((tool, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: tool.name,
            url: `${siteUrl}/tools/${tool.slug}`,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          {
            "@type": "ListItem",
            position: 2,
            name: "All tools",
            item: `${siteUrl}/tools`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: getCategoryLinkLabel(category),
            item: canonical,
          },
        ],
      },
    ],
  };

  return (
    <main className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--ink)]">Home</Link>
          <ChevronRight aria-hidden="true" className="size-4" />
          <Link href="/tools" className="hover:text-[var(--ink)]">All tools</Link>
          <ChevronRight aria-hidden="true" className="size-4" />
          <span aria-current="page" className="font-medium text-[var(--ink)]">{getCategoryLinkLabel(category)}</span>
        </nav>

        <header className="max-w-3xl border-b border-[var(--line)] pb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-dark)]">
            Trovflex Tools directory
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-[var(--ink)] sm:text-4xl">
            {content.title}
          </h1>
          <p className="mt-4 text-base leading-7 text-[var(--muted)]">
            {content.description}
          </p>
        </header>

        <section aria-label={getCategoryLinkLabel(category)} className="py-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categoryTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>

        <section aria-labelledby="category-guides-heading" className="border-t border-[var(--line)] py-7">
          <h2 id="category-guides-heading" className="text-xl font-semibold text-[var(--ink)]">
            {category} guides
          </h2>
          <ul className="mt-3 divide-y divide-[var(--line)]">
            {categoryPosts.map((post) => (
              <li key={post.slug} className="py-4 first:pt-2">
                <article>
                  <h3 className="text-base font-semibold text-[var(--ink)]">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="underline decoration-[var(--line)] underline-offset-4 hover:text-[var(--accent-dark)] hover:decoration-[var(--accent-dark)]"
                    >
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                    {post.description}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </section>

        {relatedCategoryNames.length > 0 ? (
          <nav aria-label="Related tool categories" className="border-t border-[var(--line)] py-7">
            <h2 className="text-sm font-semibold text-[var(--ink)]">
              Explore related categories
            </h2>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {relatedCategoryNames.map((relatedCategory) => (
                <li key={relatedCategory}>
                  <Link
                    href={`/tools/category/${getCategorySlug(relatedCategory)}`}
                    className="text-sm font-medium text-[var(--accent-dark)] underline decoration-[var(--accent-dark)]/35 underline-offset-4 hover:decoration-[var(--accent-dark)]"
                  >
                    {categoryContent[relatedCategory].title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </main>
  );
}