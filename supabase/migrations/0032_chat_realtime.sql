-- ============================================================================
-- Hr Shoes Commerce — Migration 0030: Chat Realtime
-- ============================================================================

-- Ensure the supabase_realtime publication exists (created by default, but just in case)
-- Then add the chat tables to the publication to broadcast INSERT/UPDATE/DELETE events.

BEGIN;

  DO $$
  BEGIN
      IF NOT EXISTS (
          SELECT 1 
          FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = 'chat_threads'
      ) THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_threads;
      END IF;

      IF NOT EXISTS (
          SELECT 1 
          FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = 'chat_messages'
      ) THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
      END IF;
  END
  $$;

COMMIT;
