# Gerador de Currículos Profissionais

Um aplicativo web moderno para criação de currículos profissionais com design limpo, preenchimento rápido e monetização integrada.

## 🚀 Funcionalidades

- **Interface Split Layout**: Formulário à esquerda, preview em tempo real à direita
- **Preenchimento Passo a Passo**: Dados pessoais, experiência, formação, habilidades e resumo
- **Preview em Tempo Real**: Visualização do currículo enquanto preenche
- **Marca d'Água**: Preview com marca d'água antes do pagamento
- **Sistema de Pagamento**: Checkout simulado (preparado para integração com Mercado Pago/Asaas)
- **Geração de PDF**: Download do currículo em PDF após pagamento
- **Dashboard Admin**: Métricas de faturamento, conversão e usuários
- **Design Moderno**: Interface clean com Tailwind CSS
- **Responsivo**: Funciona em desktop e mobile

## 🛠️ Stack Tecnológica

- **Frontend**: React.js + Vite
- **Estilização**: Tailwind CSS
- **Banco de Dados**: Firebase Firestore
- **Autenticação**: Firebase Auth
- **Geração de PDF**: html2pdf.js
- **Ícones**: Lucide React
- **Pagamento**: Mock (preparado para Mercado Pago/Asaas)

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Firebase (para configuração de produção)

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

Edite o arquivo `.env` com suas credenciais do Firebase:
```
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
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
│   └── ResumePreview.tsx
├── pages/           # Páginas principais
│   ├── Checkout.tsx
│   └── Admin.tsx
├── context/         # Context API para estado global
│   └── ResumeContext.tsx
├── services/        # Serviços externos
│   └── firebase.ts
├── types/           # Definições TypeScript
│   └── resume.ts
└── utils/           # Utilitários
```

## 💰 Fluxo de Monetização

1. Usuário preenche o currículo e vê o preview com marca d'água
2. Clica em "Gerar PDF" e é redirecionado para o checkout
3. Realiza o pagamento de R$ 8,98 (PIX ou Cartão)
4. Após pagamento confirmado, o download do PDF sem marca d'água é liberado
5. Uma cópia é enviada para o e-mail do usuário

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

### GitHub Pages
1. Configure o `vite.config.js` com `base: '/seu-repositorio/'`
2. Build o projeto: `npm run build`
3. Faça deploy da pasta `dist`

## 📝 Próximos Passos

- [ ] Integração real com Mercado Pago/Asaas
- [ ] Sistema de autenticação completo
- [ ] Múltiplos templates de currículo
- [ ] Exportação em outros formatos (DOCX)
- [ ] Sistema de assinatura recorrente
- [ ] Versão mobile app (React Native/Capacitor)

## 📄 Licença

Este projeto está sob licença MIT.

## 👨‍💻 Desenvolvido por

Seu Nome - 2026
