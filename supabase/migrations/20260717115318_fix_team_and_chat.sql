-- Add avatar_url column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Recreate foreign key for chat_threads (customer_id points to profiles(id) instead of auth.users(id))
ALTER TABLE public.chat_threads DROP CONSTRAINT IF EXISTS chat_threads_customer_id_fkey;
ALTER TABLE public.chat_threads ADD CONSTRAINT chat_threads_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Recreate foreign key for chat_messages (sender_id points to profiles(id) instead of auth.users(id))
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
