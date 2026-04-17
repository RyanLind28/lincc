-- 040: When friends-of-friends returns nothing, fall back to popular users
-- (by follower count) so new users and users with sparse graphs still see
-- suggestions. Replaces the SQL-only function from 039 with a plpgsql version
-- that can branch after checking if the primary query returned rows.

CREATE OR REPLACE FUNCTION public.suggest_users(p_user_id uuid, p_limit int DEFAULT 10)
RETURNS TABLE(
  id uuid,
  first_name text,
  avatar_url text,
  bio text,
  tags text[],
  mutual_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Primary: friends-of-friends
  RETURN QUERY
  WITH my_following AS (
    SELECT followed_id FROM public.follows WHERE follower_id = p_user_id
  )
  SELECT
    p.id,
    p.first_name,
    p.avatar_url,
    p.bio,
    p.tags,
    COUNT(DISTINCT f.follower_id) AS mutual_count
  FROM public.follows f
  JOIN public.profiles p ON p.id = f.followed_id
  WHERE f.follower_id IN (SELECT followed_id FROM my_following)
    AND f.followed_id != p_user_id
    AND f.followed_id NOT IN (SELECT followed_id FROM my_following)
    AND p.status = 'active'
  GROUP BY p.id, p.first_name, p.avatar_url, p.bio, p.tags
  ORDER BY mutual_count DESC, p.id
  LIMIT p_limit;

  IF FOUND THEN RETURN; END IF;

  -- Fallback: most-followed users (filtered to complete-looking profiles).
  RETURN QUERY
  WITH my_following AS (
    SELECT followed_id FROM public.follows WHERE follower_id = p_user_id
  ),
  popular AS (
    SELECT followed_id, COUNT(*) AS follower_count
    FROM public.follows
    GROUP BY followed_id
  )
  SELECT
    p.id,
    p.first_name,
    p.avatar_url,
    p.bio,
    p.tags,
    0::bigint AS mutual_count
  FROM public.profiles p
  LEFT JOIN popular pop ON pop.followed_id = p.id
  WHERE p.id != p_user_id
    AND p.id NOT IN (SELECT followed_id FROM my_following)
    AND p.status = 'active'
    AND p.first_name IS NOT NULL AND p.first_name <> ''
    AND p.avatar_url IS NOT NULL
  ORDER BY COALESCE(pop.follower_count, 0) DESC, p.created_at DESC
  LIMIT p_limit;
END;
$$;
