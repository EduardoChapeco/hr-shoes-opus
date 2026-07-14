-- ============================================================================
-- Hr Shoes Commerce — Migration 0016: Chat & Inbox
-- ============================================================================

-- ---------------------------------------------------------------------------
-- chat_threads
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email      VARCHAR(255),
  guest_name       VARCHAR(100),
  status           TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'archived')),
  subject          TEXT,
  
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT customer_or_guest CHECK (customer_id IS NOT NULL OR guest_email IS NOT NULL)
);

ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;

-- Customers can view their own threads
CREATE POLICY "chat_threads_customer_select"
  ON public.chat_threads FOR SELECT
  USING (customer_id = auth.uid());

-- Staff can view/manage all threads in their store
CREATE POLICY "chat_threads_staff_all"
  ON public.chat_threads FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'seller')
    )
  );

-- ---------------------------------------------------------------------------
-- chat_messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id        UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Null if sent by guest, or system
  is_staff_reply   BOOLEAN NOT NULL DEFAULT false,
  message          TEXT NOT NULL,
  
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_messages_customer_select"
  ON public.chat_messages FOR SELECT
  USING (
    thread_id IN (
      SELECT id FROM public.chat_threads WHERE customer_id = auth.uid()
    )
  );

CREATE POLICY "chat_messages_staff_all"
  ON public.chat_messages FOR ALL
  USING (
    thread_id IN (
      SELECT id FROM public.chat_threads WHERE store_id IN (
        SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'seller')
      )
    )
  );

-- Triggers
CREATE TRIGGER chat_threads_updated_at
  BEFORE UPDATE ON public.chat_threads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
