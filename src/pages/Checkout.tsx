import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, ArrowLeft, Copy, QrCode, Clock } from 'lucide-react';
import { useResume } from '../context/ResumeContext';
import { createTransaction, listenToTransaction } from '../services/firebase';

interface CheckoutProps {
  onBack: () => void;
  onPaymentSuccess: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ onBack, onPaymentSuccess }) => {
  const { resume } = useResume();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [showQrCode, setShowQrCode] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pendente' | 'pago' | 'cancelado'>('pendente');

  const pixKey = '00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-42661417400052040000530398654058.985802BR5913LS SOLUCOES6008SAO PAULO62070503***6304E2CA';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixKey)}`;

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Create transaction in Firestore
      const txId = await createTransaction(
        resume.id || 'draft',
        resume.personalInfo.email || 'cliente@email.com'
      );
      setTransactionId(txId);
      setShowQrCode(true);

      // Listen for payment status changes
      const unsubscribe = listenToTransaction(txId, (status) => {
        setPaymentStatus(status as 'pendente' | 'pago' | 'cancelado');
        
        if (status === 'pago') {
          unsubscribe();
          setIsProcessing(false);
          onPaymentSuccess();
        }
      });

      // Simulate payment for demo (remove in production)
      setTimeout(() => {
        setPaymentStatus('pago');
        unsubscribe();
        setIsProcessing(false);
        onPaymentSuccess();
      }, 5000);
    } catch (error) {
      console.error('Payment error:', error);
      setIsProcessing(false);
    }
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    return () => {
      // Cleanup listener if component unmounts
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-6 transition font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar ao Editor
        </button>

        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Checkout Seguro
            </h1>
            <p className="text-gray-600 mt-2">Complete o pagamento para liberar seu currículo premium</p>
          </div>

          {/* Order Summary */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 mb-8 border border-purple-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Pedido</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Currículo Profissional PDF</span>
                <span className="font-medium">R$ 8,98</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-purple-200">
                <span className="font-bold text-gray-900">Total a Pagar</span>
                <span className="font-bold text-2xl text-purple-600">R$ 8,98</span>
              </div>
            </div>
          </div>

          {!showQrCode ? (
            <>
              {/* Payment Method Selection */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Escolha o Método de Pagamento</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => setPaymentMethod('pix')}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-300 flex items-center gap-4 ${
                      paymentMethod === 'pix'
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-sm">PIX</span>
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-gray-900">PIX</p>
                      <p className="text-sm text-gray-600">Pagamento instantâneo</p>
                    </div>
                    {paymentMethod === 'pix' && (
                      <CheckCircle className="w-6 h-6 text-purple-600" />
                    )}
                  </button>

                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-300 flex items-center gap-4 ${
                      paymentMethod === 'card'
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="w-12 h-12 text-blue-600" />
                    <div className="text-left flex-1">
                      <p className="font-semibold text-gray-900">Cartão de Crédito</p>
                      <p className="text-sm text-gray-600">Visa, Mastercard, Elo</p>
                    </div>
                    {paymentMethod === 'card' && (
                      <CheckCircle className="w-6 h-6 text-purple-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Continuar para Pagamento
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* QR Code Display */}
              <div className="text-center">
                <div className="bg-white rounded-2xl p-8 shadow-inner border-2 border-dashed border-purple-200 mb-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-gray-600">Aguardando pagamento...</span>
                  </div>
                  
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code PIX" 
                    className="mx-auto mb-4 rounded-lg shadow-md"
                  />
                  
                  <button
                    onClick={copyPixKey}
                    className="flex items-center gap-2 mx-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm font-medium text-gray-700"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copiado!' : 'Copiar Chave Pix'}
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>Instrução:</strong> Abra o app do seu banco e escaneie o QR Code acima ou copie a chave Pix.
                  </p>
                </div>

                {paymentStatus === 'pendente' && (
                  <div className="flex items-center justify-center gap-2 text-yellow-600">
                    <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                    <span className="font-medium">Verificando pagamento...</span>
                  </div>
                )}

                {paymentStatus === 'pago' && (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-bold">Pagamento confirmado!</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Security Info */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Pagamento seguro e criptografado</span>
            </div>
            <p className="text-xs text-gray-400">
              Após o pagamento, você receberá o link para download por e-mail
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
