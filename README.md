# Gerador de Currículos Profissionais

Um aplicativo web moderno para criação de currículos profissionais otimizados para ATS, com IA integrada, design limpo e monetização via PIX.

## 🚀 Funcionalidades

- **Interface Split Layout**: Formulário à esquerda, preview em tempo real à direita
- **Preenchimento Passo a Passo**: Dados pessoais, experiência, formação, habilidades e resumo
- **Preview em Tempo Real**: Visualização do currículo enquanto preenche
- **Layout ATS-Friendly**: Design otimizado para robôs de RH (simples, sem colunas complexas)
- **IA Integrada**: Botões "Melhorar com IA" em campos de texto para otimizar conteúdo
- **Geração Automática de Resumo**: IA gera resumo profissional baseado em experiências e habilidades
- **Sistema de Pagamento PIX**: Integração com Mercado Pago para pagamento único de R$ 10,00
- **Geração de PDF Profissional**: Download do currículo em PDF A4 após pagamento
- **Design Moderno**: Interface clean com Tailwind CSS e animações suaves
- **Responsivo**: Funciona em desktop e mobile
- **Auto-save**: Salva automaticamente no Firebase enquanto preenche

## 🛠️ Stack Tecnológica

- **Frontend**: React.js + Vite
- **Estilização**: Tailwind CSS
- **Validação**: React Hook Form + Zod
- **Geração de PDF**: @react-pdf/renderer (ATS-friendly)
- **IA**: OpenAI GPT-4o-mini
- **Pagamento**: Mercado Pago SDK
- **Banco de Dados**: Firebase Firestore
- **Autenticação**: Firebase Auth
- **Ícones**: Lucide React

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Firebase (para configuração de produção)
- Chave API da OpenAI (para recursos de IA)
- Token de acesso do Mercado Pago (para pagamentos)

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone SEU_REPOSITORIO_GITHUB
cd criador-curriculos
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```
# Firebase Configuration
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id

# OpenAI Configuration (para IA)
VITE_OPENAI_API_KEY=sk-your_openai_api_key

# Mercado Pago Configuration (para PIX)
VITE_MERCADO_PAGO_ACCESS_TOKEN=your_mercado_pago_access_token

# Admin Email
VITE_ADMIN_EMAIL=seu@email.com
```

## 🏃 Rodando o Projeto

Desenvolvimento:
```bash
npm run dev
```

Build para produção:
```bash
npm run build
```

Preview do build:
```bash
npm run preview
```

## 📁 Estrutura do Projeto

```
src/
├── components/       # Componentes reutilizáveis
│   ├── PersonalInfoForm.tsx
│   ├── ExperienceForm.tsx
│   ├── EducationForm.tsx
│   ├── SkillsForm.tsx
│   ├── SummaryForm.tsx
│   ├── ResumePreview.tsx
│   ├── ResumePDF.tsx
│   ├── AIEnhanceButton.tsx
│   └── CheckoutModal.tsx
├── pages/           # Páginas principais
│   ├── Checkout.tsx
│   └── Admin.tsx
├── context/         # Context API para estado global
│   └── ResumeContext.tsx
├── services/        # Serviços externos
│   ├── firebase.ts
│   ├── openai.ts
│   └── mercadopago.ts
├── types/           # Definições TypeScript
│   └── resume.ts
├── lib/             # Utilitários e validação
│   ├── validation.ts
│   └── utils.ts
└── utils/           # Utilitários
    └── pdfGenerator.tsx
```

## 💰 Fluxo de Monetização

1. Usuário preenche o currículo e vê o preview em tempo real
2. Pode usar IA para melhorar descrições e gerar resumo automaticamente
3. Clica em "Baixar PDF" e é redirecionado para o checkout PIX
4. Realiza o pagamento de R$ 10,00 via Mercado Pago
5. Sistema verifica pagamento automaticamente a cada 5 segundos
6. Após confirmação, download do PDF ATS-friendly é liberado
7. Dados são salvos no Firebase com status de pagamento

## 🤖 Recursos de IA

- **Melhoria de Texto**: Botão "IA" em campos de experiência para otimizar descrições
- **Geração de Resumo**: IA cria resumo profissional baseado em experiências e habilidades
- **Otimização ATS**: Textos são melhorados para passar em robôs de RH
- **Verbos de Ação**: IA sugere verbos fortes e resultados mensuráveis

## 🔐 Dashboard Admin

Acesse `/admin` para visualizar:
- Total de currículos criados
- Faturamento total
- Taxa de conversão
- Lista de últimos usuários e status de pagamento

## 🚀 Deploy

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

## 📝 Notas Importantes

- **Segurança**: Chaves de API devem ser configuradas como variáveis de ambiente
- **Produção**: Mercado Pago SDK deve ser usado server-side para maior segurança
- **Custos**: OpenAI cobra por token usado; considere limites de uso
- **ATS**: O layout foi desenhado para ser compatível com principais sistemas ATS

## 📄 Licença

Este projeto está sob licença MIT.

## 👨‍💻 Desenvolvido por

Leandro Sena | LS - Soluções Digitais - 2026
