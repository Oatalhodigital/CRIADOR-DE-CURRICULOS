import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const content = fs.readFileSync(path.join(__dirname, '..', '.env.vercel-prod'), 'utf-8');
const match = content.match(/^POSTGRES_URL="(.+)"$/m);
if (!match) throw new Error('POSTGRES_URL not found in .env.vercel-prod');
const connStr = match[1];

const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } });

const DATE_START = '2026-08-06';
const DATE_END = '2026-09-05';

async function runAudit() {
  const client = await pool.connect();
  try {
    console.log('=== AUDITORIA QUANTITATIVA DO FUNIL ===');
    console.log(`Período: ${DATE_START} a ${DATE_END}\n`);

    // 1. Total de leads capturados
    const leads = await client.query(
      `SELECT count(*) as total FROM leads WHERE created_at >= $1::date AND created_at < ($2::date + interval '1 day')`,
      [DATE_START, DATE_END]
    );
    console.log(`[1] Leads capturados: ${leads.rows[0].total}`);

    // 1b. Leads com gclid (Google Ads)
    const leadsGclid = await client.query(
      `SELECT count(*) as total FROM leads WHERE created_at >= $1::date AND created_at < ($2::date + interval '1 day') AND gclid IS NOT NULL`,
      [DATE_START, DATE_END]
    );
    console.log(`[1b] Leads com gclid: ${leadsGclid.rows[0].total}`);

    // 2. Funil de eventos
    const events = await client.query(
      `SELECT event_name, count(*) as total FROM funnel_events WHERE created_at >= $1::date AND created_at < ($2::date + interval '1 day') GROUP BY event_name ORDER BY total DESC`,
      [DATE_START, DATE_END]
    );
    console.log(`\n[2] Eventos do funil:`);
    for (const row of events.rows) {
      console.log(`    ${row.event_name}: ${row.total}`);
    }

    // 3. Pedidos por status
    const orders = await client.query(
      `SELECT status, count(*) as total, sum(amount_cents) as total_cents FROM orders WHERE created_at >= $1::date AND created_at < ($2::date + interval '1 day') GROUP BY status ORDER BY total DESC`,
      [DATE_START, DATE_END]
    );
    console.log(`\n[3] Pedidos por status:`);
    for (const row of orders.rows) {
      const totalBRL = (Number(row.total_cents) / 100).toFixed(2);
      console.log(`    ${row.status}: ${row.total} pedidos — R$ ${totalBRL}`);
    }

    // 4. Pedidos por método de pagamento
    const ordersByMethod = await client.query(
      `SELECT payment_method, status, count(*) as total FROM orders WHERE created_at >= $1::date AND created_at < ($2::date + interval '1 day') GROUP BY payment_method, status ORDER BY payment_method, status`,
      [DATE_START, DATE_END]
    );
    console.log(`\n[4] Pedidos por método de pagamento e status:`);
    for (const row of ordersByMethod.rows) {
      console.log(`    ${row.payment_method} / ${row.status}: ${row.total}`);
    }

    // 5. Conversão lead -> pedido
    const totalLeads = Number(leads.rows[0].total);
    const totalOrders = orders.rows.reduce((sum: number, r: any) => sum + Number(r.total), 0);
    const approvedOrders = orders.rows.filter((r: any) => r.status === 'approved').reduce((sum: number, r: any) => sum + Number(r.total), 0);
    console.log(`\n[5] Taxas de conversão:`);
    console.log(`    Leads -> Pedidos: ${totalOrders}/${totalLeads} = ${totalLeads > 0 ? ((totalOrders / totalLeads) * 100).toFixed(1) : '0'}%`);
    console.log(`    Leads -> Aprovados: ${approvedOrders}/${totalLeads} = ${totalLeads > 0 ? ((approvedOrders / totalLeads) * 100).toFixed(1) : '0'}%`);
    console.log(`    Pedidos -> Aprovados: ${approvedOrders}/${totalOrders} = ${totalOrders > 0 ? ((approvedOrders / totalOrders) * 100).toFixed(1) : '0'}%`);

    // 6. Downloads realizados
    const downloads = await client.query(
      `SELECT count(*) as total_downloads, sum(downloads_used) as total_used FROM orders WHERE created_at >= $1::date AND created_at < ($2::date + interval '1 day') AND status = 'approved'`,
      [DATE_START, DATE_END]
    );
    console.log(`\n[6] Downloads em pedidos aprovados: ${downloads.rows[0].total_used || 0}`);

    // 7. CAPI Purchase enviado
    const capi = await client.query(
      `SELECT count(*) as total FROM orders WHERE created_at >= $1::date AND created_at < ($2::date + interval '1 day') AND capi_purchase_sent_at IS NOT NULL`,
      [DATE_START, DATE_END]
    );
    console.log(`[7] Pedidos com CAPI Purchase enviado: ${capi.rows[0].total}`);

    // 8. Funil diário (leads e pedidos aprovados por dia)
    const daily = await client.query(
      `SELECT d::date as date,
         (SELECT count(*) FROM leads WHERE created_at >= d::date AND created_at < (d + interval '1 day')::date) as leads,
         (SELECT count(*) FROM orders WHERE created_at >= d::date AND created_at < (d + interval '1 day')::date AND status = 'approved') as approved
       FROM generate_series($1::date, $2::date, interval '1 day') d
       ORDER BY d`,
      [DATE_START, DATE_END]
    );
    console.log(`\n[8] Funil diário (data | leads | aprovados):`);
    for (const row of daily.rows) {
      console.log(`    ${row.date} | ${row.leads} | ${row.approved}`);
    }

    // 9. Leads por origem (utm_source)
    const utm = await client.query(
      `SELECT utm_source, count(*) as total FROM leads WHERE created_at >= $1::date AND created_at < ($2::date + interval '1 day') GROUP BY utm_source ORDER BY total DESC`,
      [DATE_START, DATE_END]
    );
    console.log(`\n[9] Leads por utm_source:`);
    for (const row of utm.rows) {
      console.log(`    ${row.utm_source || '(nulo)'}: ${row.total}`);
    }

    console.log('\n=== FIM DA AUDITORIA ===');
  } finally {
    client.release();
    await pool.end();
  }
}

runAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
