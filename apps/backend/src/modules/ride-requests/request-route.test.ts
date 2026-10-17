import { describe, expect, it } from 'vitest';
import { publishRequest } from './application/use-cases';
import { setup } from './requests-test-kit';

// Lesson 309: «Toshkent shahri» in one tap (G78 П9) sent the whole region, the price of the request
// knew only districts, and no request from Tashkent could be left in production.
describe('the route of a request from a whole region', () => {
  it('keeps the districts of the seat at the door and of the drop off', async () => {
    const { deps, request } = setup();
    const asked: string[] = [];
    const recommend = deps.recommend;
    const sent = await publishRequest(
      { ...deps, recommend: async (from, to) => (asked.push(`${from}:${to}`), recommend(from, to)) },
      1,
      { ...request, from: '1726', to: '1718' },
    );
    expect(sent.ok && [sent.value.from, sent.value.to]).toEqual(['1726273', '1718401']);
    expect(asked).toEqual(['1726273:1718401']);
  });

  it('takes the district of the pitak for a seat at the pitak', async () => {
    const { deps, request } = setup();
    const sent = await publishRequest(deps, 1, { ...request, from: '1726', to: '1718', pickupMode: 'pitak' });
    expect(sent.ok && sent.value.from).toBe('1726273');
  });

  it('keeps a district as it is, and a whole region whose point lies elsewhere', async () => {
    const { deps, request } = setup();
    const district = await publishRequest(deps, 1, request);
    expect(district.ok && district.value.from).toBe('1726273');
    const away = await publishRequest(deps, 2, { ...request, from: '1718', to: '1726273' });
    expect(away.ok && away.value.from).toBe('1718');
  });
});
