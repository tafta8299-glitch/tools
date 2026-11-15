import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { blogPosts } from "@/data/blog-posts";
import { getCategoryLinkLabel, getCategorySlug } from "@/data/tools";
import { siteName, siteUrl } from "@/data/site";

const blogDescription =
  "Practical guides for using free online image, PDF, video, text, design, and developer tools from Trovflex.";

export const metadata: Metadata = {
  title: "How-to Guides for Free Online Tools",
  description: blogDescription,
  alternates: { canonical: "/blog" },
  openGraph: {
    title: `How-to Guides for Free Online Tools | ${siteName}`,
    description: blogDescription,
    type: "website",
    url: `${siteUrl}/blog`,
    siteName,
    images: ["/opengraph-image"],
  },
  twitter: {
    title: `How-to Guides for Free Online Tools | ${siteName}`,
    description: blogDescription,
    images: ["/opengraph-image"],
  },
};

export default function BlogIndexPage() {
  const categories = [...new Set(blogPosts.map((post) => post.category))];
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Trovflex Tools Guides",
    description: blogDescription,
    url: `${siteUrl}/blog`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: blogPosts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: post.title,
        url: `${siteUrl}/blog/${post.slug}`,
      })),
    },
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
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--ink)]">Home</Link>
          <ChevronRight aria-hidden="true" className="size-4" />
          <span aria-current="page" className="font-medium text-[var(--ink)]">Guides</span>
        </nav>

        <header className="mb-10 max-w-3xl border-b border-[var(--line)] pb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-dark)]">
            Trovflex Tools blog
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-[var(--ink)] sm:text-4xl">
            Practical guides for everyday tools
          </h1>
          <p className="mt-4 text-base leading-7 text-[var(--muted)]">
            Learn how to prepare files, choose useful settings, check results, and understand the limits of each tool.
          </p>
        </header>

        <nav aria-label="Guide categories" className="mb-10 flex flex-wrap gap-x-5 gap-y-2 border-b border-[var(--line)] pb-5">
          {categories.map((category) => (
            <a
              key={category}
              href={`#guides-${getCategorySlug(category)}`}
              className="text-sm font-medium text-[var(--accent-dark)] underline decoration-[var(--accent-dark)]/35 underline-offset-4 hover:decoration-[var(--accent-dark)]"
            >
              {category} guides
            </a>
          ))}
        </nav>

        <div className="space-y-12">
          {categories.map((category) => {
            const categoryPosts = blogPosts.filter((post) => post.category === category);
            const categoryHref = `/tools/category/${getCategorySlug(category)}`;

            return (
              <section
                key={category}
                id={`guides-${getCategorySlug(category)}`}
                aria-labelledby={`guides-${getCategorySlug(category)}-heading`}
                className="scroll-mt-8"
              >
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--line)] pb-3">
                  <h2 id={`guides-${getCategorySlug(category)}-heading`} className="text-xl font-semibold text-[var(--ink)]">
                    {category} guides
                  </h2>
                  <Link
                    href={categoryHref}
                    className="text-sm font-medium text-[var(--accent-dark)] underline decoration-[var(--accent-dark)]/35 underline-offset-4 hover:decoration-[var(--accent-dark)]"
                  >
                    Browse {getCategoryLinkLabel(category)}
                  </Link>
                </div>
                <ul className="divide-y divide-[var(--line)]">
                  {categoryPosts.map((post) => (
                    <li key={post.slug} className="py-5 first:pt-4">
                      <article>
                        <h3 className="text-lg font-semibold text-[var(--ink)]">
                          <Link
                            href={`/blog/${post.slug}`}
                            className="underline decoration-[var(--line)] underline-offset-4 hover:text-[var(--accent-dark)] hover:decoration-[var(--accent-dark)]"
                          >
                            {post.title}
                          </Link>
                        </h3>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                          {post.description}
                        </p>
                        <p className="mt-2 text-sm">
                          <Link
                            href={`/tools/${post.slug}`}
                            className="font-medium text-[var(--accent-dark)] underline decoration-[var(--accent-dark)]/35 underline-offset-4 hover:decoration-[var(--accent-dark)]"
                          >
                            Open {post.toolName}
                          </Link>
                        </p>
                      </article>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}