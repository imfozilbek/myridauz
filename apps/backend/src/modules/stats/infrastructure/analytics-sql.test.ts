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
    const errors = setup({
      data: [
        {
          name: 'client_error',
          app: 'passenger',
          screen: 'home',
          code: 'render',
          error: 'TypeError',
          detail: "x is undefined (reading 'lat')",
          count: '3',
        },
        {
          name: 'server_error',
          app: 'server',
          screen: '',
          code: 'cron:burnBonuses',
          error: '',
          detail: '',
          count: '1',
        },
        {
          name: 'api_error',
          app: 'driver',
          screen: 'market.review',
          code: 'trips.too_many',
          error: '',
          detail: '',
          count: '2',
        },
      ],
    });
    // G52 (docs/112): what broke goes with a crash; a refusal of a rule is told apart from a crash.
    expect(await errors.source.topErrors(1)).toEqual([
      {
        kind: 'crash',
        app: 'passenger',
        screen: 'home',
        code: 'render',
        what: "TypeError: x is undefined (reading 'lat')",
        count: 3,
      },
      {
        kind: 'server',
        app: 'server',
        screen: 'unknown',
        code: 'unknown',
        what: 'cron:burnBonuses',
        count: 1,
      },
      { kind: 'refusal', app: 'driver', screen: 'market.review', code: 'trips.too_many', what: '', count: 2 },
    ]);
    expect(errors.asked[0]?.body).toContain("blob1 IN ('client_error', 'server_error', 'api_error')");
    const total = setup({ data: [{ count: '5' }] });
    expect(await total.source.errorsSince(1)).toBe(5);
    expect(total.asked[0]?.body).toContain("INTERVAL '1' HOUR");
  });

  it('fails loudly on a refused key', async () => {
    await expect(setup({}, 403).source.errorsSince(1)).rejects.toThrow('stats.sql_403');
  });
});
