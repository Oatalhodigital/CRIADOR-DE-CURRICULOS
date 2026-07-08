import React, { useState } from 'react';
import { CreditCard, CheckCircle, ArrowLeft } from 'lucide-react';
import { useResume } from '../context/ResumeContext';

interface CheckoutProps {
  onBack: () => void;
  onPaymentSuccess: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ onBack, onPaymentSuccess }) => {
  const { resume } = useResume();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess();
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
        <p className="text-gray-600 mb-8">Complete o pagamento para baixar seu currículo sem marca d'água</p>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Pedido</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Currículo Profissional PDF</span>
              <span className="font-medium">R$ 8,98</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-xl text-purple-600">R$ 8,98</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Método de Pagamento</h2>
          <div className="space-y-3">
            <button
              onClick={() => setPaymentMethod('pix')}
              className={`w-full p-4 rounded-lg border-2 transition flex items-center gap-4 ${
                paymentMethod === 'pix'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PIX</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">PIX</p>
                <p className="text-sm text-gray-600">Pagamento instantâneo</p>
              </div>
              {paymentMethod === 'pix' && (
                <CheckCircle className="w-6 h-6 text-purple-600 ml-auto" />
              )}
            </button>

            <button
              onClick={() => setPaymentMethod('card')}
              className={`w-full p-4 rounded-lg border-2 transition flex items-center gap-4 ${
                paymentMethod === 'card'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <CreditCard className="w-12 h-12 text-blue-600" />
              <div className="text-left">
                <p className="font-semibold text-gray-900">Cartão de Crédito</p>
                <p className="text-sm text-gray-600">Visa, Mastercard, Elo</p>
              </div>
              {paymentMethod === 'card' && (
                <CheckCircle className="w-6 h-6 text-purple-600 ml-auto" />
              )}
            </button>
          </div>
        </div>

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full bg-purple-600 text-white py-4 rounded-lg hover:bg-purple-700 transition font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Pagar R$ 8,98
            </>
          )}
        </button>

        {/* Security Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Pagamento seguro e criptografado</p>
          <p className="mt-1">Após o pagamento, você receberá o link para download por e-mail</p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
