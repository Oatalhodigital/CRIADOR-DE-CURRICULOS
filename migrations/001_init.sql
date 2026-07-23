-- Schema inicial do banco relacional (Postgres/Vercel Postgres)
-- Execute manualmente no painel da Vercel/Neon ou rode via API /api/admin/migrate

-- Leads capturados no início do funil
CREATE TABLE IF NOT EXISTS leads (
    id              BIGSERIAL PRIMARY KEY,
    firestore_id    TEXT UNIQUE,              -- referência ao doc correspondente no Firestore
    name            TEXT NOT NULL,
    email           TEXT NOT NULL,
    whatsapp        TEXT,
    consent_marketing BOOLEAN DEFAULT FALSE,
    utm_source      TEXT,
    utm_medium      TEXT,
    utm_campaign    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_firestore_id ON leads (firestore_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);

-- Pedidos (uma linha por tentativa de compra de um plano)
CREATE TABLE IF NOT EXISTS orders (
    id                  BIGSERIAL PRIMARY KEY,
    lead_id             BIGINT REFERENCES leads(id) ON DELETE SET NULL,
    lead_firestore_id   TEXT,                 -- referência alternativa ao lead no Firestore
    resume_firestore_id TEXT,                 -- referência ao currículo gerado no Firestore
    plan                TEXT NOT NULL,        -- ex.: 'single' | 'weekly' | 'monthly' | 'unknown'
    amount_cents        INTEGER NOT NULL,     -- valor em centavos, evita ponto flutuante
    currency            TEXT NOT NULL DEFAULT 'BRL',
    payment_method      TEXT NOT NULL,        -- 'pix' | 'credit_card'
    mp_payment_id       TEXT UNIQUE,          -- id do pagamento no Mercado Pago
    status              TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'expired'
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_mp_payment_id ON orders (mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_lead_firestore_id ON orders (lead_firestore_id);

-- Eventos de funil para análise de conversão
CREATE TABLE IF NOT EXISTS funnel_events (
    id              BIGSERIAL PRIMARY KEY,
    lead_id         BIGINT REFERENCES leads(id) ON DELETE SET NULL,
    lead_firestore_id TEXT,                   -- referência alternativa ao lead/resumo no Firestore
    event_name      TEXT NOT NULL,            -- ex.: 'lead_captured' | 'personal_info_filled' | 'preview_viewed' | 'checkout_started' | 'payment_approved'
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_funnel_events_lead_id ON funnel_events (lead_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_lead_firestore_id ON funnel_events (lead_firestore_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_event_name ON funnel_events (event_name);
CREATE INDEX IF NOT EXISTS idx_funnel_events_created_at ON funnel_events (created_at DESC);

-- View de conversão por etapa
CREATE OR REPLACE VIEW funnel_conversion_summary AS
SELECT
    event_name,
    COUNT(DISTINCT COALESCE(lead_firestore_id, lead_id::TEXT)) AS unique_leads,
    MIN(created_at) AS first_seen,
    MAX(created_at) AS last_seen
FROM funnel_events
GROUP BY event_name;
