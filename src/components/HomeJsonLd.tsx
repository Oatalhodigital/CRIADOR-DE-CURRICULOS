export default function HomeJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Criador de Currículos com IA',
    description: 'Crie currículos profissionais otimizados para ATS em minutos com inteligência artificial. Modelos prontos, dicas por profissão e download em PDF.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '7.90',
      priceCurrency: 'BRL',
      description: 'Plano Básico: 1 download do currículo em PDF',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '83',
      bestRating: '5',
      worstRating: '1',
    },
    publisher: {
      '@type': 'Organization',
      name: 'LS Soluções Digitais',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
