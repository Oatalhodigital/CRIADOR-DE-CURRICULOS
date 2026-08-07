/**
 * Detecta navegadores embutidos (in-app) do Instagram, Facebook, TikTok etc.
 * Esses navegadores costumam ter restrições de armazenamento, cookies e OAuth,
 * o que quebra o login com Google e pode travar o carregamento do site.
 */

export type InAppBrowser =
  | 'instagram'
  | 'facebook'
  | 'messenger'
  | 'tiktok'
  | 'twitter'
  | 'linkedin'
  | 'pinterest'
  | 'snapchat'
  | 'unknown'
  | null;

export function detectInAppBrowser(): InAppBrowser {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return null;

  const ua = navigator.userAgent || navigator.vendor || '';
  const lower = ua.toLowerCase();

  if (lower.includes('instagram')) return 'instagram';
  if (lower.includes('fb_iab') || lower.includes('fb_an') || lower.includes('facebook')) {
    // fb_iab = Facebook In-App Browser; fb_an = Facebook App for Android
    return 'facebook';
  }
  if (lower.includes('tiktok') || lower.includes('bytedefault') || lower.includes('musical_ly')) return 'tiktok';
  if (lower.includes('twitter') || lower.includes('twitterfor')) return 'twitter';
  if (lower.includes('linkedin')) return 'linkedin';
  if (lower.includes('pinterest')) return 'pinterest';
  if (lower.includes('snapchat')) return 'snapchat';
  if (lower.includes('messenger')) return 'messenger';

  // Heurística adicional: alguns in-apps não se identificam no user-agent,
  // mas não expõem a barra de URL completa. Não é perfeita, mas ajuda.
  if (window.innerHeight > window.outerHeight - 80) {
    // Provável navegador em tela cheia (não in-app) — não usamos isso sozinho.
  }

  return null;
}

export function isInAppBrowser(): boolean {
  return detectInAppBrowser() !== null;
}

export function getInAppBrowserLabel(app: InAppBrowser): string {
  switch (app) {
    case 'instagram':
      return 'Instagram';
    case 'facebook':
    case 'messenger':
      return 'Facebook/Messenger';
    case 'tiktok':
      return 'TikTok';
    case 'twitter':
      return 'Twitter/X';
    case 'linkedin':
      return 'LinkedIn';
    case 'pinterest':
      return 'Pinterest';
    case 'snapchat':
      return 'Snapchat';
    default:
      return 'navegador do aplicativo';
  }
}
