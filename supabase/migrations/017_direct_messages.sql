-- 017: Direct Messages
-- Adds 1-on-1 DM conversations alongside existing event-based chat

-- ============================================================
-- 1. conversations table — one row per unique user pair
-- ============================================================
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_two uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),

  -- Canonical ordering: smaller UUID always in participant_one
  CONSTRAINT conversations_ordered CHECK (participant_one < participant_two),
  CONSTRAINT conversations_unique_pair UNIQUE (participant_one, participant_two)
);

-- Index for looking up conversations by either participant
CREATE INDEX idx_conversations_p1 ON conversations(participant_one);
CREATE INDEX idx_conversations_p2 ON conversations(participant_two);

-- ============================================================
-- 2. direct_messages table
-- ============================================================
CREATE TABLE direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) <= 1000),
  message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'voucher_share', 'event_share')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_dm_conversation ON direct_messages(conversation_id, created_at);
CREATE INDEX idx_dm_sender ON direct_messages(sender_id);

-- ============================================================
-- 3. Trigger: auto-update conversations.last_message_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_conversation_last_message
  AFTER INSERT ON direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- ============================================================
-- 4. RLS policies
-- ============================================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- conversations: participants can view their own conversations
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = participant_one OR auth.uid() = participant_two);

-- conversations: authenticated users can create conversations they belong to
CREATE POLICY "Users can create own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_one OR auth.uid() = participant_two);

-- direct_messages: participants of the conversation can view messages
CREATE POLICY "Participants can view messages"
  ON direct_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = direct_messages.conversation_id
        AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
    )
  );

-- direct_messages: participants can send messages (as themselves)
CREATE POLICY "Participants can send messages"
  ON direct_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
    )
  );

-- ============================================================
-- 5. Realtime
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
