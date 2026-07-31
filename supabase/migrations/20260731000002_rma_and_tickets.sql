-- Migração: Criação da infraestrutura Omnichannel de RMA e Tickets
-- Compatível com o sistema Multi-Tenant (store_id)

-------------------------------------------------------------------------------
-- 1. TICKETS (Helpdesk e Atendimento)
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_employee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open', -- open, pending, resolved, closed
    subject VARCHAR(255) NOT NULL,
    context_type VARCHAR(50), -- ex: 'order', 'rma', 'general'
    context_id UUID,          -- ID do pedido ou do RMA
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_internal BOOLEAN NOT NULL DEFAULT false, -- Mensagem interna apenas para funcionários?
    body TEXT NOT NULL,
    attachments_jsonb JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_store_id ON public.tickets(store_id);
CREATE INDEX idx_tickets_customer_id ON public.tickets(customer_id);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Clientes veem seus próprios tickets
CREATE POLICY "Customers view own tickets" ON public.tickets FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Customers view own ticket messages" ON public.ticket_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.customer_id = auth.uid())
    AND is_internal = false
);

-- Funcionários veem todos os tickets da loja
CREATE POLICY "Employees view store tickets" ON public.tickets FOR ALL USING (
    EXISTS (SELECT 1 FROM public.memberships m WHERE m.user_id = auth.uid() AND m.store_id = tickets.store_id AND m.role != 'customer')
);
CREATE POLICY "Employees view store ticket msgs" ON public.ticket_messages FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.tickets t
        JOIN public.memberships m ON m.store_id = t.store_id
        WHERE t.id = ticket_id AND m.user_id = auth.uid() AND m.role != 'customer'
    )
);

-------------------------------------------------------------------------------
-- 2. RMA (Logística Reversa e Trocas)
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rma_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL, -- Vínculo opcional
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, authorized, shipped_back, received, inspected, resolved, rejected, canceled
    type VARCHAR(50) NOT NULL, -- exchange, return, warranty
    shipping_cost_cents INTEGER DEFAULT 0,
    shipping_responsibility VARCHAR(50) DEFAULT 'store', -- store, customer
    resolution_type VARCHAR(50), -- store_credit, gateway_refund, replacement
    quarantine_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rma_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rma_id UUID NOT NULL REFERENCES public.rma_requests(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    reason VARCHAR(100) NOT NULL,
    condition VARCHAR(50), -- new, damaged, used
    photos_jsonb JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX idx_rma_store_id ON public.rma_requests(store_id);

ALTER TABLE public.rma_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rma_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own rma" ON public.rma_requests FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Customers view own rma items" ON public.rma_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.rma_requests r WHERE r.id = rma_id AND r.customer_id = auth.uid())
);

CREATE POLICY "Employees view store rma" ON public.rma_requests FOR ALL USING (
    EXISTS (SELECT 1 FROM public.memberships m WHERE m.user_id = auth.uid() AND m.store_id = rma_requests.store_id AND m.role != 'customer')
);
CREATE POLICY "Employees view store rma items" ON public.rma_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.rma_requests r
        JOIN public.memberships m ON m.store_id = r.store_id
        WHERE r.id = rma_id AND m.user_id = auth.uid() AND m.role != 'customer'
    )
);

-------------------------------------------------------------------------------
-- 3. AJUSTES DE INVENTÁRIO (Auditoria de Movimentações Manuais/RMA)
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_adjustments_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    qty_adjusted INTEGER NOT NULL, -- +10 ou -5
    reason VARCHAR(100) NOT NULL, -- restock_rma, damage, count_correction
    reference_id UUID, -- ex: id do RMA ou Pedido
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inv_adj_store_id ON public.inventory_adjustments_log(store_id);

ALTER TABLE public.inventory_adjustments_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store admins can view inventory adjustments" ON public.inventory_adjustments_log FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.memberships m WHERE m.user_id = auth.uid() AND m.store_id = inventory_adjustments_log.store_id AND m.role IN ('owner', 'admin', 'manager', 'stock'))
);

-- Triggers de Updated At
CREATE OR REPLACE TRIGGER update_tickets_modtime BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE OR REPLACE TRIGGER update_rma_requests_modtime BEFORE UPDATE ON public.rma_requests FOR EACH ROW EXECUTE FUNCTION update_modified_column();
