import { NextRequest, NextResponse } from 'next/server';
import { recordExitFeedback } from '@/lib/postgres';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { reason, comment, url, paid } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Motivo é obrigatório.' }, { status: 400 });
    }

    await recordExitFeedback({
      reason: String(reason),
      comment: comment ? String(comment) : undefined,
      url: url ? String(url) : undefined,
      paid: paid === true,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/exit-feedback] error', err);
    return NextResponse.json({ error: 'Falha ao salvar feedback.' }, { status: 500 });
  }
}
