import { describe, expect, it } from 'vitest';
import { loadBrand } from '../brands/index.ts';
import { ensureAccountOf } from './deploy/account.mjs';

const internal = loadBrand(loadBrand().id, 'internal');
const production = loadBrand();
// The first account of the brand holds only the zone of the internal environment (docs/179).
const firstAccount = async (_method, path) =>
  path.includes(`name=${internal.domain}&`) ? [{ name: internal.domain }] : [];
const secrets = { CLOUDFLARE_API_TOKEN: 'token', CLOUDFLARE_ACCOUNT_ID: 'account' };

// docs/179: the secrets of one environment never deploy the other one.
describe('the account of an environment', () => {
  it('lets the environment deploy to the account of its domain', async () => {
    await expect(ensureAccountOf(internal, 'internal', firstAccount, secrets)).resolves.toEqual({
      name: internal.domain,
    });
  });

  it('stops production on the account of the team before anything changes', async () => {
    await expect(ensureAccountOf(production, 'production', firstAccount, secrets)).rejects.toThrow(
      `production: the Cloudflare account has no zone ${production.domain}`,
    );
  });

  it('asks only the account of the secrets', async () => {
    const asked = [];
    await ensureAccountOf(
      internal,
      'internal',
      async (method, path) => {
        asked.push(`${method} ${path}`);
        return [{ name: internal.domain }];
      },
      secrets,
    );
    expect(asked).toEqual([`GET /zones?name=${internal.domain}&account.id=:account`]);
  });

  it('stops when Cloudflare gives no answer', async () => {
    await expect(ensureAccountOf(internal, 'internal', async () => null, secrets)).rejects.toThrow(
      /no zone/u,
    );
  });

  it('stops on empty secrets by their names before it asks Cloudflare', async () => {
    const asked = [];
    const empty = { CLOUDFLARE_API_TOKEN: '', CLOUDFLARE_ACCOUNT_ID: '' };
    const deploy = ensureAccountOf(internal, 'internal', async (method) => asked.push(method), empty);
    await expect(deploy).rejects.toThrow(
      'internal: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID empty, add them to the GitHub Environment internal',
    );
    expect(asked).toEqual([]);
  });
});
