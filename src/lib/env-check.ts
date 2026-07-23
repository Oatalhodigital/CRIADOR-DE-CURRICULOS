export function warnMissingEnvVars() {
  if (typeof window !== 'undefined') return;

  const publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
  if (!publicKey) {
    console.warn(
      '[env-check] NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY não está configurada. ' +
        'O pagamento por cartão estará indisponível até que a chave pública seja adicionada.'
    );
  }
}
