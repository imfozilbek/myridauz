import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { AccountContext, type Account } from '../account/account-context';
import { ApiClientsContext } from '../context/api-clients';
import { testClients } from '../test-shell';
import { useReasons } from './use-reasons';

describe('useReasons: a fixed place is no longer red (docs/89 D2)', () => {
  it('drops the face at once after a new selfie, even when the server answers late', () => {
    let version = 0;
    const clients = testClients({ drivers: { getApplication: () => new Promise<never>(() => undefined) } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ApiClientsContext.Provider value={clients}>
        <AccountContext.Provider value={{ avatarVersion: version } as Account}>
          {children}
        </AccountContext.Provider>
      </ApiClientsContext.Provider>
    );
    const { result, rerender } = renderHook(() => useReasons(['face_not_visible', 'side_unclear']), {
      wrapper,
    });
    expect(result.current.reasons).toEqual(['face_not_visible', 'side_unclear']);
    version = 1;
    rerender();
    expect(result.current.reasons).toEqual(['side_unclear']);
  });
});
