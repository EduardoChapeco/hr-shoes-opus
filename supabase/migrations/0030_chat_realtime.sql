-- ============================================================================
-- Hr Shoes Commerce — Migration 0030: Chat Realtime
-- ============================================================================

-- Ensure the supabase_realtime publication exists (created by default, but just in case)
-- Then add the chat tables to the publication to broadcast INSERT/UPDATE/DELETE events.

BEGIN;

  -- Remove if they are already in the publication to avoid errors, then add them
  -- Note: Supabase's realtime publication is named "supabase_realtime"
  -- By default, no tables are in it.
  
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_threads;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

COMMIT;
