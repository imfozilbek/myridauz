import { ApiError, type UsersClient } from '@platform/api-client';
import { loadBrand } from '@platform/brands';
import type { MeResponse, RegistrationInput } from '@platform/contracts';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../test-shell';
import { AccountGate } from './account-gate';
import { TeamGate } from './team-gate';

const permissions = vi.hoisted(() => ({
  requestSignedContact: vi.fn(async (): Promise<string | null> => 'contact=signed'),
  requestBotMessages: vi.fn(async () => true),
}));
vi.mock('../telegram/permissions', () => permissions);

const settings = { passengerAvatarRequired: false };
const profile = {
  id: 7,
  firstName: 'Dilnoza',
  gender: 'female' as const,
  phone: '+998901234567',
  roles: ['passenger' as const],
  hasAvatar: false,
  writeAccess: false,
  rating: null,
};
const active: MeResponse = { state: 'active', profile, settings };

function fakeClient(me: MeResponse | Error) {
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

const welcome = { icon: 'search', textKey: 'common.passenger.welcome' } as const;
const gate = (client: UsersClient, app: 'passenger' | 'driver' = 'passenger') =>
  renderInShell(
    <AccountGate app={app} client={client} welcome={welcome}>
      <p>inside</p>
    </AccountGate>,
  );

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('AccountGate', () => {
  it('registers a new person step by step and lets them in', async () => {
    const client = fakeClient({ state: 'unregistered', suggestedName: 'Dilnoza', settings });
    const { tracked } = gate(client);
    const brand = loadBrand();
    expect(await screen.findByText(brand.slogan)).toBeTruthy();
    expect(screen.getByText('Safar toping')).toBeTruthy();
    fireEvent.click(screen.getByText('Davom etish'));
    fireEvent.click(screen.getByText('Roziman'));
    const input = screen.getByDisplayValue('Dilnoza');
    fireEvent.change(input, { target: { value: 'Ali 998' } });
    fireEvent.click(screen.getByText('Davom etish'));
    expect(screen.getByText(/Faqat harflardan/)).toBeTruthy();
    fireEvent.change(input, { target: { value: '  Dilnoza ' } });
    fireEvent.click(screen.getByText('Davom etish'));
    fireEvent.click(screen.getByText('Ayol'));
    await act(async () => fireEvent.click(screen.getByText('Raqamni yuborish')));
    expect(await screen.findByText('inside')).toBeTruthy();
    expect(client.register).toHaveBeenCalledWith({
      consent: true,
      firstName: 'Dilnoza',
      gender: 'female',
      contact: 'contact=signed',
    });
    const steps = tracked.filter((event) => event.name === 'registration_step');
    expect(steps.map((event) => 'step' in event && event.step)).toEqual([
      'consent',
      'name',
      'gender',
      'phone',
      'done',
    ]);
    await waitFor(() => expect(client.setWriteAccess).toHaveBeenCalledWith(true));
  });

  it('says a phone is required when the person refuses to share it', async () => {
    permissions.requestSignedContact.mockResolvedValueOnce(null);
    gate(fakeClient({ state: 'unregistered', suggestedName: 'Ali', settings }));
    fireEvent.click(await screen.findByText('Davom etish'));
    fireEvent.click(screen.getByText('Roziman'));
    fireEvent.click(screen.getByText('Davom etish'));
    fireEvent.click(screen.getByText('Erkak'));
    await act(async () => fireEvent.click(screen.getByText('Raqamni yuborish')));
    expect(screen.getByText(/Raqamsiz/)).toBeTruthy();
    fireEvent.click(screen.getByText('Orqaga'));
    expect(screen.getByText('Ayol')).toBeTruthy();
  });

  it('shows the block with its end date, or for good', async () => {
    gate(fakeClient({ state: 'blocked', until: Date.UTC(2026, 9, 27, 12) }));
    expect(await screen.findByText('Hisobingiz bloklangan')).toBeTruthy();
    expect(screen.getByText(/27-oktabr/)).toBeTruthy();
  });

  it('turns a blocked phone during registration into the block screen', async () => {
    const client = fakeClient({ state: 'unregistered', suggestedName: 'Ali', settings });
    client.register.mockRejectedValueOnce(new ApiError(403, 'users.blocked'));
    gate(client);
    fireEvent.click(await screen.findByText('Davom etish'));
    fireEvent.click(screen.getByText('Roziman'));
    fireEvent.click(screen.getByText('Davom etish'));
    fireEvent.click(screen.getByText('Erkak'));
    await act(async () => fireEvent.click(screen.getByText('Raqamni yuborish')));
    expect(await screen.findByText(/butunlay|qoʻllab-quvvatlash/)).toBeTruthy();
  });

  it('asks for a photo when the brand requires it and retries after an error', async () => {
    const required = { ...active, settings: { passengerAvatarRequired: true } };
    gate(fakeClient(required));
    expect(await screen.findByText('Rasmingizni qoʻshing')).toBeTruthy();
    const failing = fakeClient(new Error('offline'));
    gate(failing);
    fireEvent.click(await screen.findByText('Qayta urinish'));
    await waitFor(() => expect(failing.getMe).toHaveBeenCalledTimes(2));
  });
});

describe('TeamGate', () => {
  const team = (client: UsersClient) =>
    renderInShell(
      <TeamGate client={client}>
        <p>panel</p>
      </TeamGate>,
    );

  it('opens the panel only for the team', async () => {
    team(fakeClient(active));
    expect(await screen.findByText('panel')).toBeTruthy();
    team(fakeClient(new ApiError(403, 'auth.not_admin')));
    expect(await screen.findByText(/faqat .* jamoasi uchun/)).toBeTruthy();
    team(fakeClient(new ApiError(500)));
    expect(await screen.findByText('Qayta urinish')).toBeTruthy();
  });
});
