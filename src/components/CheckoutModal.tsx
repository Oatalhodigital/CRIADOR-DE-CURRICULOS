'use client'

import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useResume } from '../context/ResumeContext';

interface PaymentData {
  id: string;
  qr_code: string;
  qr_code_base64: string;
}

const createPixPayment = async (amount: number, email: string, leadId?: string): Promise<PaymentData> => {
  const res = await fetch('/api/payment/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, email, leadId }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Erro ao criar pagamento.');
  }

  return res.json();
};

const checkPaymentStatus = async (paymentId: string): Promise<boolean> => {
  const res = await fetch(`/api/payment/status/${paymentId}`);

  if (!res.ok) {
    return false;
  }

  const data = await res.json();
  return data.approved === true;
};

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const { resume } = useResume();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'failed'>('pending');

  useEffect(() => {
    if (isOpen && !paymentData && resume.personalInfo.email) {
      createPayment();
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (paymentStatus === 'pending' && paymentData) {
      interval = setInterval(async () => {
        const isApproved = await checkPaymentStatus(paymentData.id);
        if (isApproved) {
          setPaymentStatus('approved');
          onPaymentSuccess();
          clearInterval(interval);
        }
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [paymentStatus, paymentData, onPaymentSuccess]);

  const createPayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await createPixPayment(10, resume.personalInfo.email, resume.id);
      setPaymentData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar pagamento. Tente novamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!paymentData) return;

    setIsChecking(true);
    try {
      const isApproved = await checkPaymentStatus(paymentData.id);
      if (isApproved) {
        setPaymentStatus('approved');
        onPaymentSuccess();
      } else {
        setError('Pagamento ainda não confirmado. Aguarde ou escaneie o QR Code novamente.');
      }
    } catch {
      setError('Erro ao verificar status do pagamento.');
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
              : 'Escaneie o QR Code para pagar R$ 10,00 via PIX'}
          </p>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
            <p className="text-gray-600">Gerando QR Code...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {paymentData && paymentStatus === 'pending' && (
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

        {paymentStatus === 'approved' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <button
              onClick={onPaymentSuccess}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition"
            >
              Baixar Currículo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;
