-- Add UPDATE policy to push_subscriptions.
-- The client upserts via on_conflict=user_id,endpoint (pushService.ts), which
-- translates to INSERT ... ON CONFLICT DO UPDATE. When the row already exists
-- the UPDATE leg fires and was being rejected (403) because only SELECT,
-- INSERT, and DELETE policies existed.

CREATE POLICY "Users can update own subscriptions"
  ON public.push_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
