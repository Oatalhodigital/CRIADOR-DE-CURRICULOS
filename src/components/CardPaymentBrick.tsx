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
  }
}

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
    let isMounted = true;

    const initBrick = async () => {
      try {
        await loadScript('https://sdk.mercadopago.com/js/v2');
        if (!isMounted || !window.MercadoPago) return;

        const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' });
        const bricksBuilder = mp.bricks();

        const settings = {
          initialization: {
            amount,
            payer: { email },
          },
          callbacks: {
            onFormMounted: (formError: any) => {
              if (formError) {
                console.error('CardPaymentBrick: onFormMounted error', formError);
                setError(formError.message || 'Erro ao montar formulário de cartão');
                onError?.(formError);
              }
              setLoading(false);
            },
            onSubmit: async (formData: CardPaymentData) => {
              try {
                await onSubmit(formData);
              } catch (err) {
                console.error('CardPaymentBrick: onSubmit error', err);
                throw err;
              }
            },
            onError: (err: any) => {
              console.error('CardPaymentBrick: SDK error', err);
              const message = err?.message || 'Erro no formulário de cartão. Verifique os dados e tente novamente.';
              setError(message);
              onError?.(err);
            },
          },
          customization: {
            visual: {
              style: { theme: 'default' },
            },
          },
        };

        if (window.cardPaymentBrickController) {
          try {
            await window.cardPaymentBrickController.unmount();
          } catch {}
        }

        window.cardPaymentBrickController = await bricksBuilder.create(
          'cardPayment',
          'cardPaymentBrick_container',
          settings
        );
      } catch (err: any) {
        if (isMounted) {
          const message = err?.message || 'Erro ao inicializar formulário de cartão';
          setError(message);
          setLoading(false);
          onError?.(err);
        }
      }
    };

    initBrick();

    return () => {
      isMounted = false;
      if (window.cardPaymentBrickController) {
        try {
          window.cardPaymentBrickController.unmount?.();
        } catch {}
      }
    };
  }, [publicKey, amount, email, onSubmit, onError]);

  return (
    <div className="space-y-4">
      {loading && (
        <div className="flex flex-col items-center justify-center py-8 text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3" />
          <p className="text-sm">Carregando formulário de cartão...</p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      <div id="cardPaymentBrick_container" ref={containerRef} />
    </div>
  );
};

export default CardPaymentBrick;
