import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Serviço de IA não configurado.' },
      { status: 503 }
    );
  }

  try {
    const { text, context } = await request.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Texto é obrigatório.' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            `Você é um especialista em currículos e sistemas ATS (Applicant Tracking Systems). Sua tarefa é transformar textos simples em descrições de alto impacto otimizadas para robôs de RH.

REGRAS OBRIGATÓRIAS:
1. Use verbos de ação forte no infinitivo pessoal (ex: "Gerenciar", "Implementar", "Desenvolver" em vez de "Eu gerenciava")
2. Inclua conquistas quantificáveis sempre que possível (porcentagens, números, metas batidas, eficiência)
3. Incorpore palavras-chave que sistemas ATS priorizam na área
4. Seja conciso e direto (máximo 150 palavras)
5. Use linguagem profissional e corporativa
6. Foque em resultados e impacto, não apenas responsabilidades

EXEMPLOS:
- "Eu organizava planilhas e atendia clientes" → "Gerenciar dados operacionais via planilhas de alta precisão e excelência no suporte ao cliente, aumentando a eficiência do setor em 15%"
- "Fazia vendas" → "Impulsionar vendas estratégicas, alcançando 120% da meta trimestral e expandindo base de clientes em 25%"
- "Liderava equipe" → "Liderar equipe multifuncional de 10 colaboradores, implementando processos que reduziram tempo de entrega em 30%"

Retorne APENAS o texto melhorado, sem explicações ou comentários adicionais.`,
        },
        {
          role: 'user',
          content: `Contexto: ${context || 'Currículo profissional'}\n\nTexto para melhorar:\n${text}`,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const enhanced = completion.choices[0]?.message?.content?.trim() || text;

    return NextResponse.json({ enhanced });
  } catch (error) {
    console.error('AI enhance error:', error);
    return NextResponse.json(
      { error: 'Falha ao processar texto com IA.' },
      { status: 500 }
    );
  }
}
