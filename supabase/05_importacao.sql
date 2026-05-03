-- Adiciona coluna para identificar leads importados de CRM externo
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS importado_externo BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_leads_importado_externo
  ON leads (importado_externo) WHERE importado_externo = TRUE;
