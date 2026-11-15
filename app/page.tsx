import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, Sparkles } from "lucide-react";
import { ToolsDirectory } from "@/components/ToolsDirectory";
import { tools } from "@/data/tools";

export const metadata: Metadata = {
  title: "Free Online Tools for Everyday Tasks",
  description:
    "Use free online tools for images, PDFs, videos, text, and developer tasks. Create, convert, edit, and download files with Trovflex Tools.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Free Online Tools for Everyday Tasks | Trovflex Tools",
    description:
      "Use free online tools for images, PDFs, videos, text, and developer tasks. Create, convert, edit, and download files with Trovflex Tools.",
    url: "/",
  },
  twitter: {
    title: "Free Online Tools for Everyday Tasks | Trovflex Tools",
    description:
      "Free online tools for images, PDFs, videos, text, and developer tasks.",
  },
};

export default function Home() {
  return (
    <main className="flex-1">
      <section className="hero-grid border-b border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-5 pb-12 pt-12 sm:px-8 sm:pb-16 sm:pt-16 lg:px-12 lg:pb-20 lg:pt-20">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-dark)]">
              <Sparkles aria-hidden="true" className="size-4" />
              A little help for the everyday
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] text-[var(--ink)] sm:text-5xl lg:text-6xl">
              Free online tools. <span className="text-[var(--accent-dark)]">Less busywork.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              Handy utilities for the small tasks that keep your day moving.
              Pick a tool and get straight to it.
            </p>
            <a
              href="#tools"
              className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink)] transition-colors hover:text-[var(--accent-dark)]"
            >
              Explore all {tools.length} tools
              <ArrowDown aria-hidden="true" className="size-4" />
            </a>
            <Link
              href="/tools"
              className="ml-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-dark)] transition-colors hover:text-[var(--ink)]"
            >
              Browse by category
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section
        id="tools"
        aria-labelledby="tools-heading"
        className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20"
      >
        <div className="mb-7 border-b border-[var(--line)] pb-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-dark)]">
              The collection
            </p>
            <h2
              id="tools-heading"
              className="text-2xl font-semibold text-[var(--ink)] sm:text-3xl"
            >
              Find your next tool
            </h2>
          </div>
        </div>
        <ToolsDirectory tools={tools} />
      </section>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <p>Free online utilities by Trovflex.</p>
          <p>{new Date().getFullYear()} Trovflex Tools</p>
        </div>
      </footer>
    </main>
  );
}
