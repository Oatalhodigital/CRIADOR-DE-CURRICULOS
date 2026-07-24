import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const enhanceSchema = z.object({
  text: z.string().min(1, 'Texto é obrigatório'),
  context: z.string().optional(),
  profession: z.string().optional(),
});

// Simple in-memory cache for repeated identical requests
interface CacheEntry {
  enhanced: string;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCacheKey(text: string, context: string, profession?: string): string {
  return `${profession || ''}::${context}::${text}`;
}

function getCached(key: string): string | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.enhanced;
}

function setCached(key: string, enhanced: string): void {
  cache.set(key, { enhanced, expiresAt: Date.now() + CACHE_TTL });
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Serviço de IA não configurado.' },
      { status: 503 }
    );
  }

  // Rate limiting check: 3 por minuto / 20 por hora por IP
  const clientIp = getClientIp(request);
  if (!checkRateLimit(clientIp, 3, 60 * 1000) || !checkRateLimit(`${clientIp}:hour`, 20, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Limite de chamadas de IA atingido. Tente novamente em alguns minutos.' },
      { status: 429 }
    );
  }

  try {
    const rawBody = await request.json();
    const parseResult = enhanceSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors.map((e) => e.message).join('. ') },
        { status: 400 }
      );
    }

    const { text, context, profession } = parseResult.data;

    // Return cached result for identical input to reduce OpenAI calls
    const cacheKey = getCacheKey(text.trim(), context || '', profession);
    const cached = getCached(cacheKey);
    if (cached) {
      console.log('[api/ai/enhance] cache hit', { clientIp });
      return NextResponse.json({ enhanced: cached });
    }

    const openai = new OpenAI({
      apiKey,
      maxRetries: 3,
      timeout: 20000,
    });

    const professionContext = profession
      ? `O usuário exerce o cargo/profissão de: ${profession}. Ajuste o tom, termos técnicos e palavras-chave para esse contexto profissional.`
      : 'Ajuste o tom e palavras-chave com base no contexto fornecido.';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            `Você é um especialista em currículos e sistemas ATS (Applicant Tracking Systems). Sua tarefa é transformar textos simples em descrições de alto impacto otimizadas para robôs de RH.

${professionContext}

REGRAS OBRIGATÓRIAS:
1. Use verbos de ação forte no infinitivo impessoal (ex: "Gerenciar", "Implementar", "Desenvolver" em vez de "Eu gerenciava")
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
    setCached(cacheKey, enhanced);

    return NextResponse.json({ enhanced });
  } catch (error: any) {
    let safeHeaders: Record<string, string> | undefined = undefined;
    if (error?.headers) {
      try {
        if (typeof error.headers.entries === 'function') {
          safeHeaders = Object.fromEntries(error.headers.entries());
        } else if (typeof error.headers === 'object') {
          safeHeaders = Object.fromEntries(
            Object.entries(error.headers).map(([k, v]) => [k, String(v)])
          );
        }
      } catch {
        safeHeaders = undefined;
      }
    }
    const errorPayload = {
      message: error?.message || '',
      code: error?.code || '',
      status: error?.status || 0,
      type: error?.type || '',
      headers: safeHeaders,
      timestamp: new Date().toISOString(),
    };
    console.error('[api/ai/enhance] error:', errorPayload);

    if (error?.name === 'AbortError' || error?.code === 'ETIMEDOUT' || error?.code === 'request_timeout') {
      return NextResponse.json({ error: 'Tempo esgotado ao processar com IA.' }, { status: 504 });
    }

    const status = error?.status;
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: 'Chave da OpenAI inválida ou sem permissão.' }, { status });
    }
    if (status === 429 || error?.code === 'rate_limit_exceeded') {
      return NextResponse.json({ error: 'Limite de requisições da OpenAI atingido. Tente novamente mais tarde.' }, { status: 429 });
    }
    if (status >= 500) {
      return NextResponse.json({ error: 'Erro no serviço da OpenAI.' }, { status });
    }

    return NextResponse.json(
      { error: 'Falha ao processar texto com IA. Tente novamente em alguns segundos.' },
      { status: 500 }
    );
  }
}
