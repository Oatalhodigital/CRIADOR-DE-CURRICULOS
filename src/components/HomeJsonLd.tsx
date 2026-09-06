export default function HomeJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Criador de Currículos com IA',
    description: 'Crie currículos profissionais otimizados para ATS em minutos com inteligência artificial. Modelos prontos, dicas por profissão e download em PDF.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'BRL',
      lowPrice: '7.90',
      highPrice: '17.90',
      offerCount: 3,
      offers: [
        {
          '@type': 'Offer',
          price: '7.90',
          priceCurrency: 'BRL',
          description: 'Plano Básico: 1 download do currículo em PDF',
        },
        {
          '@type': 'Offer',
          price: '12.49',
          priceCurrency: 'BRL',
          description: 'Plano Semanal: downloads ilimitados por 7 dias',
        },
        {
          '@type': 'Offer',
          price: '17.90',
          priceCurrency: 'BRL',
          description: 'Plano Mensal: downloads ilimitados por 30 dias',
        },
      ],
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
