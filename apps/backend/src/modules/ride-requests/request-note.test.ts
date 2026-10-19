import { describe, expect, it } from 'vitest';
import { cancelRequest, publishRequest } from './application/use-cases';
import { setup } from './requests-test-kit';

// «Izoh» of a request (G48, docs/68): «Koʻk darvoza» for the driver, without contacts (docs/07); it
// lives with the points and goes with them (docs/69).
describe('the note of a request', () => {
  it('keeps the note without a phone and drops it with the points', async () => {
    const { deps, request } = setup();
    const published = await publishRequest(deps, 1, { ...request, note: 'Koʻk darvoza, +998 90 123 45 67' });
    const id = published.ok ? published.value.id : '';
    const kept = await deps.requests.find(id);
    expect(kept?.note).toMatch(/^Koʻk darvoza, /u);
    expect(kept?.note).not.toMatch(/123/u);
    await cancelRequest(deps, 1, id);
    expect((await deps.requests.find(id))?.note).toBeNull();
  });

  it('keeps no note when the passenger wrote none', async () => {
    const { deps, request } = setup();
    const published = await publishRequest(deps, 1, request);
    expect((await deps.requests.find(published.ok ? published.value.id : ''))?.note).toBeNull();
  });
});
