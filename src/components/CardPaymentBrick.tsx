'use client';

import { useEffect, useRef, useState } from 'react';

export interface CardPaymentData {
  token: string;
  issuer_id?: string;
  payment_method_id?: string;
  installments?: number;
  payer?: {
    email?: string;
    identification?: { type?: string; number?: string };
    [key: string]: any;
  };
  [key: string]: any;
}

interface CardPaymentBrickProps {
  publicKey: string;
  amount: number;
  email: string;
  onSubmit: (data: CardPaymentData) => void | Promise<void>;
  onError?: (error: any) => void;
}

declare global {
  interface Window {
    MercadoPago?: any;
    cardPaymentBrickController?: any;
    MP_DEVICE_SESSION_ID?: string;
  }
}

/**
 * Device ID gerado pelo SDK do Mercado Pago. Deve ser enviado ao criar o
 * pagamento (header X-meli-session-id) para melhorar a aprovação antifraude.
 * Em mobile o security.js pode demorar um pouco mais, então tenta esperar
 * antes de retornar vazio.
 */
export const getMercadoPagoDeviceId = (timeoutMs = 2000): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  if (window.MP_DEVICE_SESSION_ID) return window.MP_DEVICE_SESSION_ID;

  // Em mobile a segurança pode não estar pronta no clique; tentamos extrair
  // de forma síncrona em até timeoutMs (síncrono curto para não travar UI).
  const start = Date.now();
  while (!window.MP_DEVICE_SESSION_ID && Date.now() - start < timeoutMs) {
    // busy-wait leve de 50ms por iteração
    const wait = Date.now();
    while (Date.now() - wait < 50) {
      /* busy-wait sinalizador */
    }
  }
  return window.MP_DEVICE_SESSION_ID;
};

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar SDK do Mercado Pago'));
    document.body.appendChild(script);
  });

const SDK_URL = 'https://sdk.mercadopago.com/js/v2';
const SECURITY_SDK_URL = 'https://www.mercadopago.com/v2/security.js';
const INIT_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

const CardPaymentBrick = ({
  publicKey,
  amount,
  email,
  onSubmit,
  onError,
}: CardPaymentBrickProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const mountedRef = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishedRef = useRef(false);
  const onSubmitRef = useRef(onSubmit);
  const onErrorRef = useRef(onError);

  onSubmitRef.current = onSubmit;
  onErrorRef.current = onError;

  if (!publicKey) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
        <p className="font-semibold mb-1">Pagamento por cartão indisponível</p>
        <p>
          A chave pública do Mercado Pago não está configurada. Tente o pagamento via PIX ou
          entre em contato com o suporte.
        </p>
      </div>
    );
  }

  useEffect(() => {
    mountedRef.current = true;
    finishedRef.current = false;

    console.log('[CardPaymentBrick] iniciando', {
      publicKeyPrefix: publicKey ? `${publicKey.slice(0, 6)}...` : 'EMPTY',
      attempt: retryCount + 1,
      timestamp: new Date().toISOString(),
    });

    const initBrick = async () => {
      try {
        setLoading(true);
        setError(null);

        await loadScript(SDK_URL);

        // O SDK v2 já coleta o Device ID, mas se por algum motivo a variável não
        // existir carregamos o script de segurança como reforço. Sem await: o
        // Device ID só é lido no envio e isso não pode atrasar o formulário.
        if (!window.MP_DEVICE_SESSION_ID) {
          void loadScript(`${SECURITY_SDK_URL}?view=checkout`).catch((err) =>
            console.warn('[CardPaymentBrick] security.js não carregou', err)
          );
        }

        if (!mountedRef.current) return;
        if (!window.MercadoPago) {
          throw new Error('SDK do Mercado Pago não foi carregado corretamente.');
        }

        const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' });
        const bricksBuilder = mp.bricks();

        if (window.cardPaymentBrickController) {
          try {
            await window.cardPaymentBrickController.unmount();
          } catch {}
          window.cardPaymentBrickController = undefined;
        }

        const settings = {
          initialization: {
            amount,
            payer: { email },
          },
          callbacks: {
            onReady: () => {
              if (!mountedRef.current) return;
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
              console.log('[CardPaymentBrick] Brick pronto (onReady)');
              setLoading(false);
            },
            onSubmit: async (formData: CardPaymentData) => {
              try {
                await onSubmitRef.current?.(formData);
              } catch (err) {
                console.error('CardPaymentBrick: onSubmit error', err);
                throw err;
              }
            },
            onError: (err: any) => {
              if (!mountedRef.current) return;
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
              finishedRef.current = true;
              console.error('CardPaymentBrick: SDK error', err);
              const message = err?.message || 'Erro no formulário de cartão. Verifique os dados e tente novamente.';
              setError(message);
              onErrorRef.current?.(err);
              setLoading(false);
            },
          },
          customization: {
            visual: {
              style: { theme: 'default' },
            },
          },
        };

        if (typeof settings.callbacks.onReady !== 'function' || typeof settings.callbacks.onError !== 'function') {
          console.error('[CardPaymentBrick] callbacks obrigatórios ausentes', {
            onReady: typeof settings.callbacks.onReady,
            onError: typeof settings.callbacks.onError,
          });
          throw new Error('Callbacks onReady e/ou onError são obrigatórios para o Brick de cartão.');
        }

        const createPromise = bricksBuilder.create('cardPayment', 'cardPaymentBrick_container', settings).then((controller: any) => {
          if (!mountedRef.current || finishedRef.current) {
            try {
              controller?.unmount?.();
            } catch {}
            return null;
          }
          return controller;
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutRef.current = setTimeout(() => {
            reject(new Error('Tempo esgotado ao carregar o formulário de cartão.'));
          }, INIT_TIMEOUT_MS);
        });

        const controller = await Promise.race([createPromise, timeoutPromise]);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        if (!mountedRef.current || finishedRef.current) {
          if (controller) {
            try {
              controller.unmount?.();
            } catch {}
          }
          return;
        }

        if (controller) {
          window.cardPaymentBrickController = controller;
          setLoading(false);
        } else {
          throw new Error('Brick de cartão não retornou um controlador válido.');
        }
      } catch (err: any) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        finishedRef.current = true;
        if (!mountedRef.current) return;

        const message = err?.message || 'Erro ao inicializar formulário de cartão.';
        console.error('[CardPaymentBrick] init error', { message, attempt: retryCount + 1 });

        if (retryCount < MAX_RETRIES) {
          console.log('[CardPaymentBrick] tentando novamente...', { nextAttempt: retryCount + 2 });
          setTimeout(() => {
            if (mountedRef.current) setRetryCount((c) => c + 1);
          }, 1000 * (retryCount + 1));
        } else {
          setError('Não foi possível carregar o formulário de cartão no momento. Tente novamente ou use o PIX.');
          setLoading(false);
          onErrorRef.current?.(err);
        }
      }
    };

    initBrick();

    return () => {
      mountedRef.current = false;
      finishedRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (window.cardPaymentBrickController) {
        try {
          window.cardPaymentBrickController.unmount?.();
        } catch {}
        window.cardPaymentBrickController = undefined;
      }
    };
  }, [publicKey, amount, email, retryCount]);

  return (
    <div className="space-y-4">
      {loading && (
        <div className="flex flex-col items-center justify-center py-8 text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3" />
          <p className="text-sm">Carregando formulário de cartão...</p>
          {retryCount > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Tentativa {retryCount + 1} de {MAX_RETRIES + 1}
            </p>
          )}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 space-y-3">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setRetryCount((c) => c + 1)}
            className="text-sm font-semibold underline hover:text-red-800"
          >
            Tentar novamente
          </button>
        </div>
      )}
      <div id="cardPaymentBrick_container" ref={containerRef} />
    </div>
  );
};

export default CardPaymentBrick;
