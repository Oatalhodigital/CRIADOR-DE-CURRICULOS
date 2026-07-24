'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Clock, CheckCircle, AlertCircle, Download, Mail } from 'lucide-react';
import { useResume } from '../context/ResumeContext';
import CardPaymentBrick, { CardPaymentData } from './CardPaymentBrick';

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
}

const createCardPayment = async (
  formData: CardPaymentData,
  amount: number,
  email: string,
  leadId?: string,
  plan?: string
): Promise<CardPaymentResult> => {
  const res = await fetchWithTimeout('/api/payment/card', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...formData, amount, email, leadId, plan }),
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

const checkPaymentStatus = async (paymentId: string): Promise<boolean> => {
  const res = await fetchWithTimeout(`/api/payment/status/${paymentId}`);

  if (!res.ok) {
    return false;
  }

  const data = await res.json();
  return data.approved === true;
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
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [cardPaymentId, setCardPaymentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'failed'>('pending');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const pollCountRef = useRef(0);
  const isMountedRef = useRef(true);

  const resetPaymentState = () => {
    setPaymentData(null);
    setCardPaymentId(null);
    setError(null);
    setPaymentStatus('pending');
    setDownloadUrl(null);
    setEmailSent(false);
    setDeliveryError(null);
    pollCountRef.current = 0;
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const triggerDownload = (url: string) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch (e) {}
      }, 30000);
    } catch (e) {
      window.location.href = url;
    }
  };

  const completePaymentAndDownload = useCallback(
    async (paymentId: string) => {
      setDeliveryError(null);
      let lastError = '';

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
            triggerDownload(data.downloadUrl);
            onPaymentSuccess(paymentId);
            return;
          }

          lastError = data.error || `Tentativa ${attempt} falhou`;
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
        }

        if (attempt < 3) await sleep(2000 * attempt);
      }

      if (isMountedRef.current) {
        setDeliveryError(lastError || 'Não foi possível preparar o download automático.');
        onPaymentSuccess(paymentId);
      }
    },
    [resume, onPaymentSuccess]
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

    setIsLoading(true);
    resetPaymentState();

    try {
      const data = await createPixPayment(amount, resume.personalInfo.email, resume.id, plan);
      if (isMountedRef.current) {
        setPaymentData(data);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erro ao criar pagamento. Tente novamente.');
      }
      console.error('CheckoutModal: create payment error', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [amount, resume.personalInfo.email, resume.id, paymentMethod, plan]);

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
        const result = await createCardPayment(formData, amount, resume.personalInfo.email, resume.id, plan);
        if (isMountedRef.current) {
          setCardPaymentId(result.id);
          if (result.status === 'approved') {
            setPaymentStatus('approved');
            completePaymentAndDownload(result.id);
          } else {
            setError(`Pagamento ${result.status}. Verifique o status ou aguarde a confirmação.`);
          }
        }
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
    [amount, resume.personalInfo.email, resume.id, onPaymentSuccess, plan]
  );

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    resetPaymentState();
  }, [paymentMethod, amount]);

  useEffect(() => {
    if (isOpen && paymentMethod === 'pix' && !paymentData && resume.personalInfo.email) {
      createPayment();
    }
  }, [isOpen, paymentMethod, paymentData, resume.personalInfo.email, createPayment]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (paymentStatus === 'pending' && paymentData && paymentMethod === 'pix') {
      interval = setInterval(async () => {
        try {
          if (pollCountRef.current >= MAX_POLL_ATTEMPTS) {
            clearInterval(interval);
            if (isMountedRef.current) {
              setError('Tempo de espera pelo pagamento excedido. Verifique manualmente.');
            }
            return;
          }

          pollCountRef.current += 1;
          const isApproved = await checkPaymentStatus(paymentData.id);

          if (!isMountedRef.current) return;

          if (isApproved) {
            setPaymentStatus('approved');
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
  }, [paymentStatus, paymentData, paymentMethod, onPaymentSuccess]);

  const handleCheckStatus = async () => {
    if (paymentMethod === 'pix' && !paymentData) return;

    setIsChecking(true);
    try {
      if (paymentMethod === 'pix' && paymentData) {
        const isApproved = await checkPaymentStatus(paymentData.id);
        if (isApproved) {
          setPaymentStatus('approved');
          completePaymentAndDownload(paymentData.id);
        } else {
          setError('Pagamento ainda não confirmado. Aguarde ou escaneie o QR Code novamente.');
        }
      } else {
        const result = await searchPaymentByReference(resume.id);
        if (result.approved && result.paymentId) {
          setPaymentStatus('approved');
          completePaymentAndDownload(result.paymentId);
        } else {
          setError('Pagamento ainda não confirmado. Se já pagou, aguarde alguns instantes e tente novamente.');
        }
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
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {paymentStatus === 'approved' ? 'Pagamento Aprovado!' : 'Finalizar Pagamento'}
          </h2>
          <p className="text-gray-600">
            {paymentStatus === 'approved'
              ? 'Seu currículo está pronto para download'
              : `Total: ${formatCurrency(amount)}`}
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
              Cartão
            </button>
          </div>
        )}

        {isLoading && paymentMethod === 'pix' && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
            <p className="text-gray-600">Gerando QR Code...</p>
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
                  Tentar novamente
                </button>
              )}
            </div>
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
                QR Code indisponível. Use o código PIX abaixo.
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2">Código PIX (copie e cole):</p>
              <p className="text-xs text-gray-700 break-all font-mono">
                {paymentData.qr_code}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 rounded-xl p-3">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>O pagamento é confirmado automaticamente em até 5 minutos</span>
            </div>

            <button
              onClick={handleCheckStatus}
              disabled={isChecking}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isChecking ? 'Verificando...' : 'Verificar Pagamento'}
            </button>
          </div>
        )}

        {!isLoading && paymentStatus !== 'approved' && paymentMethod === 'card' && (
          <div className="space-y-4">
            {amount <= 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                Selecione um plano para habilitar o pagamento com cartão.
              </div>
            ) : !publicKey ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                <p className="font-semibold mb-1">Configuração pendente</p>
                <p>
                  A chave pública do Mercado Pago (NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY) não está configurada.
                  Adicione-a nas variáveis de ambiente para habilitar o formulário de cartão.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-gray-600">
                  Preencha os dados do cartão abaixo. A transação é processada com segurança pelo Mercado Pago.
                </div>
                <CardPaymentBrick
                  publicKey={publicKey}
                  amount={amount}
                  email={resume.personalInfo.email}
                  onSubmit={handleCardSubmit}
                  onError={(err) => console.error('Card brick error', err)}
                />
                {cardPaymentId && (
                  <button
                    onClick={handleCheckStatus}
                    disabled={isChecking}
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isChecking ? 'Verificando...' : 'Já paguei — Verificar'}
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
              <h3 className="text-lg font-bold text-gray-900">Pagamento Aprovado!</h3>
              <p className="text-sm text-gray-600">
                {deliveryError
                  ? 'Baixe o currículo manualmente abaixo.'
                  : 'O download automático começou. Se não iniciar, use o botão abaixo.'}
              </p>
            </div>
            {emailSent && (
              <div className="flex items-center justify-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg py-2">
                <Mail className="w-4 h-4" />
                <span>E-mail de confirmação enviado</span>
              </div>
            )}
            {deliveryError && (
              <div className="text-sm text-red-700 bg-red-50 rounded-lg p-3">
                {deliveryError}
              </div>
            )}
            {downloadUrl ? (
              <a
                href={downloadUrl}
                download
                className="inline-flex items-center justify-center gap-2 w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition"
              >
                <Download className="w-5 h-5" />
                Baixar Currículo
              </a>
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
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckoutModal;
