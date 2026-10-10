import { appHost, loadBrand } from '@platform/brands';
import {
  ADMIN_COMPANY_PATH,
  LEGAL_EDITION,
  PUBLIC_COMPANY_PATH,
  type CompanyState,
} from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { app } from './app';
import { changeModerator } from './modules/team';
import { call, testEnv } from './test-api';

const OWNER = 900;
const MODERATOR = 906;
const company = {
  legalName: 'Yoʻldosh',
  form: 'MChJ',
  stir: '123456789',
  address: 'Toshkent shahri, Mirobod tumani',
  email: 'info@example.uz',
};
const save = (id: number, body: unknown) =>
  call(ADMIN_COMPANY_PATH, id, {
    app: 'admin',
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
const ask = (origin: string) => app.request(PUBLIC_COMPANY_PATH, { headers: { origin } }, testEnv);

describe('company requisites (G34, docs/30)', () => {
  it('gives no requisites and the base edition before the first save, to the site and the Mini Apps', async () => {
    const brand = loadBrand();
    const site = `https://${brand.domain}`;
    const response = await ask(site);
    expect(response.headers.get('cache-control')).toBe('public, max-age=60');
    expect(response.headers.get('access-control-allow-origin')).toBe(site);
    expect(await response.json()).toEqual({ company: null, edition: LEGAL_EDITION });
    const miniApp = `https://${appHost(brand, 'driver')}`;
    expect((await ask(miniApp)).headers.get('access-control-allow-origin')).toBe(miniApp);
    expect((await ask('https://evil.example')).headers.get('access-control-allow-origin')).toBeNull();
  });

  it('lets only the owner read and save; each save is the next edition', async () => {
    expect(await changeModerator(testEnv, OWNER, MODERATOR, true)).toBe('ok');
    const refused = await save(MODERATOR, company);
    expect([refused.status, await refused.json()]).toEqual([403, { error: 'auth.not_owner' }]);
    expect((await call(ADMIN_COMPANY_PATH, 5, { app: 'passenger' })).status).toBe(403);
    const invalid = await save(OWNER, { ...company, stir: '12345' });
    expect([invalid.status, await invalid.json()]).toEqual([400, { error: 'company.invalid_input' }]);
    expect((await save(OWNER, company)).status).toBe(200);
    const second = (await (await save(OWNER, { ...company, form: 'AJ' })).json()) as CompanyState;
    expect(second.history.map((item) => item.version)).toEqual([2, 1]);
    expect(second.current).toMatchObject({ company: { form: 'AJ' }, changedBy: OWNER });
    // «Hujjatlar va kompaniya» is in «Boshqaruv»: the owner's only, reading too (docs/120, G75).
    expect((await call(ADMIN_COMPANY_PATH, MODERATOR, { app: 'admin' })).status).toBe(403);
    const read = (await (await call(ADMIN_COMPANY_PATH, OWNER, { app: 'admin' })).json()) as CompanyState;
    expect(read.history.length).toBe(2);
    const answer = await (await ask(`https://${loadBrand().domain}`)).json();
    expect(answer).toMatchObject({ company: { ...company, form: 'AJ' }, edition: { version: '1.6' } });
  });
});
