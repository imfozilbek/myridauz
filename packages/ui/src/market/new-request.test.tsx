import { ApiError } from '@platform/api-client';
import type { RideRequestInput } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testClients } from '../test-shell';
import { chooseWay, recommendation, renderMarket, tap } from './market-test-kit';
import { NewRequestFlow } from './new-request-flow';

afterEach(cleanup);

describe('NewRequestFlow: "Soʻrov qoldirish" (docs/09)', () => {
  it('asks the route, day, people and price, explains an error of the API and publishes', async () => {
    const publishRequest = vi.fn(async (input: RideRequestInput) => ({
      ...input,
      id: 'r1',
      passenger: { id: '00000000000000000000000000000001', firstName: 'Ali', hasAvatar: false },
      km: 320,
      status: 'open' as const,
    }));
    publishRequest.mockRejectedValueOnce(new ApiError(409, 'trips.too_many'));
    const clients = testClients({ market: { recommend: async () => recommendation, publishRequest } });
    renderMarket(<NewRequestFlow onBack={() => undefined} />, clients);
    await chooseWay();
    await tap(/^Ertaga/);
    await tap('2');
    await tap('Davom etish');
    expect(await screen.findByText('Soʻrovni tekshiring')).toBeTruthy();
    expect(screen.getByText('Haydovchilar vaqt va narx taklif qiladi.')).toBeTruthy();
    await tap('Soʻrov qoldirish');
    expect(
      await screen.findByText('Faol eʼlonlar soni chegaraga yetdi. Eskisini bekor qiling.'),
    ).toBeTruthy();
    await tap('Soʻrov qoldirish');
    expect(await screen.findByText('Soʻrov qoldirildi')).toBeTruthy();
    expect(publishRequest).toHaveBeenLastCalledWith(
      expect.objectContaining({ from: '1726269', to: '1730401', seats: 2, price: 95000 }),
    );
  });
});
