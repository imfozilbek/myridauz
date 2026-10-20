import { ApiError } from '@platform/api-client';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { recommendation, tap } from '../market/market-test-kit';
import { NOW, openBoard } from './board-test-kit';

vi.mock('@telegram-apps/sdk-react', async (original) => ({
  ...(await original<object>()),
  ...(await import('../test-native')).nativeButtons,
}));

beforeEach(() => void vi.useFakeTimers({ toFake: ['Date'], now: NOW }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

// G89 U15: the bounds of the price did not come: the sheet says so and tries again, never empty.
describe('«Taklif yuborish» without the bounds of the price', { timeout: 20_000 }, () => {
  it('says it failed and loads the bounds again', async () => {
    const recommend = vi
      .fn()
      .mockRejectedValueOnce(new ApiError(503, undefined))
      .mockResolvedValue(recommendation);
    openBoard({ market: { recommend } });
    await tap('Taklif yuborish');
    const form = within(await screen.findByRole('dialog'));
    expect(await form.findByText('Birozdan keyin qayta urinib koʻring.')).toBeTruthy();
    fireEvent.click(form.getByRole('button', { name: 'Qayta urinish' }));
    await waitFor(() => expect(recommend).toHaveBeenCalledTimes(2));
    expect(await form.findByRole('button', { name: 'Taklif yuborish' })).toBeTruthy();
  });
});
