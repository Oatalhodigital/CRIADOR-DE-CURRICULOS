import { NextRequest, NextResponse } from 'next/server';
import { getFunnelSummary } from '@/lib/postgres';

export async function GET(request: NextRequest) {
  const start = Date.now();

  const adminEmail = process.env.ADMIN_EMAIL;
  const requestEmail = request.headers.get('x-admin-email');

  if (!adminEmail || requestEmail !== adminEmail) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const data = await getFunnelSummary();
    console.log('[api/admin/funnel-summary] fetched', { durationMs: Date.now() - start });
    return NextResponse.json({
      summary: data.summary,
      revenue: {
        total_cents: Number(data.revenue.total_cents) || 0,
        approved_count: Number(data.revenue.approved_count) || 0,
        total_orders: Number(data.revenue.total_orders) || 0,
      },
    });
  } catch (error: any) {
    console.error('[api/admin/funnel-summary] error', {
      error: error?.message || String(error),
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - start,
    });
    return NextResponse.json(
      { error: 'Falha ao carregar resumo do funil.' },
      { status: 500 }
    );
  }
}
