-- 046_admin_image_management.sql
-- Allow admins to list and delete objects in the public image buckets
-- (avatars, event-images, business-logos) so they can moderate uploaded content
-- from the admin panel. Public read already exists; we only add admin-scoped
-- SELECT-on-listing and DELETE policies.

-- ===========================================
-- AVATARS
-- ===========================================
DROP POLICY IF EXISTS "admin_avatar_select" ON storage.objects;
CREATE POLICY "admin_avatar_select" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars' AND public.is_admin());

DROP POLICY IF EXISTS "admin_avatar_delete" ON storage.objects;
CREATE POLICY "admin_avatar_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND public.is_admin());

-- ===========================================
-- EVENT IMAGES
-- ===========================================
DROP POLICY IF EXISTS "admin_event_image_delete" ON storage.objects;
CREATE POLICY "admin_event_image_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'event-images' AND public.is_admin());

-- ===========================================
-- BUSINESS LOGOS
-- ===========================================
DROP POLICY IF EXISTS "admin_business_logo_delete" ON storage.objects;
CREATE POLICY "admin_business_logo_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'business-logos' AND public.is_admin());
