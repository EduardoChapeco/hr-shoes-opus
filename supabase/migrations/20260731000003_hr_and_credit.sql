-- Migração: Criação da infraestrutura de RH Corporativo (Folha) e Crediário Próprio (Carnê)
-- Compatível com o sistema Multi-Tenant (store_id) e Auditoria RBAC

-------------------------------------------------------------------------------
-- 1. RH E FOLHA DE PAGAMENTO (Employee Financial Records)
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_financial_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- commission, advance_payment, salary_base, deduction
    amount_cents INTEGER NOT NULL, -- Valores positivos (Crédito) ou negativos (Débito/Dedução)
    reference_id UUID, -- Opcional: ID de Pedido, ID de Devolução (RMA) ou ID do Vale
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, settled (fechado na folha do mês)
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_emp_fin_store_employee ON public.employee_financial_records(store_id, employee_id);
CREATE INDEX idx_emp_fin_status ON public.employee_financial_records(status);

ALTER TABLE public.employee_financial_records ENABLE ROW LEVEL SECURITY;

-- Funcionários podem ler seus próprios extratos
CREATE POLICY "Employees read own financial records" ON public.employee_financial_records FOR SELECT USING (employee_id = auth.uid());

-- Apenas Gerentes e Donos podem inserir, ler todos, atualizar (desde que não esteja settled)
CREATE POLICY "Managers manage financial records" ON public.employee_financial_records FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles m WHERE m.id = auth.uid() AND m.store_id = employee_financial_records.store_id AND m.role IN ('owner', 'admin', 'manager', 'finance'))
);

-- PROTEÇÃO ANTI-FRAUDE (Não permite deletar ou alterar registros fechados 'settled')
CREATE OR REPLACE FUNCTION prevent_settled_modifications() RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status = 'settled') THEN
        RAISE EXCEPTION 'Registros financeiros fechados (settled) não podem ser alterados.';
    END IF;
    IF (TG_OP = 'DELETE' AND OLD.status = 'settled') THEN
        RAISE EXCEPTION 'Registros financeiros fechados (settled) não podem ser deletados.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_settled_records BEFORE UPDATE OR DELETE ON public.employee_financial_records FOR EACH ROW EXECUTE FUNCTION prevent_settled_modifications();
CREATE OR REPLACE TRIGGER update_emp_fin_modtime BEFORE UPDATE ON public.employee_financial_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-------------------------------------------------------------------------------
-- 2. CREDIÁRIO PRÓPRIO E ANÁLISE DE CRÉDITO (Carnê)
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_credit_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    approved_limit_cents INTEGER NOT NULL DEFAULT 0, -- Teto do limite aprovado pelo lojista
    used_credit_cents INTEGER NOT NULL DEFAULT 0, -- Quanto do limite já está comprometido
    is_blocked BOOLEAN NOT NULL DEFAULT false, -- Se true, cliente não compra mais no carnê
    last_review_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (store_id, customer_id)
);

CREATE INDEX idx_credit_limit_customer ON public.customer_credit_limits(store_id, customer_id);

ALTER TABLE public.customer_credit_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers view own limit" ON public.customer_credit_limits FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Finance manage limits" ON public.customer_credit_limits FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles m WHERE m.id = auth.uid() AND m.store_id = customer_credit_limits.store_id AND m.role IN ('owner', 'admin', 'finance'))
);

CREATE OR REPLACE TRIGGER update_credit_limit_modtime BEFORE UPDATE ON public.customer_credit_limits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-------------------------------------------------------------------------------
-- 3. PARCELAS E FATURAS (Credit Installments)
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL CHECK (installment_number > 0),
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    penalty_cents INTEGER NOT NULL DEFAULT 0, -- Multa/Juros calculado
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, paid, late, renegotiated
    pix_code TEXT, -- Código copia e cola ou link
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_installments_store_customer ON public.credit_installments(store_id, customer_id);
CREATE INDEX idx_installments_due_date ON public.credit_installments(due_date);

ALTER TABLE public.credit_installments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers view own installments" ON public.credit_installments FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Finance manage installments" ON public.credit_installments FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles m WHERE m.id = auth.uid() AND m.store_id = credit_installments.store_id AND m.role IN ('owner', 'admin', 'finance'))
);

CREATE OR REPLACE TRIGGER update_installments_modtime BEFORE UPDATE ON public.credit_installments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
