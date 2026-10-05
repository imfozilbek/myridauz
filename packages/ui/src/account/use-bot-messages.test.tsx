import { ApiError, type UsersClient } from '@platform/api-client';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Account } from './account-context';
import { useBotMessages } from './use-bot-messages';

vi.mock('../telegram/permissions', () => ({ requestBotMessages: async () => true }));

describe('useBotMessages on a bad network (G43)', () => {
  it('a failed save stays quiet: the next launch asks again', async () => {
    const setWriteAccess = vi.fn(async () => Promise.reject(new ApiError(0, 'network.failed')));
    const account = {
      client: { setWriteAccess } as unknown as UsersClient,
      profile: { writeAccess: false },
    } as unknown as Account;
    renderHook(() => useBotMessages(account));
    await waitFor(() => expect(setWriteAccess).toHaveBeenCalledWith(true));
  });
});
