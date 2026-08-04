import { getAppUrl } from './email';

/**
 * Mensagens amigáveis para cada `status_detail` devolvido pelo Mercado Pago.
 * Referência: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-payments/how-tos/reasons-for-rejection
 */
const STATUS_DETAIL_MESSAGES: Record<string, string> = {
  accredited: 'Pagamento aprovado.',
  pending_contingency: 'Estamos processando seu pagamento. Você receberá a confirmação por e-mail em até alguns minutos.',
  pending_review_manual: 'Seu pagamento está em análise. Avisaremos por e-mail assim que for concluída.',
  cc_rejected_bad_filled_card_number: 'Número do cartão incorreto. Confira os dados e tente novamente.',
  cc_rejected_bad_filled_date: 'Data de validade incorreta. Confira os dados e tente novamente.',
  cc_rejected_bad_filled_security_code: 'Código de segurança (CVV) incorreto. Confira e tente novamente.',
  cc_rejected_bad_filled_other: 'Algum dado do cartão está incorreto. Confira e tente novamente.',
  cc_rejected_insufficient_amount: 'Cartão sem limite ou saldo suficiente. Tente outro cartão ou pague com PIX.',
  cc_rejected_card_disabled: 'Cartão desabilitado para compras online. Ligue para o seu banco ou pague com PIX.',
  cc_rejected_call_for_authorize: 'Seu banco precisa autorizar esta compra. Ligue para o banco ou pague com PIX.',
  cc_rejected_max_attempts: 'Muitas tentativas com este cartão. Use outro cartão ou pague com PIX.',
  cc_rejected_duplicated_payment: 'Este pagamento já foi realizado. Verifique seus pagamentos antes de tentar de novo.',
  cc_rejected_invalid_installments: 'Número de parcelas não aceito por este cartão. Escolha outra opção.',
  cc_rejected_card_error: 'Não foi possível processar o cartão. Tente novamente ou pague com PIX.',
  cc_rejected_blacklist: 'Cartão recusado pelo sistema de segurança. Tente outro cartão ou pague com PIX.',
  cc_rejected_high_risk:
    'Pagamento recusado pelo sistema antifraude do Mercado Pago. Tente outro cartão ou pague com PIX (aprovação na hora).',
  cc_rejected_other_reason:
    'Cartão recusado pelo banco emissor. Tente outro cartão, entre em contato com o seu banco ou pague com PIX.',
  cc_rejected_3ds_challenge: 'A autenticação do cartão não foi concluída. Tente novamente.',
  rejected_high_risk: 'Pagamento recusado pelo sistema antifraude. Tente outro cartão ou pague com PIX.',
  expired: 'O prazo para pagamento expirou. Gere um novo pagamento.',
  by_collector: 'Pagamento cancelado.',
  by_payer: 'Pagamento cancelado.',
};

const STATUS_FALLBACK_MESSAGES: Record<string, string> = {
  approved: 'Pagamento aprovado.',
  authorized: 'Pagamento autorizado. Aguardando captura.',
  in_process: 'Seu pagamento está em análise pelo Mercado Pago. Avisaremos por e-mail assim que for concluída.',
  pending: 'Aguardando a confirmação do pagamento.',
  rejected: 'Pagamento recusado. Tente outro cartão ou pague com PIX.',
  cancelled: 'Pagamento cancelado.',
  refunded: 'Pagamento devolvido.',
  charged_back: 'Pagamento contestado pelo titular do cartão.',
};

export function getPaymentStatusMessage(status?: string, statusDetail?: string): string {
  if (statusDetail && STATUS_DETAIL_MESSAGES[statusDetail]) return STATUS_DETAIL_MESSAGES[statusDetail];
  if (status && STATUS_FALLBACK_MESSAGES[status]) return STATUS_FALLBACK_MESSAGES[status];
  return 'Não foi possível confirmar o pagamento. Tente novamente ou pague com PIX.';
}

/** Traduz o `payment_type_id` do Mercado Pago para o enum usado na tabela `orders`. */
export function normalizePaymentMethod(paymentTypeId?: string | null): 'pix' | 'credit_card' {
  if (paymentTypeId === 'credit_card' || paymentTypeId === 'debit_card') return 'credit_card';
  return 'pix';
}

/**
 * URL de notificação enviada em cada pagamento. Sem isso o Mercado Pago só
 * notifica se houver um webhook configurado no painel da conta, e pedidos pagos
 * com o navegador fechado nunca são finalizados.
 */
export function getNotificationUrl(): string | undefined {
  const appUrl = getAppUrl();
  // O Mercado Pago rejeita a criação do pagamento se a URL não for pública/HTTPS.
  if (!appUrl.startsWith('https://') || /localhost|127\.0\.0\.1/.test(appUrl)) return undefined;
  return `${appUrl}/api/payment/webhook`;
}
