import { professionOptions } from '@/data/professions'

export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL
  if (envUrl) return envUrl.replace(/\/$/, '')
  return 'https://xn--currculorapidocomia-o1b.com.br'
}

export function slugifyProfession(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export function deslugifyProfession(slug: string): string {
  const found = professionOptions.find(
    (p) => slugifyProfession(p.value) === slug
  )
  return found?.value || slug
}

export function getAllProfessionSlugs(): string[] {
  return professionOptions.map((p) => slugifyProfession(p.value))
}

export function getProfessionSlug(value: string): string {
  return slugifyProfession(value)
}
