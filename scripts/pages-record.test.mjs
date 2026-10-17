import { describe, expect, it } from 'vitest';
import { recordStep } from './deploy/pages.mjs';

const HOST = 'passenger.example.uz';
const OWN = 'acme-passenger-4xk.pages.dev';

// G84: the Pages project of the second account gets a suffix; a CNAME to the plain name leads to the
// project of the first account, Cloudflare answers 1014.
describe('the DNS record of a Pages address', () => {
  it('makes a missing record to the address of this project', () => {
    expect(recordStep([], HOST, OWN)).toEqual({
      method: 'POST',
      body: { type: 'CNAME', name: HOST, content: OWN, proxied: true },
    });
  });

  it('points a CNAME of another account at this project again', () => {
    const records = [{ id: 'r1', type: 'CNAME', content: 'acme-passenger.pages.dev' }];
    expect(recordStep(records, HOST, OWN)).toEqual({
      method: 'PATCH',
      id: 'r1',
      body: { type: 'CNAME', name: HOST, content: OWN, proxied: true },
    });
  });

  // The review of G84: the root of a domain may hold MX or TXT next to its CNAME.
  it('finds the CNAME among the other records of the name', () => {
    const records = [
      { id: 't1', type: 'TXT', content: 'v=spf1 -all' },
      { id: 'r1', type: 'CNAME', content: 'acme-passenger.pages.dev' },
    ];
    expect(recordStep(records, HOST, OWN)).toMatchObject({ method: 'PATCH', id: 'r1' });
  });

  it('keeps a right record and any record that is not a CNAME', () => {
    expect(recordStep([{ id: 'r1', type: 'CNAME', content: OWN }], HOST, OWN)).toBeNull();
    expect(recordStep([{ id: 'r2', type: 'A', content: '192.0.2.1' }], HOST, OWN)).toBeNull();
  });
});
