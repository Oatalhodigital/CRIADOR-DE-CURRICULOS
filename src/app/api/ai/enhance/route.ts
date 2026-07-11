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
            'Você é um especialista em currículos e ATS. Melhore textos profissionais em português brasileiro, usando verbos de ação e resultados mensuráveis. Retorne apenas o texto melhorado, sem explicações.',
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
