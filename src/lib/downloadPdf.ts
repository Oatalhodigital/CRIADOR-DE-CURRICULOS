'use client';

/**
 * Função utilitária compartilhada para download de PDF.
 * Usada tanto pelo CheckoutModal quanto pelo ResumePreview para garantir
 * comportamento consistente em todos os pontos de download.
 */

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithTimeout = (url: string, options: RequestInit = {}, timeoutMs = 20000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeoutId));
};

const toSameOriginPath = (url: string): string => {
  if (typeof window === 'undefined') return url;
  try {
    const parsed = new URL(url, window.location.href);
    if (parsed.host === window.location.host) {
      return parsed.pathname + parsed.search;
    }
    return url;
  } catch {
    return url;
  }
};

export async function downloadPdf(url: string, retries = 2): Promise<void> {
  const safeUrl = typeof window === 'undefined' ? url : toSameOriginPath(url);
  let lastError = '';
  let lastDetails: any = null;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const res = await fetchWithTimeout(
        safeUrl,
        { headers: { 'X-Requested-With': 'checkout-autodownload' } },
        20000
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        lastDetails = data;
        throw new Error(data.error || `Erro ${res.status} ao baixar PDF.`);
      }

      const blob = await res.blob();

      if (blob.size === 0) {
        throw new Error('O arquivo PDF retornou vazio.');
      }

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'curriculo.pdf';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isInAppBrowser = /Instagram|FBAN|FBAV|Messenger|TikTok|LinkedInApp|Pinterest|Snapchat/i.test(navigator.userAgent);
      if (isIOS || isSafari || isInAppBrowser) {
        setTimeout(() => {
          window.open(blobUrl, '_blank');
        }, 500);
      }

      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      return;
    } catch (err: any) {
      lastError = err instanceof Error ? err.message : String(err);

      const isNetworkError = err instanceof TypeError || err?.name === 'AbortError' || lastError.toLowerCase().includes('network');
      if (!isNetworkError || attempt > retries) break;
      await sleep(1000 * attempt);
    }
  }

  // Fallback: window.open
  try {
    const fallbackUrl = typeof window === 'undefined' ? url : toSameOriginPath(url);
    const opened = window.open(fallbackUrl, '_blank');
    if (opened) return;
  } catch {
    // window.open falhou
  }

  // Fallback final: iframe inline
  try {
    const fallbackUrl = typeof window === 'undefined' ? url : toSameOriginPath(url);
    const iframe = document.createElement('iframe');
    iframe.src = fallbackUrl;
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.zIndex = '9999';
    iframe.style.background = 'white';
    iframe.title = 'Visualização do currículo em PDF';
    document.body.appendChild(iframe);
    setTimeout(() => {
      try { document.body.removeChild(iframe); } catch {}
    }, 60000);
    return;
  } catch {
    // iframe falhou
  }

  throw new Error(lastError || 'Não foi possível iniciar o download do PDF.');
}
