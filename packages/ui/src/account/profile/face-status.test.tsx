import type { MyProfile } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StartFlow } from '../../flow/start-flow';
import { renderInShell } from '../../test-shell';
import { AccountContext, type Account } from '../account-context';
import { active, fakeClient, profile } from '../account-test-kit';

// The own face while the team checks it, and after a refusal (G58, docs/118).
function open(face: Partial<MyProfile>, url = '/') {
  window.history.replaceState(null, '', url);
  const account: Account = {
    app: 'passenger',
    client: fakeClient(active),
    profile: { ...profile, hasAvatar: false, ...face },
    avatarVersion: 0,
    onAvatarChanged: vi.fn(),
    onProfileChanged: vi.fn(),
  };
  renderInShell(
    <AccountContext.Provider value={account}>
      <StartFlow actions={[]} />
    </AccountContext.Provider>,
  );
}
afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

describe('FaceStatus (G58)', () => {
  it('«Rasmni almashtirish» of the bot opens the profile; a refused photo says why', async () => {
    open({ avatarStatus: 'rejected', avatarReason: 'face_not_visible' }, '/?profile=photo');
    expect(await screen.findByText(/Rasm tekshiruvdan oʻtmadi: Yuz aniq koʻrinmaydi/)).toBeTruthy();
    // The link opens once: going back shows the main screen.
    expect(window.location.search).toBe('');
  });

  it('a driver photo being checked: only the person sees it', async () => {
    open({ roles: ['passenger', 'driver'], avatarStatus: 'pending', avatarReason: null }, '/?profile=photo');
    expect(await screen.findByText(/Hozircha uni faqat siz koʻrasiz/)).toBeTruthy();
  });

  // A passenger photo shows at once, the team checks it after (owner decision 19.10.2026, G51).
  it('a passenger photo being checked says nothing; without a photo the link says it is optional', async () => {
    open({ hasAvatar: true, avatarStatus: 'pending', avatarReason: null }, '/?profile=photo');
    expect(await screen.findByText('Rasmni almashtirish')).toBeTruthy();
    expect(screen.queryByText(/tekshir/)).toBeNull();
    cleanup();
    open({ avatarStatus: null, avatarReason: null }, '/?profile=photo');
    expect(await screen.findByText('Rasm qoʻshish (ixtiyoriy)')).toBeTruthy();
  });

  it('an approved photo says nothing; without the link the main screen opens', () => {
    open({ avatarStatus: 'approved', avatarReason: null });
    expect(screen.queryByText(/tekshir/)).toBeNull();
  });
});
