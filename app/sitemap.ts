import type { MetadataRoute } from "next";
import { availableToolSlugs } from "@/data/available-tools";
import { blogPosts } from "@/data/blog-posts";
import { siteUrl } from "@/data/site";
import { getCategorySlug, tools } from "@/data/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl },
    { url: `${siteUrl}/tools` },
    { url: `${siteUrl}/blog` },
    ...[...new Set(tools.map((tool) => tool.category))].map(
      (category) => ({ url: `${siteUrl}/tools/category/${getCategorySlug(category)}` }),
    ),
    ...tools
      .filter((tool) => availableToolSlugs.has(tool.slug))
      .map((tool) => ({ url: `${siteUrl}/tools/${tool.slug}` })),
    ...blogPosts.map((post) => ({ url: `${siteUrl}/blog/${post.slug}` })),
  ];
}