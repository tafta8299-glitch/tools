import type { Metadata } from "next";
import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import {
  blogPosts,
  getBlogPostBySlug,
  getRelatedBlogPosts,
} from "@/data/blog-posts";
import { getCategoryLinkLabel, getCategorySlug } from "@/data/tools";
import { siteName, siteUrl } from "@/data/site";
import { notFound } from "next/navigation";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Guide not found",
      robots: { index: false, follow: false },
    };
  }

  const canonical = `/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: `${post.title} | ${siteName}`,
      description: post.description,
      url: `${siteUrl}${canonical}`,
      siteName,
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | ${siteName}`,
      description: post.description,
      images: ["/opengraph-image"],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const canonical = `${siteUrl}/blog/${post.slug}`;
  const categoryUrl = `/tools/category/${getCategorySlug(post.category)}`;
  const relatedPosts = getRelatedBlogPosts(post.slug);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description,
        articleSection: post.category,
        inLanguage: "en",
        isAccessibleForFree: true,
        url: canonical,
        mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
        publisher: {
          "@type": "Organization",
          "@id": `${siteUrl}/#organization`,
          name: siteName,
          url: siteUrl,
        },
        image: `${siteUrl}/opengraph-image`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          {
            "@type": "ListItem",
            position: 2,
            name: "Guides",
            item: `${siteUrl}/blog`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
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
          <Link href="/blog" className="hover:text-[var(--ink)]">Guides</Link>
          <ChevronRight aria-hidden="true" className="size-4" />
          <span aria-current="page" className="font-medium text-[var(--ink)]">{post.toolName}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-16">
          <article className="min-w-0 max-w-3xl">
            <header className="border-b border-[var(--line)] pb-7">
              <Link
                href={categoryUrl}
                className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-dark)] hover:underline hover:underline-offset-4"
              >
                {getCategoryLinkLabel(post.category)}
              </Link>
              <h1 className="mt-3 text-3xl font-semibold leading-tight text-[var(--ink)] sm:text-4xl">
                {post.title}
              </h1>
              <p className="mt-4 text-base leading-7 text-[var(--muted)]">
                {post.introduction}
              </p>
              <Link
                href={`/tools/${post.slug}`}
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-sm bg-[var(--ink)] px-4 text-sm font-semibold text-[var(--surface)] transition-colors hover:bg-[var(--accent-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-dark)]"
              >
                Open {post.toolName}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </header>

            <div className="pt-5 text-base leading-7 text-[var(--ink)] [&_a]:font-medium [&_a]:text-[var(--accent-dark)] [&_a]:underline [&_a]:decoration-[var(--accent-dark)]/35 [&_a]:underline-offset-4 [&_a:hover]:decoration-[var(--accent-dark)] [&_blockquote]:my-5 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--line)] [&_blockquote]:pl-4 [&_code]:rounded-sm [&_code]:bg-[var(--paper)] [&_code]:px-1 [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-5 [&_ol]:my-4 [&_ol]:list-decimal [&_p]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-[var(--paper)] [&_pre]:p-4 [&_ul]:my-4 [&_ul]:list-disc">
              <Markdown remarkPlugins={[remarkGfm]}>{post.body}</Markdown>
            </div>
          </article>

          <aside className="lg:pt-2">
            <section className="border-t border-[var(--line)] py-5 lg:border-t-0 lg:pt-0">
              <h2 className="text-sm font-semibold text-[var(--ink)]">
                Use the tool
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Go from this guide directly to the free {post.toolName.toLowerCase()}.
              </p>
              <Link
                href={`/tools/${post.slug}`}
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-dark)] underline decoration-[var(--accent-dark)]/35 underline-offset-4 hover:decoration-[var(--accent-dark)]"
              >
                Open {post.toolName}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </section>

            {relatedPosts.length > 0 ? (
              <section className="border-t border-[var(--line)] py-5" aria-labelledby="related-guides-heading">
                <h2 id="related-guides-heading" className="text-sm font-semibold text-[var(--ink)]">
                  Related guides
                </h2>
                <ul className="mt-2 divide-y divide-[var(--line)]">
                  {relatedPosts.map((relatedPost) => (
                    <li key={relatedPost.slug} className="py-3 first:pt-2">
                      <Link
                        href={`/blog/${relatedPost.slug}`}
                        className="text-sm font-medium leading-6 text-[var(--accent-dark)] underline decoration-[var(--accent-dark)]/35 underline-offset-4 hover:decoration-[var(--accent-dark)]"
                      >
                        {relatedPost.title}
                      </Link>
                      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                        {relatedPost.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <Link
              href={categoryUrl}
              className="inline-flex items-center gap-2 border-t border-[var(--line)] py-5 text-sm font-semibold text-[var(--accent-dark)] hover:underline hover:underline-offset-4"
            >
              Browse {getCategoryLinkLabel(post.category)}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}