'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Clock, CheckCircle, AlertCircle, Download, Mail, Copy, Check } from 'lucide-react';
import { useResume } from '../context/ResumeContext';
import { useLanguage } from '@/context/LanguageContext';
import CardPaymentBrick, { CardPaymentData, getMercadoPagoDeviceId } from './CardPaymentBrick';
import { trackPurchase, trackGoogleAdsConversion } from '@/lib/gtag';
import { trackMetaPurchase } from '@/lib/metaPixel';
import { downloadPdf } from '@/lib/downloadPdf';

interface PaymentData {
  id: string;
  qr_code: string;
  qr_code_base64: string;
}

const fetchWithTimeout = (url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
};

const createPixPayment = async (amount: number, email: string, leadId?: string, plan?: string): Promise<PaymentData> => {
  const res = await fetchWithTimeout('/api/payment/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, email, leadId, plan }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao criar pagamento.');
  }

  return res.json();
};

interface CardPaymentResult {
  id: string;
  status: string;
  status_detail?: string;
  message?: string;
}

const createCardPayment = async (
  formData: CardPaymentData,
  amount: number,
  email: string,
  leadId?: string,
  plan?: string,
  payerName?: string
): Promise<CardPaymentResult> => {
  const deviceId = await getMercadoPagoDeviceId();
  const res = await fetchWithTimeout('/api/payment/card', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...formData,
      amount,
      email,
      leadId,
      plan,
      payerName,
      deviceId,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao processar pagamento com cartão.');
  }

  return res.json();
};

interface SearchPaymentResult {
  approved: boolean;
  paymentId?: string;
}

const searchPaymentByReference = async (leadId?: string): Promise<SearchPaymentResult> => {
  if (!leadId) return { approved: false };
  const res = await fetchWithTimeout(`/api/payment/search?external_reference=${encodeURIComponent(leadId)}`);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao buscar pagamento.');
  }

  return res.json();
};

interface PaymentStatusResponse {
  approved: boolean;
  amount?: number | null;
  qr_code?: string;
  qr_code_base64?: string;
}

const checkPaymentStatus = async (paymentId: string): Promise<PaymentStatusResponse> => {
  const res = await fetchWithTimeout(`/api/payment/status/${paymentId}`);

  if (!res.ok) {
    return { approved: false };
  }

  const data = await res.json();
  return {
    approved: data.approved === true,
    amount: data.amount,
    qr_code: data.qr_code,
    qr_code_base64: data.qr_code_base64,
  };
};

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 60; // 5 minutos de polling

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentId?: string) => void;
  amount?: number;
  plan?: string;
}

const publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || '';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  amount = 0,
  plan,
}) => {
  const { resume } = useResume();
  const { t } = useLanguage();
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [cardPaymentId, setCardPaymentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pixConfirmed, setPixConfirmed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'failed'>('pending');
  const [pixCopied, setPixCopied] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [restoredAmount, setRestoredAmount] = useState<number | null>(null);
  const pollCountRef = useRef(0);
  const isMountedRef = useRef(true);
  const purchaseTrackedRef = useRef(false);
  const pixInFlightRef = useRef(false);
  const onPaymentSuccessRef = useRef(onPaymentSuccess);

  useEffect(() => {
    onPaymentSuccessRef.current = onPaymentSuccess;
  }, [onPaymentSuccess]);

  const PAYMENT_ID_KEY = 'checkout_payment_id';
  const PAYMENT_METHOD_KEY = 'checkout_payment_method';

  const savePaymentId = (id: string, method: string) => {
    try {
      localStorage.setItem(PAYMENT_ID_KEY, id);
      localStorage.setItem(PAYMENT_METHOD_KEY, method);
    } catch { /* localStorage may be disabled */ }
  };

  const clearPaymentId = () => {
    try {
      localStorage.removeItem(PAYMENT_ID_KEY);
      localStorage.removeItem(PAYMENT_METHOD_KEY);
    } catch { /* ignore */ }
  };

  const getSavedPaymentId = (): { id: string; method: string } | null => {
    try {
      const id = localStorage.getItem(PAYMENT_ID_KEY);
      const method = localStorage.getItem(PAYMENT_METHOD_KEY);
      if (id) return { id, method: method || 'pix' };
    } catch { /* ignore */ }
    return null;
  };

  const resetPaymentState = () => {
    setPaymentData(null);
    setCardPaymentId(null);
    setError(null);
    setPaymentStatus('pending');
    setPixCopied(false);
    setDownloadUrl(null);
    setEmailSent(false);
    setDeliveryError(null);
    setRestoredAmount(null);
    setPixConfirmed(false);
    pollCountRef.current = 0;
    purchaseTrackedRef.current = false;
  };

  const copyPixCode = async () => {
    if (!paymentData?.qr_code) return;
    const code = paymentData.qr_code;

    // Tenta clipboard API primeiro (funciona em Chrome/Safari normais).
    try {
      await navigator.clipboard.writeText(code);
      setPixCopied(true);
      setTimeout(() => {
        if (isMountedRef.current) setPixCopied(false);
      }, 2500);
      return;
    } catch (err) {
      console.warn('CheckoutModal: clipboard API failed, trying fallback', err);
    }

    // Fallback: cria textarea temporário, seleciona e executa copy.
    // Funciona na maioria dos navegadores in-app (Instagram/Facebook).
    try {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (ok) {
        setPixCopied(true);
        setTimeout(() => {
          if (isMountedRef.current) setPixCopied(false);
        }, 2500);
        return;
      }
    } catch (fallbackErr) {
      console.error('CheckoutModal: copy PIX fallback failed', fallbackErr);
    }

    // Último recurso: abre prompt para o usuário copiar manualmente
    // (ainda dentro do navegador in-app, sem sair do app).
    try {
      window.prompt('Copie o código PIX abaixo:', code);
    } catch {
      // Alguns navegadores in-app podem bloquear prompt
    }
  };

  const isPurchaseTracked = (pid: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      return sessionStorage.getItem(`purchase_tracked_${pid}`) === '1';
    } catch {
      return false;
    }
  };

  const markPurchaseTracked = (pid: string): void => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(`purchase_tracked_${pid}`, '1');
    } catch {
      // sessionStorage pode estar desabilitado
    }
  };

  const firePurchaseEvents = (paymentId: string) => {
    if (purchaseTrackedRef.current || isPurchaseTracked(paymentId)) return;
    purchaseTrackedRef.current = true;
    markPurchaseTracked(paymentId);
    trackPurchase({
      transactionId: paymentId,
      value: amount,
      paymentMethod,
      plan,
    });
    trackMetaPurchase({
      transactionId: paymentId,
      value: amount,
      paymentMethod,
      plan,
    });
    trackGoogleAdsConversion({
      transactionId: paymentId,
      value: amount,
    });
  };

  const completePaymentAndDownload = useCallback(
    async (paymentId: string) => {
      setDeliveryError(null);
      let lastError = '';
      let wasConfirmed = false;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await fetchWithTimeout(
            '/api/payment/complete',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentId,
                resume,
                email: resume.personalInfo.email,
              }),
            },
            15000
          );

          const data = await res.json().catch(() => ({}));

          if (res.ok && data.success && data.downloadUrl) {
            if (isMountedRef.current) {
              setDownloadUrl(data.downloadUrl);
              setEmailSent(data.emailSent === true);
            }
            wasConfirmed = true;

            try {
              await downloadPdf(data.downloadUrl, 2);
            } catch (downloadErr) {
              const downloadMessage = downloadErr instanceof Error ? downloadErr.message : 'Download automático não iniciou. Use o botão abaixo.';
              console.error('[CheckoutModal] download automático falhou', { error: downloadMessage, paymentId });
              if (isMountedRef.current) {
                const hasEmail = data.emailSent === true;
                setDeliveryError(
                  hasEmail
                    ? `${downloadMessage} — também enviamos o PDF para o e-mail cadastrado. Verifique a caixa de entrada e o spam.`
                    : downloadMessage
                );
              }
            }
            onPaymentSuccessRef.current(paymentId);
            return;
          }

          lastError = data.error || `Tentativa ${attempt} falhou`;
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
        }

        if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      }

      if (isMountedRef.current) {
        setDeliveryError(lastError || 'Não foi possível preparar o download automático.');
        onPaymentSuccessRef.current(paymentId);
      }
    },
    [resume, amount, paymentMethod, plan]
  );

  const createPayment = useCallback(async () => {
    if (!resume.personalInfo.email) {
      setError('E-mail não encontrado. Preencha seus dados pessoais.');
      return;
    }

    if (!amount || amount <= 0) {
      setError('Valor do pagamento inválido. Selecione um plano.');
      return;
    }

    if (paymentMethod !== 'pix') return;

    // Evita gerar múltiplas cobranças PIX para o mesmo checkout quando o efeito
    // reexecuta (cada chamada cria um pagamento novo no Mercado Pago).
    if (pixInFlightRef.current) return;
    pixInFlightRef.current = true;

    setIsLoading(true);
    resetPaymentState();

    try {
      const data = await createPixPayment(amount, resume.personalInfo.email, resume.id, plan);
      if (isMountedRef.current) {
        setPaymentData(data);
        savePaymentId(data.id, 'pix');
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erro ao criar pagamento. Tente novamente.');
      }
      console.error('CheckoutModal: create payment error', err);
    } finally {
      pixInFlightRef.current = false;
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [amount, resume.personalInfo.email, resume.id, paymentMethod, plan]);

  const handleCardError = useCallback((err: any) => {
    console.error('Card brick error', err);
  }, []);

  const handleCardSubmit = useCallback(
    async (formData: CardPaymentData) => {
      if (!resume.personalInfo.email) {
        throw new Error('E-mail não encontrado. Preencha seus dados pessoais.');
      }

      if (!amount || amount <= 0) {
        throw new Error('Valor do pagamento inválido. Selecione um plano.');
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await createCardPayment(
          formData,
          amount,
          resume.personalInfo.email,
          resume.id,
          plan,
          resume.personalInfo.fullName
        );
        if (!isMountedRef.current) return;

        setCardPaymentId(result.id);
        savePaymentId(result.id, 'card');

        console.log('[CheckoutModal] card payment created', {
          paymentId: result.id,
          status: result.status,
          statusDetail: result.status_detail,
        });

        if (result.status === 'approved') {
          setPaymentStatus('approved');
          firePurchaseEvents(result.id);
          completePaymentAndDownload(result.id);
          return;
        }

        // Qualquer status que não seja 'approved' é tratado como não aprovado.
        // Em particular, 'in_process'/'pending' exibe a mensagem do backend sem
        // marcar como aprovado, e o botão "Já paguei — Verificar" fica disponível.
        const message =
          result.message ||
          'Não foi possível concluir o pagamento com cartão. Tente outro cartão ou pague com PIX.';

        if (result.status === 'in_process' || result.status === 'pending') {
          setError(message);
          return;
        }

        // Recusado/cancelado/expirado: rejeita a promise para o Brick liberar o
        // formulário e permitir outro cartão.
        setPaymentStatus('failed');
        throw new Error(message);
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Erro ao processar cartão. Tente novamente.');
        }
        console.error('CheckoutModal: card submit error', err);
        throw err;
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [amount, resume.personalInfo.email, resume.id, plan]
  );

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetPaymentState();

      // Recovery: check for payment from a previous session/reload
      const saved = getSavedPaymentId();
      if (saved) {
        const checkSavedPayment = async () => {
          try {
            const statusResult = saved.method === 'pix'
              ? await checkPaymentStatus(saved.id)
              : { approved: await checkCardPaymentStatus(saved.id) };

            if (!isMountedRef.current) return;

            if (statusResult.approved) {
              setPaymentStatus('approved');
              firePurchaseEvents(saved.id);
              completePaymentAndDownload(saved.id);
            } else if (saved.method === 'pix') {
              // Still pending — restore QR code and PIX code from API response
              setPaymentData({
                id: saved.id,
                qr_code: statusResult.qr_code || '',
                qr_code_base64: statusResult.qr_code_base64 || '',
              });
              setPixConfirmed(true);
              // Restore amount if the API returned it
              if (statusResult.amount && statusResult.amount > 0) {
                setRestoredAmount(statusResult.amount);
              }
            } else {
              setCardPaymentId(saved.id);
            }
          } catch (err) {
            console.error('[CheckoutModal] recovery check failed', err);
            clearPaymentId();
          }
        };
        checkSavedPayment();
      }
    } else {
      // Don't clear payment ID on close — allow recovery on next open or reload
    }
  }, [isOpen]);

  useEffect(() => {
    resetPaymentState();
  }, [paymentMethod, amount]);

  useEffect(() => {
    if (isOpen && paymentMethod === 'pix' && pixConfirmed && !paymentData && resume.personalInfo.email) {
      createPayment();
    }
  }, [isOpen, paymentMethod, pixConfirmed, paymentData, resume.personalInfo.email, createPayment]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (paymentStatus === 'pending' && paymentData && paymentMethod === 'pix') {
      interval = setInterval(async () => {
        try {
          if (pollCountRef.current >= MAX_POLL_ATTEMPTS) {
            clearInterval(interval);
            if (isMountedRef.current) {
              setError(t('pricing.pollTimeout'));
            }
            return;
          }

          pollCountRef.current += 1;
          const statusResult = await checkPaymentStatus(paymentData.id);

          if (!isMountedRef.current) return;

          if (statusResult.approved) {
            setPaymentStatus('approved');
            firePurchaseEvents(paymentData.id);
            completePaymentAndDownload(paymentData.id);
            clearInterval(interval);
          }
        } catch (err) {
          console.error('CheckoutModal: polling error', err);
          // Não interrompe o polling por um erro isolado
        }
      }, POLL_INTERVAL_MS);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [paymentStatus, paymentData, paymentMethod]);

  const checkCardPaymentStatus = async (paymentId: string): Promise<boolean> => {
    const res = await fetchWithTimeout(`/api/payment/status/${paymentId}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Erro ${res.status} ao verificar o pagamento.`);
    }
    const data = await res.json();
    return data.approved === true;
  };

  const handleCheckStatus = async () => {
    if (paymentMethod === 'pix' && !paymentData) return;
    if (paymentMethod === 'card' && !cardPaymentId) return;

    setIsChecking(true);
    try {
      const paymentId = paymentMethod === 'pix' ? paymentData?.id : cardPaymentId;
      if (!paymentId) {
        setError(t('pricing.paymentIdNotFound'));
        return;
      }

      const statusResult = await (paymentMethod === 'pix'
        ? checkPaymentStatus(paymentId)
        : Promise.resolve({ approved: await checkCardPaymentStatus(paymentId) }));

      if (statusResult.approved) {
        setPaymentStatus('approved');
        firePurchaseEvents(paymentId);
        completePaymentAndDownload(paymentId);
      } else {
        setError(
          paymentMethod === 'pix'
            ? t('pricing.pendingPix')
            : t('pricing.pendingCard')
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao verificar status do pagamento.');
      console.error('CheckoutModal: manual status check error', err);
    } finally {
      setIsChecking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90dvh] overflow-y-auto p-6 relative animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 transition rounded-lg hover:bg-gray-100"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {paymentStatus === 'approved' ? t('pricing.approvedTitle') : t('pricing.checkoutTitle')}
          </h2>
          <p className="text-gray-600">
            {paymentStatus === 'approved'
              ? t('payment.modalSubtitleApproved')
              : `Total: ${formatCurrency(amount > 0 ? amount : (restoredAmount ?? 0))}`}
          </p>
        </div>

        {paymentStatus !== 'approved' && (
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            <button
              onClick={() => setPaymentMethod('pix')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                paymentMethod === 'pix'
                  ? 'bg-white text-emerald-700 shadow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              PIX
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                paymentMethod === 'card'
                  ? 'bg-white text-emerald-700 shadow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('payment.cardTab')}
            </button>
          </div>
        )}

        {isLoading && paymentMethod === 'pix' && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
            <p className="text-gray-600">{t('pricing.generatingQr')}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
              {!isLoading && paymentMethod === 'pix' && (
                <button
                  onClick={createPayment}
                  className="mt-3 text-sm font-semibold text-red-700 underline hover:text-red-800"
                >
                  {t('pricing.tryAgain')}
                </button>
              )}
            </div>
          </div>
        )}

        {!isLoading && paymentStatus !== 'approved' && paymentMethod === 'pix' && !paymentData && !pixConfirmed && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-gray-700">
              <p className="font-semibold text-emerald-800 mb-1">{t('pricing.pixTitle')}</p>
              <p>{t('pricing.pixDesc')}</p>
            </div>
            <button
              type="button"
              onClick={() => setPixConfirmed(true)}
              className="w-full bg-emerald-600 text-white py-4 rounded-xl font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-2"
            >
              {t('pricing.generateQr')}
            </button>
          </div>
        )}

        {!isLoading && paymentStatus !== 'approved' && paymentMethod === 'pix' && paymentData && (
          <div className="space-y-4">
            {paymentData.qr_code_base64 ? (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4 flex items-center justify-center">
                <img
                  src={`data:image/png;base64,${paymentData.qr_code_base64}`}
                  alt="QR Code PIX"
                  className="w-48 h-48"
                />
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-600">
                {t('pricing.pixQrUnavailable')}
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs text-gray-500">{t('pricing.pixCodeLabel')}</p>
              <p className="text-xs text-gray-700 break-all font-mono">
                {paymentData.qr_code}
              </p>
              <button
                type="button"
                onClick={copyPixCode}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
              >
                {pixCopied ? (
                  <>
                    <Check className="w-4 h-4" /> {t('pricing.copied')}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> {t('pricing.copyPixCode')}
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 rounded-xl p-3">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{t('pricing.autoConfirm')}</span>
            </div>

            <button
              onClick={handleCheckStatus}
              disabled={isChecking}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isChecking ? t('pricing.verifying') : t('pricing.verifyPayment')}
            </button>
          </div>
        )}

        {!isLoading && paymentStatus !== 'approved' && paymentMethod === 'card' && (
          <div className="space-y-4">
            {amount <= 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                {t('pricing.cardSelectPlan')}
              </div>
            ) : !publicKey ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                <p className="font-semibold mb-1">{t('payment.cardMissingKey')}</p>
                <p>
                  A chave pública do Mercado Pago (NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY) não está configurada.
                  Adicione-a nas variáveis de ambiente para habilitar o formulário de cartão.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-gray-600">
                  {t('payment.cardInstructions')}
                </div>
                <CardPaymentBrick
                  publicKey={publicKey}
                  amount={amount}
                  email={resume.personalInfo.email}
                  onSubmit={handleCardSubmit}
                  onError={handleCardError}
                />
                {cardPaymentId && (
                  <button
                    onClick={handleCheckStatus}
                    disabled={isChecking}
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isChecking ? t('pricing.verifying') : t('payment.verifyPayment')}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {paymentStatus === 'approved' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{t('pricing.approvedTitle')}</h3>
              <p className="text-sm text-gray-600">
                {deliveryError
                  ? t('pricing.deliveryError')
                  : t('pricing.autoDownloadStarted')}
              </p>
            </div>
            {emailSent && (
              <div className="flex items-center justify-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg py-2">
                <Mail className="w-4 h-4" />
                <span>{t('pricing.emailSent')}</span>
              </div>
            )}
            {deliveryError && (
              <div className="text-sm text-red-700 bg-red-50 rounded-lg p-3">
                {deliveryError}
              </div>
            )}
            {downloadUrl ? (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await downloadPdf(downloadUrl, 0);
                      setDeliveryError(null);
                    } catch (err) {
                      console.error('[CheckoutModal] download manual falhou', err);
                      const baseMessage = err instanceof Error ? err.message : 'Não foi possível baixar o arquivo. Tente novamente mais tarde.';
                      setDeliveryError(
                        emailSent
                          ? `${baseMessage} — também enviamos o PDF para o e-mail cadastrado. Verifique a caixa de entrada e o spam.`
                          : baseMessage
                      );
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition"
                >
                  <Download className="w-5 h-5" />
                  {t('pricing.downloadBtn')}
                </button>
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full bg-white border-2 border-green-600 text-green-700 py-3 rounded-xl font-semibold hover:bg-green-50 transition"
                >
                  {t('pricing.openPdfNewTab')}
                </a>
              </>
            ) : deliveryError ? (
              <button
                onClick={() => {
                  const pid = paymentData?.id || cardPaymentId;
                  if (pid) completePaymentAndDownload(pid);
                }}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
              >
                Tentar preparar download novamente
              </button>
            ) : null}
            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-900 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              {t('common.close')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckoutModal;
