-- Message status fields used by edit/delete/pin message endpoints.

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_for_sender BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_for_all BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_messages_pinned_conversation_id
  ON messages(conversation_id, pinned, pinned_at)
  WHERE pinned = true;
