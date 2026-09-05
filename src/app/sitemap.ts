import type { MetadataRoute } from 'next'
import { getSiteUrl, getAllProfessionSlugs } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl()
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/termos-uso`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/politica-privacidade`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/politica-reembolso`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const professionPages: MetadataRoute.Sitemap = getAllProfessionSlugs().map((slug) => ({
    url: `${base}/curriculo-para/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [...staticPages, ...professionPages]
}
