import { describe, expect, it, vi } from 'vitest';
import { requestBotMessages, requestSignedContact } from './permissions';

const sdk = vi.hoisted(() => {
  const available = <T,>(result: T) => ({ ifAvailable: vi.fn(() => [true, result] as const) });
  return {
    requestContactComplete: available(Promise.resolve({ raw: 'contact=1&hash=y' })),
    requestWriteAccess: available(Promise.resolve('allowed')),
  };
});
vi.mock('@telegram-apps/sdk-react', () => sdk);

describe('Telegram permissions', () => {
  it('asks Telegram for the signed phone and for bot messages', async () => {
    expect(await requestSignedContact()).toBe('contact=1&hash=y');
    expect(await requestBotMessages()).toBe(true);
    sdk.requestContactComplete.ifAvailable.mockReturnValueOnce([
      true,
      Promise.reject(new Error('no')),
    ] as never);
    expect(await requestSignedContact()).toBeNull();
    sdk.requestWriteAccess.ifAvailable.mockReturnValueOnce([false] as never);
    expect(await requestBotMessages()).toBe(false);
  });
});
