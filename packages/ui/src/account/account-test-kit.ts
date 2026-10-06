import type { MeResponse, RegistrationInput } from '@platform/contracts';
import { vi } from 'vitest';

// Test helper for the account gates: a registered person and a users client that answers it.
export const profile = {
  id: '00000000000000000000000000000007',
  firstName: 'Dilnoza',
  gender: 'female' as const,
  phone: '+998901234567',
  roles: ['passenger' as const],
  hasAvatar: true,
  writeAccess: false,
  rating: null,
  avatarStatus: null,
  avatarReason: null,
};
export const active: MeResponse = { state: 'active', profile };

export function fakeClient(me: MeResponse | Error) {
  return {
    getMe: vi.fn(async () => {
      if (me instanceof Error) throw me;
      return me;
    }),
    register: vi.fn<(input: RegistrationInput) => Promise<MeResponse>>(async () => active),
    uploadAvatar: vi.fn(async () => undefined),
    setWriteAccess: vi.fn(async () => undefined),
    deleteMe: vi.fn(async () => undefined),
    getAvatar: vi.fn(async () => new Blob(['x'])),
  };
}
