import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CategoryDirectory } from "@/components/CategoryDirectory";
import { tools } from "@/data/tools";

export const metadata: Metadata = {
  title: "Browse Tools by Category",
  description: "Browse free online tools for images, PDFs, videos, text, design, developer tasks, and public media downloads.",
  alternates: { canonical: "/tools" },
  openGraph: {
    title: "Browse Free Online Tools by Category | Trovflex Tools",
    description: "Browse free online tools for images, PDFs, videos, text, design, developer tasks, and public media downloads.",
    url: "/tools",
  },
  twitter: {
    title: "Browse Free Online Tools by Category | Trovflex Tools",
    description: "Browse free image, PDF, video, text, design, developer, and public media download tools by category.",
  },
};

export default function ToolsPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12 lg:px-12">
          <Link href="/" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-dark)]">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Home
          </Link>
          <div className="mt-7 max-w-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-dark)]">Trovflex Tools directory</p>
            <h1 className="text-3xl font-semibold leading-tight text-[var(--ink)] sm:text-4xl">Browse by category</h1>
            <p className="mt-3 text-base leading-7 text-[var(--muted)]">Choose a category, narrow it down by task, and open the tool you need.</p>
          </div>
        </div>
      </section>
      <section aria-label="Browse the tools directory" className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <CategoryDirectory tools={tools} />
      </section>
    </main>
  );
}