-- Publish message changes for Supabase Realtime and limit them to conversation participants.
-- The backend uses the service-role key, so its existing message mutations continue to bypass RLS.

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.messages TO authenticated;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(target_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE conversations.id = target_conversation_id
      AND (
        conversations.user_one_id = auth.uid()
        OR conversations.user_two_id = auth.uid()
      )
  );
$$;

REVOKE ALL ON FUNCTION public.is_conversation_participant(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(UUID) TO authenticated;

DO $$
BEGIN
  CREATE POLICY messages_participants_can_receive_realtime
    ON public.messages
    FOR SELECT
    TO authenticated
    USING (public.is_conversation_participant(conversation_id));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;
