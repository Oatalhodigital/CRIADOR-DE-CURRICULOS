import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { professionContents, ProfessionContent } from '@/data/professionContents'
import { getSiteUrl, slugifyProfession } from '@/lib/seo'
import { CheckCircle2, ArrowRight, FileText, Sparkles, Download } from 'lucide-react'

export function generateStaticParams() {
  return professionContents.map((p) => ({ slug: p.slug }))
}

function getProfessionContent(slug: string): ProfessionContent | undefined {
  return professionContents.find((p) => p.slug === slug)
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const content = getProfessionContent(slug)
  if (!content) return {}

  const siteUrl = getSiteUrl()
  const url = `${siteUrl}/curriculo-para/${content.slug}`

  return {
    title: content.metaTitle,
    description: content.metaDescription,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      url,
      title: content.metaTitle,
      description: content.metaDescription,
      siteName: 'Criador de Currículos',
    },
    twitter: {
      card: 'summary_large_image',
      title: content.metaTitle,
      description: content.metaDescription,
    },
  }
}

function ProfessionJsonLd({ content }: { content: ProfessionContent }) {
  const siteUrl = getSiteUrl()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: content.h1,
    description: content.metaDescription,
    author: {
      '@type': 'Organization',
      name: 'LS Soluções Digitais',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Criador de Currículos',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/curriculo-para/${content.slug}`,
    },
    about: {
      '@type': 'Thing',
      name: `Currículo para ${content.profession}`,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

function RelatedProfessionLink({ slug }: { slug: string }) {
  const content = professionContents.find((p) => p.slug === slug)
  if (!content) return null
  return (
    <Link
      href={`/curriculo-para/${slug}`}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 rounded-lg text-sm font-medium transition-colors"
    >
      <FileText className="w-4 h-4" />
      {content.profession}
    </Link>
  )
}

export default async function ProfessionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const content = getProfessionContent(slug)
  if (!content) notFound()

  const ctaUrl = `/?profissao=${encodeURIComponent(content.profession)}`

  return (
    <main className="min-h-[100dvh] bg-white">
      <ProfessionJsonLd content={content} />

      {/* Hero */}
      <section className="bg-gradient-to-b from-emerald-50 to-white py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-emerald-700 transition-colors">Início</Link>
            <span>/</span>
            <span className="text-gray-700">Currículo para {content.profession}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
            {content.h1}
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            {content.metaDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={ctaUrl}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors shadow-sm"
            >
              <Sparkles className="w-5 h-5" />
              Criar meu currículo de {content.profession}
            </Link>
            <Link
              href="/#modelos"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 hover:border-emerald-600 text-gray-700 rounded-xl font-semibold transition-colors"
            >
              <FileText className="w-5 h-5" />
              Ver modelos de currículo
            </Link>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Dicas específicas para currículo de {content.profession}
          </h2>
          <p className="text-gray-600 mb-8">
            Cada dica abaixo foi pensada para passar pelos filtros automáticos (ATS) e chamar atenção do recrutador.
          </p>
          <div className="space-y-4">
            {content.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 p-5 bg-gray-50 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before / After */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Exemplos: antes e depois
          </h2>
          <p className="text-gray-600 mb-8">
            Veja como transformar descrições genéricas em frases de impacto que passam nos ATS e impressionam recrutadores.
          </p>
          <div className="space-y-6">
            {content.beforeAfter.map((item, i) => (
              <div key={i} className="grid md:grid-cols-2 gap-4">
                <div className="p-5 bg-red-50 border border-red-100 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-red-600">Antes</span>
                  </div>
                  <p className="text-gray-700">{item.before}</p>
                </div>
                <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-emerald-600">Depois</span>
                  </div>
                  <p className="text-gray-700">{item.after}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Pronto para criar seu currículo de {content.profession}?
          </h2>
          <p className="text-gray-600 mb-8">
            Comece agora — é grátis para montar. Você só paga quando quiser baixar o PDF.
          </p>
          <Link
            href={ctaUrl}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-lg transition-colors shadow-sm"
          >
            <Download className="w-5 h-5" />
            Criar currículo de {content.profession} agora
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-sm text-gray-400 mt-4">
            A partir de R$ 7,90 · PDF otimizado para ATS · Download imediato
          </p>
        </div>
      </section>

      {/* Internal linking */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Currículos para outras profissões
          </h2>
          <div className="flex flex-wrap gap-3">
            {content.related.map((slug) => (
              <RelatedProfessionLink key={slug} slug={slug} />
            ))}
          </div>
          <div className="mt-6">
            <Link
              href="/curriculo-para/administrador"
              className="text-sm text-emerald-700 hover:underline"
            >
              Ver todas as profissões disponíveis →
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
