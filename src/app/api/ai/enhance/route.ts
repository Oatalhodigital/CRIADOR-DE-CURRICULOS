import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Simple in-memory rate limiter (for production, consider using Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // 10 requests per hour per IP
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

function getClientIp(request: NextRequest): string {
  // Try various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  return ip;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Serviço de IA não configurado.' },
      { status: 503 }
    );
  }

  // Rate limiting check
  const clientIp = getClientIp(request);
  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { error: 'Limite de chamadas de IA atingido. Tente novamente em 1 hora.' },
      { status: 429 }
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const { text, context } = await request.json();

    if (!text?.trim()) {
      clearTimeout(timeoutId);
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
      }, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const enhanced = completion.choices[0]?.message?.content?.trim() || text;

      return NextResponse.json({ enhanced });
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('AI enhance error:', error);

      if (error?.name === 'AbortError' || error?.code === 'ETIMEDOUT') {
        return NextResponse.json({ error: 'Tempo esgotado ao processar com IA.' }, { status: 504 });
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
        { error: 'Falha ao processar texto com IA.' },
        { status: 500 }
      );
    }
}
