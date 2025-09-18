// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiClient } from '../client';

const BASE = 'https://example.com/api';

describe('ApiClient', () => {
  // сохранять originalFetch не обязательно для этих тестов

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('performs GET and parses JSON', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });

    const client = new ApiClient(BASE);
    const res = await client.get<{ ok: boolean }>('/health');
    expect(res.status).toBe(200);
    expect(res.data.ok).toBe(true);
  });

  it('handles HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ message: 'boom' }),
    });

    const client = new ApiClient(BASE);
    await expect(client.get('/fail')).rejects.toMatchObject({ status: 0 });
  });

  it('retries on network error', async () => {
    const err = new TypeError('network');
    const ok = {
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    };
    global.fetch = vi.fn()
      .mockRejectedValueOnce(err)
      .mockResolvedValueOnce(ok);

    const client = new ApiClient(BASE);
    const res = await client.get('/retry');
    expect(res.status).toBe(200);
  });
});


