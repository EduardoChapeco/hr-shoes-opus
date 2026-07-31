-- Migração: Criação da infraestrutura de Auditoria e Refinamento RBAC (Correção)
-- Compatível com o sistema Multi-Tenant (store_id)

-- 1. A tabela de logs de auditoria (audit_log) já existe na V4, mas vamos garantir índices
CREATE INDEX IF NOT EXISTS idx_audit_log_store_id ON public.audit_log(store_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON public.audit_log(actor_id);

-- 2. Tabela Base de Vales / Adiantamentos (RH Financeiro)
CREATE TABLE IF NOT EXISTS public.employee_advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, paid, rejected
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_advances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees view own advances"
    ON public.employee_advances FOR SELECT
    USING (employee_id = auth.uid());

CREATE POLICY "Managers view all advances"
    ON public.employee_advances FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles m
            WHERE m.id = auth.uid()
              AND m.store_id = employee_advances.store_id
              AND m.role IN ('owner', 'admin', 'manager', 'finance')
        )
    );

-- Notificação de atualização
CREATE OR REPLACE TRIGGER update_employee_advances_modtime
    BEFORE UPDATE ON public.employee_advances
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
