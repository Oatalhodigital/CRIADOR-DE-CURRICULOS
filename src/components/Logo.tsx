import Image from 'next/image'

export const LOGO_SRC = '/logo.svg'
export const LOGO_ALT = 'Criador de Currículos'

const SIZES = {
  sm: 24,
  md: 32,
  lg: 40,
} as const

interface LogoProps {
  size?: keyof typeof SIZES
  className?: string
  withWordmark?: boolean
}

export default function Logo({ size = 'md', className = '', withWordmark = false }: LogoProps) {
  const px = SIZES[size]

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src={LOGO_SRC}
        alt={LOGO_ALT}
        width={px}
        height={px}
        priority
        unoptimized
        className="h-auto w-auto object-contain"
        style={{ height: px, width: 'auto' }}
      />
      {withWordmark && (
        <span className="text-sm font-bold tracking-tight text-gray-900 whitespace-nowrap">
          Criador de Currículos
        </span>
      )}
    </span>
  )
}
