interface LeadInsertData {
  firestore_id: string;
  name: string;
  email: string;
  whatsapp?: string;
  consent_marketing?: boolean;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

interface OrderInsertData {
  lead_firestore_id?: string | null;
  resume_firestore_id?: string | null;
  plan?: string;
  amount_cents: number;
  currency?: string;
  payment_method: 'pix' | 'credit_card';
  mp_payment_id?: string | null;
  status?: string;
  downloads_allowed?: number;
}

interface OrderRow {
  id: number;
  lead_firestore_id: string | null;
  resume_firestore_id: string | null;
  plan: string;
  amount_cents: number;
  payment_method: string;
  mp_payment_id: string | null;
  status: string;
  downloads_allowed: number;
  downloads_used: number;
  resume_snapshot: any | null;
  payer_email: string | null;
  confirmation_email_sent_at: Date | null;
  confirmation_email_delivered_at: Date | null;
}

interface FunnelEventInsertData {
  lead_firestore_id?: string;
  event_name: string;
  metadata?: Record<string, any>;
}

let sqlModule: any = null;

async function getSql() {
  if (!process.env.POSTGRES_URL) return null;
  if (!sqlModule) sqlModule = await import('@vercel/postgres');
  return sqlModule.sql;
}

async function pgQuery<T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<{ rows: T[] }> {
  const sql = await getSql();
  if (!sql) return { rows: [] };
  try {
    const result = await sql(strings, ...values);
    return result as { rows: T[] };
  } catch (err) {
    console.error('[postgres] query error', err);
    throw err;
  }
}

export async function ensurePostgresTables() {
  try {
    await pgQuery`CREATE TABLE IF NOT EXISTS leads (
      id BIGSERIAL PRIMARY KEY,
      firestore_id TEXT UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      whatsapp TEXT,
      consent_marketing BOOLEAN DEFAULT FALSE,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
    await pgQuery`ALTER TABLE leads ADD COLUMN IF NOT EXISTS reengagement_resume_sent_at TIMESTAMPTZ`;
    await pgQuery`ALTER TABLE leads ADD COLUMN IF NOT EXISTS reengagement_survey_sent_at TIMESTAMPTZ`;

    await pgQuery`CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email)`;
    await pgQuery`CREATE INDEX IF NOT EXISTS idx_leads_firestore_id ON leads(firestore_id)`;
    await pgQuery`CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC)`;
    await pgQuery`CREATE INDEX IF NOT EXISTS idx_leads_reengagement_resume ON leads(reengagement_resume_sent_at)`;
    await pgQuery`CREATE INDEX IF NOT EXISTS idx_leads_reengagement_survey ON leads(reengagement_survey_sent_at)`;

    await pgQuery`CREATE TABLE IF NOT EXISTS orders (
      id BIGSERIAL PRIMARY KEY,
      lead_id BIGINT REFERENCES leads(id) ON DELETE SET NULL,
      lead_firestore_id TEXT,
      resume_firestore_id TEXT,
      plan TEXT NOT NULL DEFAULT 'unknown',
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'BRL',
      payment_method TEXT NOT NULL,
      mp_payment_id TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      downloads_allowed INTEGER NOT NULL DEFAULT 1,
      downloads_used INTEGER NOT NULL DEFAULT 0,
      resume_snapshot JSONB,
      payer_email TEXT,
      confirmation_email_sent_at TIMESTAMPTZ,
      confirmation_email_delivered_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
    await pgQuery`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`;
    await pgQuery`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)`;
    await pgQuery`CREATE INDEX IF NOT EXISTS idx_orders_mp_payment_id ON orders(mp_payment_id)`;
    await pgQuery`CREATE INDEX IF NOT EXISTS idx_orders_lead_firestore_id ON orders(lead_firestore_id)`;

    await pgQuery`ALTER TABLE orders ADD COLUMN IF NOT EXISTS downloads_allowed INTEGER NOT NULL DEFAULT 1`;
    await pgQuery`ALTER TABLE orders ADD COLUMN IF NOT EXISTS downloads_used INTEGER NOT NULL DEFAULT 0`;
    await pgQuery`ALTER TABLE orders ADD COLUMN IF NOT EXISTS resume_snapshot JSONB`;
    await pgQuery`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payer_email TEXT`;
    await pgQuery`ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ`;
    await pgQuery`ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmation_email_delivered_at TIMESTAMPTZ`;
    await pgQuery`ALTER TABLE orders ADD COLUMN IF NOT EXISTS pix_reminder_sent_at TIMESTAMPTZ`;

    await pgQuery`CREATE TABLE IF NOT EXISTS funnel_events (
      id BIGSERIAL PRIMARY KEY,
      lead_id BIGINT REFERENCES leads(id) ON DELETE SET NULL,
      lead_firestore_id TEXT,
      event_name TEXT NOT NULL,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
    await pgQuery`CREATE INDEX IF NOT EXISTS idx_funnel_events_lead_id ON funnel_events(lead_id)`;
    await pgQuery`CREATE INDEX IF NOT EXISTS idx_funnel_events_lead_firestore_id ON funnel_events(lead_firestore_id)`;
    await pgQuery`CREATE INDEX IF NOT EXISTS idx_funnel_events_event_name ON funnel_events(event_name)`;
    await pgQuery`CREATE INDEX IF NOT EXISTS idx_funnel_events_created_at ON funnel_events(created_at DESC)`;

    await pgQuery`CREATE TABLE IF NOT EXISTS exit_feedback (
      id BIGSERIAL PRIMARY KEY,
      reason TEXT,
      comment TEXT,
      url TEXT,
      paid BOOLEAN DEFAULT FALSE,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;

    await pgQuery`CREATE OR REPLACE VIEW funnel_conversion_summary AS
      SELECT
        event_name,
        COUNT(DISTINCT COALESCE(lead_firestore_id, lead_id::TEXT)) AS unique_leads,
        MIN(created_at) AS first_seen,
        MAX(created_at) AS last_seen
      FROM funnel_events
      GROUP BY event_name`;
  } catch (err) {
    console.error('[postgres] ensure tables failed', err);
  }
}

export async function insertLeadPostgres(data: LeadInsertData) {
  try {
    await ensurePostgresTables();
    const result = await pgQuery<{ id: number }>`
      INSERT INTO leads (firestore_id, name, email, whatsapp, consent_marketing, utm_source, utm_medium, utm_campaign)
      VALUES (${data.firestore_id}, ${data.name}, ${data.email}, ${data.whatsapp || null}, ${data.consent_marketing || false}, ${data.utm_source || null}, ${data.utm_medium || null}, ${data.utm_campaign || null})
      ON CONFLICT (firestore_id) DO NOTHING
      RETURNING id
    `;
    return result.rows[0] || null;
  } catch (err) {
    console.error('[postgres] insertLead failed', err);
    return null;
  }
}

export function getDownloadsForPlan(plan?: string): number {
  const map: Record<string, number> = { single: 1, weekly: 2, monthly: 3 };
  return map[plan || ''] || 1;
}

export async function insertOrderPostgres(data: OrderInsertData) {
  try {
    await ensurePostgresTables();
    const downloadsAllowed = data.downloads_allowed ?? getDownloadsForPlan(data.plan);
    await pgQuery`
      INSERT INTO orders (lead_firestore_id, resume_firestore_id, plan, amount_cents, currency, payment_method, mp_payment_id, status, downloads_allowed)
      VALUES (${data.lead_firestore_id || null}, ${data.resume_firestore_id || null}, ${data.plan || 'unknown'}, ${data.amount_cents}, ${data.currency || 'BRL'}, ${data.payment_method}, ${data.mp_payment_id || null}, ${data.status || 'pending'}, ${downloadsAllowed})
      ON CONFLICT (mp_payment_id) DO UPDATE SET
        lead_firestore_id = COALESCE(orders.lead_firestore_id, EXCLUDED.lead_firestore_id),
        resume_firestore_id = COALESCE(orders.resume_firestore_id, EXCLUDED.resume_firestore_id),
        plan = CASE WHEN orders.plan = 'unknown' THEN EXCLUDED.plan ELSE orders.plan END,
        amount_cents = CASE WHEN orders.amount_cents = 0 THEN EXCLUDED.amount_cents ELSE orders.amount_cents END,
        payment_method = EXCLUDED.payment_method,
        downloads_allowed = GREATEST(orders.downloads_allowed, EXCLUDED.downloads_allowed),
        status = CASE WHEN orders.status = 'approved' THEN orders.status ELSE EXCLUDED.status END,
        updated_at = NOW()
    `;
  } catch (err) {
    console.error('[postgres] insertOrder failed', err);
  }
}

export async function getOrderByMpPaymentId(mpPaymentId: string) {
  try {
    await ensurePostgresTables();
    const result = await pgQuery<OrderRow>`
      SELECT * FROM orders WHERE mp_payment_id = ${mpPaymentId} LIMIT 1
    `;
    return result.rows[0] || null;
  } catch (err) {
    console.error('[postgres] getOrderByMpPaymentId failed', err);
    return null;
  }
}

export async function setOrderResumeSnapshot(mpPaymentId: string, snapshot: any) {
  try {
    await ensurePostgresTables();
    await pgQuery`
      UPDATE orders
      SET resume_snapshot = ${JSON.stringify(snapshot)}::jsonb, updated_at = NOW()
      WHERE mp_payment_id = ${mpPaymentId}
    `;
  } catch (err) {
    console.error('[postgres] setOrderResumeSnapshot failed', err);
  }
}

export async function setOrderPayerEmail(mpPaymentId: string, email: string) {
  try {
    await ensurePostgresTables();
    await pgQuery`
      UPDATE orders
      SET payer_email = ${email}, updated_at = NOW()
      WHERE mp_payment_id = ${mpPaymentId}
    `;
  } catch (err) {
    console.error('[postgres] setOrderPayerEmail failed', err);
  }
}

export async function markConfirmationEmailSent(mpPaymentId: string, delivered = false) {
  try {
    await ensurePostgresTables();
    await pgQuery`
      UPDATE orders
      SET confirmation_email_sent_at = NOW(),
          confirmation_email_delivered_at = ${delivered ? new Date() : null},
          updated_at = NOW()
      WHERE mp_payment_id = ${mpPaymentId}
    `;
  } catch (err) {
    console.error('[postgres] markConfirmationEmailSent failed', err);
  }
}

export async function recordDownload(mpPaymentId: string) {
  try {
    await ensurePostgresTables();
    const result = await pgQuery<OrderRow>`
      UPDATE orders
      SET downloads_used = downloads_used + 1, updated_at = NOW()
      WHERE mp_payment_id = ${mpPaymentId} AND downloads_used < downloads_allowed
      RETURNING downloads_used, downloads_allowed
    `;
    return result.rows[0] || null;
  } catch (err) {
    console.error('[postgres] recordDownload failed', err);
    return null;
  }
}

export async function updateOrderStatusPostgres(mpPaymentId: string, status: string) {
  try {
    await ensurePostgresTables();
    await pgQuery`
      UPDATE orders
      SET status = ${status}, updated_at = NOW()
      WHERE mp_payment_id = ${mpPaymentId}
    `;
  } catch (err) {
    console.error('[postgres] updateOrderStatus failed', err);
  }
}

export async function insertFunnelEventPostgres(data: FunnelEventInsertData) {
  try {
    await ensurePostgresTables();
    await pgQuery`
      INSERT INTO funnel_events (lead_firestore_id, event_name, metadata)
      VALUES (${data.lead_firestore_id || null}, ${data.event_name}, ${data.metadata ? JSON.stringify(data.metadata) : null}::jsonb)
    `;
  } catch (err) {
    console.error('[postgres] insertFunnelEvent failed', err);
  }
}

export async function getFunnelSummary() {
  try {
    await ensurePostgresTables();
    const summary = await pgQuery`
      SELECT event_name, unique_leads, first_seen, last_seen
      FROM funnel_conversion_summary
      ORDER BY unique_leads DESC
    `;
    const revenue = await pgQuery`
      SELECT
        COALESCE(SUM(amount_cents), 0) AS total_cents,
        COUNT(*) FILTER (WHERE status = 'approved') AS approved_count,
        COUNT(*) AS total_orders
      FROM orders
    `;
    return { summary: summary.rows, revenue: revenue.rows[0] };
  } catch (err) {
    console.error('[postgres] getFunnelSummary failed', err);
    return { summary: [], revenue: { total_cents: 0, approved_count: 0, total_orders: 0 } };
  }
}

export async function getPendingPixReminders(minutesSinceCreated = 15, limit = 100) {
  try {
    await ensurePostgresTables();
    const result = await pgQuery`
      SELECT
        o.mp_payment_id,
        o.payer_email,
        o.lead_firestore_id,
        o.plan,
        o.amount_cents,
        o.created_at,
        fe.metadata
      FROM orders o
      LEFT JOIN funnel_events fe ON fe.lead_firestore_id = o.lead_firestore_id
        AND fe.event_name = 'checkout_started'
        AND fe.created_at >= o.created_at - INTERVAL '1 minute'
      WHERE o.payment_method = 'pix'
        AND o.status = 'pending'
        AND o.pix_reminder_sent_at IS NULL
        AND o.payer_email IS NOT NULL
        AND o.created_at <= now() - ${minutesSinceCreated} * INTERVAL '1 minute'
        AND o.created_at >= now() - INTERVAL '12 hours'
      ORDER BY o.created_at ASC
      LIMIT ${limit}
    `;
    return result.rows;
  } catch (err) {
    console.error('[postgres] getPendingPixReminders failed', err);
    return [];
  }
}

export async function markPixReminderSent(mpPaymentId: string, delivered = false) {
  try {
    await ensurePostgresTables();
    await pgQuery`
      UPDATE orders
      SET pix_reminder_sent_at = now()
      WHERE mp_payment_id = ${mpPaymentId}
    `;
  } catch (err) {
    console.error('[postgres] markPixReminderSent failed', { mpPaymentId, err });
  }
}

export async function recordExitFeedback(data: {
  reason: string;
  comment?: string;
  url?: string;
  paid: boolean;
  userAgent?: string;
}) {
  try {
    await ensurePostgresTables();
    await pgQuery`
      INSERT INTO exit_feedback (reason, comment, url, paid, user_agent)
      VALUES (${data.reason}, ${data.comment || null}, ${data.url || null}, ${data.paid}, ${data.userAgent || null})
    `;
  } catch (err) {
    console.error('[postgres] recordExitFeedback failed', err);
  }
}

export async function getLeadsForReengagement(stage: 'resume' | 'survey', limit = 100) {
  try {
    await ensurePostgresTables();
    const hours = stage === 'resume' ? 2 : 72;
    const result = stage === 'resume'
      ? await pgQuery`
          SELECT
            l.id,
            l.firestore_id,
            l.email,
            l.name,
            l.created_at,
            l.whatsapp
          FROM leads l
          WHERE l.consent_marketing = TRUE
            AND l.email IS NOT NULL
            AND l.created_at <= now() - ${hours} * INTERVAL '1 hour'
            AND l.created_at >= now() - INTERVAL '7 days'
            AND NOT EXISTS (
              SELECT 1 FROM orders o
              WHERE o.lead_id = l.id AND o.status = 'approved'
            )
            AND l.reengagement_resume_sent_at IS NULL
          ORDER BY l.created_at ASC
          LIMIT ${limit}
        `
      : await pgQuery`
          SELECT
            l.id,
            l.firestore_id,
            l.email,
            l.name,
            l.created_at,
            l.whatsapp
          FROM leads l
          WHERE l.consent_marketing = TRUE
            AND l.email IS NOT NULL
            AND l.created_at <= now() - ${hours} * INTERVAL '1 hour'
            AND l.created_at >= now() - INTERVAL '7 days'
            AND NOT EXISTS (
              SELECT 1 FROM orders o
              WHERE o.lead_id = l.id AND o.status = 'approved'
            )
            AND l.reengagement_survey_sent_at IS NULL
          ORDER BY l.created_at ASC
          LIMIT ${limit}
        `;
    return result.rows;
  } catch (err) {
    console.error('[postgres] getLeadsForReengagement failed', { stage, err });
    return [];
  }
}

export async function getApprovedOrdersWithLeads(days = 28) {
  try {
    await ensurePostgresTables();
    const result = await pgQuery`
      SELECT
        o.id,
        o.lead_firestore_id,
        o.plan,
        o.amount_cents,
        o.payment_method,
        o.mp_payment_id,
        o.status,
        o.payer_email,
        o.created_at,
        l.name AS lead_name,
        l.email AS lead_email
      FROM orders o
      LEFT JOIN leads l ON o.lead_firestore_id = l.firestore_id
      WHERE o.status = 'approved'
        AND o.created_at >= now() - ${days} * INTERVAL '1 day'
      ORDER BY o.created_at DESC
    `;
    return result.rows;
  } catch (err) {
    console.error('[postgres] getApprovedOrdersWithLeads failed', err);
    return [];
  }
}

export async function markReengagementSent(leadId: number, stage: 'resume' | 'survey', delivered = false) {
  try {
    await ensurePostgresTables();
    if (stage === 'resume') {
      await pgQuery`
        UPDATE leads
        SET reengagement_resume_sent_at = now()
        WHERE id = ${leadId}
      `;
    } else {
      await pgQuery`
        UPDATE leads
        SET reengagement_survey_sent_at = now()
        WHERE id = ${leadId}
      `;
    }
  } catch (err) {
    console.error('[postgres] markReengagementSent failed', { leadId, stage, err });
  }
}
