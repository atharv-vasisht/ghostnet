import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('Env validation schema', () => {
  const dbSchema = z.object({
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  });

  it('rejects empty DATABASE_URL', () => {
    const result = dbSchema.safeParse({ DATABASE_URL: '' });
    expect(result.success).toBe(false);
  });

  it('accepts valid DATABASE_URL', () => {
    const result = dbSchema.safeParse({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    });
    expect(result.success).toBe(true);
  });
});
