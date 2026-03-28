import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

import { supabase } from '../lib/supabase';

describe('bookmarkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('supabase mock works', () => {
    const result = supabase.from('saved_events');
    expect(result).toBeDefined();
    expect(result.select).toBeDefined();
  });

  it('can chain query methods', async () => {
    const result = supabase.from('saved_events').select('*').eq('user_id', 'test');
    expect(result).toBeDefined();
  });
});
