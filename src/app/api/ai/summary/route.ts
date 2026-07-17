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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const { experience, skills } = await request.json();

    if (!experience?.length || !skills?.length) {
      clearTimeout(timeoutId);
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
      }, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const summary = completion.choices[0]?.message?.content?.trim() || '';

      return NextResponse.json({ summary });
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('AI summary error:', error);

      if (error?.name === 'AbortError' || error?.code === 'ETIMEDOUT') {
        return NextResponse.json({ error: 'Tempo esgotado ao gerar resumo com IA.' }, { status: 504 });
      }

      const status = error?.status;
      if (status === 401 || status === 403) {
        return NextResponse.json({ error: 'Chave da OpenAI inválida ou sem permissão.' }, { status });
      }
      if (status === 429) {
        return NextResponse.json({ error: 'Limite de requisições da OpenAI atingido. Tente novamente mais tarde.' }, { status });
      }
      if (status >= 500) {
        return NextResponse.json({ error: 'Erro no serviço da OpenAI.' }, { status });
      }

      return NextResponse.json(
        { error: 'Falha ao gerar resumo com IA.' },
        { status: 500 }
      );
    }
}
