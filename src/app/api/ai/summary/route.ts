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
    const { experience, skills } = await request.json();

    if (!experience?.length || !skills?.length) {
      return NextResponse.json(
        { error: 'Experiência e habilidades são obrigatórias.' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const expSummary = experience
      .map(
        (e: { position: string; company: string; description: string }) =>
          `${e.position} na ${e.company}: ${e.description}`
      )
      .join('\n');

    const skillsList = skills.map((s: { name: string }) => s.name).join(', ');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Gere um resumo profissional conciso (máximo 150 palavras) em português brasileiro, otimizado para ATS. Retorne apenas o resumo, sem explicações.',
        },
        {
          role: 'user',
          content: `Experiências:\n${expSummary}\n\nHabilidades: ${skillsList}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const summary = completion.choices[0]?.message?.content?.trim() || '';

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('AI summary error:', error);
    return NextResponse.json(
      { error: 'Falha ao gerar resumo com IA.' },
      { status: 500 }
    );
  }
}
