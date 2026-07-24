import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const summarySchema = z.object({
  experience: z.array(z.any()).min(1, 'Experiência é obrigatória'),
  skills: z.array(z.any()).min(1, 'Habilidades são obrigatórias'),
  profession: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Serviço de IA não configurado.' },
      { status: 503 }
    );
  }

  // Rate limiting check: 2 por minuto / 15 por hora por IP
  const clientIp = getClientIp(request);
  if (!checkRateLimit(clientIp, 2, 60 * 1000) || !checkRateLimit(`${clientIp}:hour`, 15, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Limite de chamadas de IA atingido. Tente novamente em alguns minutos.' },
      { status: 429 }
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const rawBody = await request.json();
    const parseResult = summarySchema.safeParse(rawBody);

    if (!parseResult.success) {
      clearTimeout(timeoutId);
      return NextResponse.json(
        { error: parseResult.error.errors.map((e) => e.message).join('. ') },
        { status: 400 }
      );
    }

    const { experience, skills, profession } = parseResult.data;

    const openai = new OpenAI({ apiKey, maxRetries: 2, timeout: 15000 });

    const expSummary = experience
      .map(
        (e: { position: string; company: string; description: string }) =>
          `${e.position} na ${e.company}: ${e.description}`
      )
      .join('\n');

    const skillsList = skills.map((s: { name: string }) => s.name).join(', ');

    const professionContext = profession
      ? `Foque o resumo para o cargo/profissão: ${profession}. `
      : '';

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              `${professionContext}Gere um resumo profissional conciso (máximo 150 palavras) em português brasileiro, otimizado para ATS. Retorne apenas o resumo, sem explicações.`,
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
