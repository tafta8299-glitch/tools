import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { ToolIcon } from "@/components/ToolIcon";
import { BarcodeGenerator } from "@/components/tools/BarcodeGenerator";
import { BulkDocumentProcessor } from "@/components/tools/BulkDocumentProcessor";
import { BulkImageProcessor } from "@/components/tools/BulkImageProcessor";
import { BulkVideoUpscaler } from "@/components/tools/BulkVideoUpscaler";
import { BackgroundRemover } from "@/components/tools/BackgroundRemover";
import { Base64Converter } from "@/components/tools/Base64Converter";
import { ColorPicker } from "@/components/tools/ColorPicker";
import { CsvJsonConverter } from "@/components/tools/CsvJsonConverter";
import { FaviconGenerator } from "@/components/tools/FaviconGenerator";
import { HashGenerator } from "@/components/tools/HashGenerator";
import { ImageCropper } from "@/components/tools/ImageCropper";
import { ImageCompressor } from "@/components/tools/ImageCompressor";
import { ImageFormatConverter } from "@/components/tools/ImageFormatConverter";
import { ImageMetadataViewer } from "@/components/tools/ImageMetadataViewer";
import { ImageResizer } from "@/components/tools/ImageResizer";
import { ImageUpscaler } from "@/components/tools/ImageUpscaler";
import { JsonFormatter } from "@/components/tools/JsonFormatter";
import { MarkdownPreviewer } from "@/components/tools/MarkdownPreviewer";
import { MemeGenerator } from "@/components/tools/MemeGenerator";
import { PalworldBreedingCalculator } from "@/components/tools/PalworldBreedingCalculator";
import { PasswordGenerator } from "@/components/tools/PasswordGenerator";
import { QrCodeGenerator } from "@/components/tools/QrCodeGenerator";
import { ScreenshotBeautifier } from "@/components/tools/ScreenshotBeautifier";
import { TextDiffChecker } from "@/components/tools/TextDiffChecker";
import { TextCaseConverter } from "@/components/tools/TextCaseConverter";
import { SocialImageResizer } from "@/components/tools/SocialImageResizer";
import { SocialMediaDownloader } from "@/components/tools/SocialMediaDownloader";
import { TimestampConverter } from "@/components/tools/TimestampConverter";
import { UnitConverter } from "@/components/tools/UnitConverter";
import { UrlEncoderDecoder } from "@/components/tools/UrlEncoderDecoder";
import { UuidGenerator } from "@/components/tools/UuidGenerator";
import { VideoUpscaler } from "@/components/tools/VideoUpscaler";
import { WordCounter } from "@/components/tools/WordCounter";
import { PdfTool } from "@/components/tools/PdfTool";
import {
  getCategorySlug,
  getCategoryLinkLabel,
  getRelatedTools,
  getToolBySlug,
  tools,
} from "@/data/tools";
import { availableToolSlugs } from "@/data/available-tools";
import { getBlogPostBySlug } from "@/data/blog-posts";
import { siteName, siteUrl } from "@/data/site";
import { notFound } from "next/navigation";
import { getSocialPlatformBySlug } from "@/data/social-platforms";

const pdfToolSlugs = new Set([
  "pdf-merger",
  "pdf-splitter",
  "pdf-compressor",
  "pdf-to-images",
  "images-to-pdf",
  "pdf-page-rotator",
  "pdf-metadata-remover",
  "text-to-pdf",
  "docx-to-pdf",
  "pdf-to-text",
]);

type ToolPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return {
      title: "Tool not found",
      description: "This tool could not be found in the Trovflex Tools collection.",
      robots: { index: false, follow: false },
    };
  }

  const isToolReady = availableToolSlugs.has(tool.slug);

  return {
    title: `${tool.name} Online`,
    description: tool.shortDescription,
    alternates: { canonical: `/tools/${tool.slug}` },
    robots: { index: isToolReady, follow: true },
    openGraph: {
      title: `${tool.name} Online | ${siteName}`,
      description: tool.shortDescription,
      type: "website",
      url: `${siteUrl}/tools/${tool.slug}`,
      siteName,
      images: ["/opengraph-image"],
    },
    twitter: {
      title: `${tool.name} Online | ${siteName}`,
      description: tool.shortDescription,
      images: ["/opengraph-image"],
    },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const hasWorkingTool = availableToolSlugs.has(tool.slug);
  const blogPost = getBlogPostBySlug(tool.slug);
  const relatedTools = getRelatedTools(tool);
  const categoryUrl = `/tools/category/${getCategorySlug(tool.category)}`;
  const bulkTool = tool.category === "Images" && tool.slug !== "bulk-image-processor"
    ? { slug: "bulk-image-processor", name: "Bulk Image Processor" }
    : tool.category === "Documents" && tool.slug !== "bulk-document-processor"
      ? { slug: "bulk-document-processor", name: "Bulk Document Processor" }
      : tool.category === "Videos" && tool.slug !== "bulk-video-upscaler"
        ? { slug: "bulk-video-upscaler", name: "Bulk Video Upscaler" }
        : null;
  const socialPlatform = getSocialPlatformBySlug(tool.slug);

  return (
    <main className="flex-1">
      {hasWorkingTool ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "SoftwareApplication",
                  name: tool.name,
                  description: tool.shortDescription,
                  url: `${siteUrl}/tools/${tool.slug}`,
                  applicationCategory: "UtilitiesApplication",
                  operatingSystem: "Any",
                  isAccessibleForFree: true,
                  offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
                  publisher: {
                    "@type": "Organization",
                    "@id": `${siteUrl}/#organization`,
                    name: siteName,
                    url: siteUrl,
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
                      name: tool.category,
                      item: `${siteUrl}${categoryUrl}`,
                    },
                    {
                      "@type": "ListItem",
                      position: 4,
                      name: tool.name,
                      item: `${siteUrl}/tools/${tool.slug}`,
                    },
                  ],
                },
              ],
            }).replace(/</g, "\\u003c"),
          }}
        />
      ) : null}
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
            <li><Link href="/" className="hover:text-[var(--ink)]">Home</Link></li>
            <li><ChevronRight aria-hidden="true" className="size-4" /></li>
            <li><Link href="/tools" className="hover:text-[var(--ink)]">All tools</Link></li>
            <li><ChevronRight aria-hidden="true" className="size-4" /></li>
            <li><Link href={categoryUrl} className="hover:text-[var(--ink)]">{getCategoryLinkLabel(tool.category)}</Link></li>
            <li><ChevronRight aria-hidden="true" className="size-4" /></li>
            <li aria-current="page" className="font-medium text-[var(--ink)]">{tool.name}</li>
          </ol>
        </nav>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <section>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-dark)]">
              {tool.category}
            </p>
            <div className="flex items-start gap-4">
              <span className="mt-1 grid size-12 shrink-0 place-items-center rounded-md bg-[var(--accent)]/55 text-[var(--accent-dark)]">
                <ToolIcon name={tool.icon} className="size-6" />
              </span>
              <h1 className="text-3xl font-semibold leading-tight text-[var(--ink)] sm:text-4xl">
                {tool.name}
              </h1>
            </div>
            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--muted)]">
              {tool.longDescription}
            </p>
            <Link
              href={categoryUrl}
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-dark)] transition-colors hover:text-[var(--ink)]"
            >
              Browse {getCategoryLinkLabel(tool.category)}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
            {blogPost ? (
              <Link
                href={`/blog/${blogPost.slug}`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-dark)] transition-colors hover:text-[var(--ink)]"
              >
                Read the {tool.name} guide
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            ) : null}
            {bulkTool ? (
              <Link
                href={`/tools/${bulkTool.slug}`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-dark)] transition-colors hover:text-[var(--ink)]"
              >
                Processing several? Try {bulkTool.name}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            ) : null}
          </section>

          <section
            aria-labelledby="workspace-heading"
            className="min-h-80 rounded-md border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8"
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
              <h2
                id="workspace-heading"
                className="text-sm font-semibold text-[var(--ink)]"
              >
                Tool workspace
              </h2>
              <span className="rounded-sm bg-[var(--paper)] px-2.5 py-1 text-xs font-medium text-[var(--muted)]">
                {hasWorkingTool ? "Ready to use" : "In development"}
              </span>
            </div>
            {tool.slug === "qr-code-generator" ? (
              <QrCodeGenerator />
            ) : socialPlatform ? (
              <SocialMediaDownloader key={socialPlatform} platform={socialPlatform} />
            ) : tool.slug === "bulk-image-processor" ? (
              <BulkImageProcessor />
            ) : tool.slug === "bulk-document-processor" ? (
              <BulkDocumentProcessor />
            ) : tool.slug === "bulk-video-upscaler" ? (
              <BulkVideoUpscaler />
            ) : tool.slug === "barcode-generator" ? (
              <BarcodeGenerator />
            ) : tool.slug === "password-generator" ? (
              <PasswordGenerator />
            ) : tool.slug === "text-case-converter" ? (
              <TextCaseConverter />
            ) : tool.slug === "word-counter" ? (
              <WordCounter />
            ) : tool.slug === "color-picker" ? (
              <ColorPicker />
            ) : tool.slug === "base64-encoder-decoder" ? (
              <Base64Converter />
            ) : tool.slug === "json-formatter" ? (
              <JsonFormatter />
            ) : tool.slug === "uuid-generator" ? (
              <UuidGenerator />
            ) : tool.slug === "url-encoder-decoder" ? (
              <UrlEncoderDecoder />
            ) : tool.slug === "timestamp-converter" ? (
              <TimestampConverter />
            ) : tool.slug === "hash-generator" ? (
              <HashGenerator />
            ) : tool.slug === "unit-converter" ? (
              <UnitConverter />
            ) : tool.slug === "text-diff-checker" ? (
              <TextDiffChecker />
            ) : tool.slug === "markdown-previewer" ? (
              <MarkdownPreviewer />
            ) : tool.slug === "csv-json-converter" ? (
              <CsvJsonConverter />
            ) : tool.slug === "image-compressor" ? (
              <ImageCompressor />
            ) : tool.slug === "image-resizer" ? (
              <ImageResizer />
            ) : tool.slug === "image-cropper" ? (
              <ImageCropper />
            ) : tool.slug === "image-format-converter" ? (
              <ImageFormatConverter />
            ) : tool.slug === "background-remover" ? (
              <BackgroundRemover />
            ) : tool.slug === "image-upscaler" ? (
              <ImageUpscaler />
            ) : tool.slug === "video-upscaler" ? (
              <VideoUpscaler />
            ) : tool.slug === "favicon-generator" ? (
              <FaviconGenerator />
            ) : tool.slug === "meme-generator" ? (
              <MemeGenerator />
            ) : tool.slug === "screenshot-beautifier" ? (
              <ScreenshotBeautifier />
            ) : tool.slug === "image-metadata-viewer" ? (
              <ImageMetadataViewer />
            ) : tool.slug === "social-image-resizer" ? (
              <SocialImageResizer />
            ) : tool.slug === "palworld-breeding-calculator" ? (
              <PalworldBreedingCalculator />
            ) : pdfToolSlugs.has(tool.slug) ? (
              <PdfTool toolSlug={tool.slug} />
            ) : (
              <div className="grid min-h-60 place-items-center py-10 text-center">
                <div className="max-w-sm">
                  <span className="mx-auto grid size-14 place-items-center rounded-md bg-[var(--accent)]/45 text-[var(--accent-dark)]">
                    <ToolIcon name={tool.icon} className="size-7" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-[var(--ink)]">
                    Your {tool.name.toLowerCase()} starts here
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    The interactive tool will be available in this workspace soon.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
        {relatedTools.length > 0 ? (
          <section aria-labelledby="related-tools-heading" className="mt-12 border-t border-[var(--line)] pt-8">
            <div className="mb-4 max-w-2xl">
              <h2 id="related-tools-heading" className="text-xl font-semibold text-[var(--ink)]">
                Related tools
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Try these tools for a closely related task.
              </p>
            </div>
            <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
              {relatedTools.map((relatedTool) => (
                <li key={relatedTool.slug} className="border-t border-[var(--line)]">
                  <Link
                    href={`/tools/${relatedTool.slug}`}
                    className="group flex min-h-24 items-start gap-3 py-4"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-[var(--accent)]/45 text-[var(--accent-dark)]">
                      <ToolIcon name={relatedTool.icon} className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[var(--ink)] group-hover:text-[var(--accent-dark)]">
                        {relatedTool.name}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                        {relatedTool.shortDescription}
                      </span>
                    </span>
                    <ArrowUpRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--muted)]" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}