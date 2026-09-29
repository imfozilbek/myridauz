import { describe, expect, it } from 'vitest';
import { analyticsSql } from './analytics-sql';

function setup(answer: unknown, status = 200) {
  const asked: { url: string; body: string; auth: string }[] = [];
  const source = analyticsSql({
    accountId: 'acc',
    token: 'read-only',
    dataset: 'app_analytics',
    fetch: async (url, init) => {
      const headers = init?.headers as Record<string, string>;
      asked.push({ url, body: String(init?.body), auth: headers.authorization ?? '' });
      return Response.json(answer, { status });
    },
  });
  return { source, asked };
}

describe('analyticsSql (docs/29)', () => {
  it('asks the SQL API of the account with the read-only key and reads numbers sent as text', async () => {
    const { source, asked } = setup({
      data: [{ name: 'screen_open', app: 'driver', code: '', sessions: '24', events: '206' }],
    });
    expect(await source.counters(7, ['screen_open', 'trip_step'])).toEqual([
      { name: 'screen_open', app: 'driver', code: '', sessions: 24, events: 206 },
    ]);
    expect(asked[0]?.url).toBe('https://api.cloudflare.com/client/v4/accounts/acc/analytics_engine/sql');
    expect(asked[0]?.auth).toBe('Bearer read-only');
    expect(asked[0]?.body).toContain("FROM app_analytics WHERE timestamp > NOW() - INTERVAL '7' DAY");
    expect(asked[0]?.body).toContain("blob1 IN ('screen_open', 'trip_step')");
    expect(asked[0]?.body).toMatch(/FORMAT JSON$/);
  });

  it('keeps only ids in errors and counts the errors of the last hours', async () => {
    const errors = setup({ data: [{ app: 'server', screen: '', code: 'render', count: '3' }] });
    expect(await errors.source.topErrors(1)).toEqual([
      { app: 'server', screen: 'unknown', code: 'render', count: 3 },
    ]);
    expect(errors.asked[0]?.body).toContain("blob1 IN ('client_error', 'api_error')");
    const total = setup({ data: [{ count: '5' }] });
    expect(await total.source.errorsSince(1)).toBe(5);
    expect(total.asked[0]?.body).toContain("INTERVAL '1' HOUR");
  });

  it('fails loudly on a refused key', async () => {
    await expect(setup({}, 403).source.errorsSince(1)).rejects.toThrow('stats.sql_403');
  });
});
