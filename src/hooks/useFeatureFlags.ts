import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

let cachedFlags: Record<string, boolean> | null = null;

export function useFeatureFlags() {
  const [flags, setFlags] = useState<Record<string, boolean>>(cachedFlags || {});
  const [isLoading, setIsLoading] = useState(!cachedFlags);

  useEffect(() => {
    if (cachedFlags) return;
    supabase
      .from('feature_flags')
      .select('key, is_enabled')
      .then(({ data }) => {
        const map: Record<string, boolean> = {};
        for (const flag of data ?? []) {
          map[flag.key] = flag.is_enabled;
        }
        cachedFlags = map;
        setFlags(map);
        setIsLoading(false);
      });
  }, []);

  const isEnabled = (key: string) => flags[key] ?? false;

  return { flags, isLoading, isEnabled };
}
