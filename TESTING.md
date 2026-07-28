# Testes Automatizados

Esta suíte de testes end-to-end usa [Playwright](https://playwright.dev) para garantir que os fluxos críticos do site funcionem antes de qualquer deploy.

## Rodar os testes

```bash
npm run test:e2e
```

Para abrir o modo interativo (UI):

```bash
npx playwright test --ui
```

## O que é coberto

- **Login / Captura de lead:** preenchimento manual do formulário inicial e avanço sem erros.
- **Fluxo 1-8 do formulário:** preenchimento de todas as etapas (pessoal, experiência, educação, habilidades, idiomas, objetivo) até a tela de planos.
- **IA com fallback:** simulação de resposta 429 da OpenAI, verificando que o fallback de template preenche o campo sem exibir mensagem de erro vermelha.
- **Checkout PIX:** interceptação da criação de pagamento e verificação do QR code e código copia-e-cola.
- **Checkout cartão:** mock do SDK do Mercado Pago garantindo que o Brick de cartão inicializa com os callbacks `onReady`, `onError` e `onSubmit` corretos, sem o erro `missing_required_callbacks`.
- **CEP:** digitação caractere por caractere e preenchimento automático do endereço.
- **Download e limite de downloads:** confirmação de que download automático é acionado e que, quando a cota acaba, o usuário não vê JSON cru na tela.
- **API de download:** requisições de navegador são redirecionadas (`307`) para `/`, enquanto requisições `Accept: application/json` recebem a resposta JSON esperada.

## Regras de regressão

Antes de fazer merge/deploy de qualquer alteração nos fluxos abaixo, **rode `npm run test:e2e`** e confirme que todos os testes passam:

- Pagamento (PIX, cartão, download)
- IA e templates de fallback
- Login / captura de lead
- Formulário multi-etapas e CEP

## Limitações conhecidas

- O login com Google via popup Firebase não é testado automaticamente por exigir interação com domínios de terceiros. A captura manual de lead é usada como proxy para validar o fluxo de entrada.
- Os testes rodam contra um servidor de desenvolvimento (`next dev`) na porta `3001`.
