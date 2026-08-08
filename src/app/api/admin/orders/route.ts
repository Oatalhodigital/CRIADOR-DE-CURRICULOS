import { NextRequest, NextResponse } from 'next/server';
import { getApprovedOrdersWithLeads } from '@/lib/postgres';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const requestEmail = request.headers.get('x-admin-email');
  if (!adminEmail || requestEmail !== adminEmail) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const rows = await getApprovedOrdersWithLeads(28);

    return NextResponse.json({
      approved_orders: rows.map((row: any) => ({
        id: row.id,
        plan: row.plan,
        amount_cents: Number(row.amount_cents),
        amount_brl: (Number(row.amount_cents) / 100).toFixed(2),
        payment_method: row.payment_method,
        mp_payment_id: row.mp_payment_id,
        payer_email: row.payer_email,
        lead_name: row.lead_name,
        lead_email: row.lead_email,
        created_at: row.created_at,
      })),
      total: rows.length,
    });
  } catch (err) {
    console.error('[api/admin/orders] error', err);
    return NextResponse.json({ error: 'Falha ao consultar pedidos.' }, { status: 500 });
  }
}
