-- 039: Friends-of-friends suggestion function.
-- Follows RLS restricts users to their own rows, so second-hop traversal has to
-- happen in a SECURITY DEFINER function. Returns people followed by users you
-- follow, excluding self + already-followed, sorted by mutual count.

CREATE OR REPLACE FUNCTION public.suggest_users(p_user_id uuid, p_limit int DEFAULT 10)
RETURNS TABLE(
  id uuid,
  first_name text,
  avatar_url text,
  bio text,
  tags text[],
  mutual_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

GRANT EXECUTE ON FUNCTION public.suggest_users(uuid, int) TO authenticated;
