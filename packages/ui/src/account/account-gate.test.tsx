import { ApiError, type UsersClient } from '@platform/api-client';
import { loadBrand } from '@platform/brands';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FeedContext } from '../feed/feed-context';
import { renderInShell } from '../test-shell';
import { AccountGate } from './account-gate';
import { active, fakeClient, profile } from './account-test-kit';
import { addFace, FACE, passWelcome } from './registration/registration-test-kit';

const permissions = vi.hoisted(() => ({
  requestSignedContact: vi.fn(async (): Promise<string | null> => 'contact=signed'),
  requestBotMessages: vi.fn(async () => true),
}));
vi.mock('../telegram/permissions', () => permissions);
vi.mock('./profile/compress-image', () => ({ compressImage: async (file: Blob) => file }));

const welcome = {
  logo: 'logo.svg',
  points: [{ icon: 'team', textKey: 'common.welcome.verified' }],
} as const;
const gate = (client: UsersClient, app: 'passenger' | 'driver' = 'passenger') =>
  renderInShell(
    <AccountGate app={app} client={client} welcome={welcome}>
      <p>inside</p>
    </AccountGate>,
  );

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('AccountGate', () => {
  it('registers a new person in two screens and lets them in', async () => {
    const client = fakeClient({ state: 'unregistered', suggestedName: 'Dilnoza' });
    const { tracked, container } = gate(client);
    const brand = loadBrand();
    expect(await screen.findByText(brand.slogan)).toBeTruthy();
    // What the person gets, before any question (docs/86 T11).
    expect(screen.getByText('Haydovchilar tekshirilgan.')).toBeTruthy();
    await passWelcome();
    await addFace(container);
    const input = screen.getByDisplayValue('Dilnoza');
    fireEvent.change(input, { target: { value: 'Ali 998' } });
    expect(screen.getByText(/Faqat harflardan/)).toBeTruthy();
    fireEvent.change(input, { target: { value: '  Dilnoza ' } });
    fireEvent.click(screen.getByText('Ayol'));
    await act(async () => fireEvent.click(screen.getByText('Raqamni yuborish')));
    expect(await screen.findByText('inside')).toBeTruthy();
    expect(client.register).toHaveBeenCalledWith({
      consent: true,
      firstName: 'Dilnoza',
      gender: 'female',
      contact: 'contact=signed',
      // The first touch goes with the registration (G55, docs/116).
      came: { source: 'direct', client: 'browser' },
    });
    // The face goes up right after the registration (G58).
    expect(client.uploadAvatar).toHaveBeenCalledWith(FACE);
    const steps = tracked.filter((event) => event.name === 'registration_step');
    expect(steps.map((event) => 'step' in event && event.step)).toEqual([
      'consent',
      'about',
      'phone',
      'done',
    ]);
    await waitFor(() => expect(client.setWriteAccess).toHaveBeenCalledWith(true));
  });

  it('says a phone is required when the person refuses to share it', async () => {
    permissions.requestSignedContact.mockResolvedValueOnce(null);
    const { container } = gate(fakeClient({ state: 'unregistered', suggestedName: 'Ali' }));
    await passWelcome();
    await addFace(container);
    fireEvent.click(screen.getByText('Erkak'));
    await act(async () => fireEvent.click(screen.getByText('Raqamni yuborish')));
    expect(screen.getByText(/Raqamsiz/)).toBeTruthy();
    // The person can try again from the same screen.
    expect(screen.getByText('Raqamni yuborish')).toBeTruthy();
  });

  it('shows the block with its end date, or for good', async () => {
    gate(fakeClient({ state: 'blocked', until: Date.UTC(2026, 9, 27, 12) }));
    expect(await screen.findByText('Hisobingiz bloklangan')).toBeTruthy();
    expect(screen.getByText(/27-oktabr/)).toBeTruthy();
    // A blocked person can still ask the team why (docs/86 V4).
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    fireEvent.click(screen.getByText('Qoʻllab-quvvatlashga yozish'));
    expect(open.mock.calls[0]?.[0]).toBe(`https://t.me/${loadBrand().bots.support}`);
    open.mockRestore();
  });

  it('blocked on the road: the app stays open to finish the trip, a line says why (docs/158 Ж)', async () => {
    gate(fakeClient({ ...active, block: { until: Date.UTC(2026, 9, 27, 12) } }));
    expect(await screen.findByText('inside')).toBeTruthy();
    expect(screen.getByText('Hisobingiz bloklangan. Joriy safarni yakunlang.')).toBeTruthy();
  });

  it('turns a blocked phone during registration into the block screen', async () => {
    const client = fakeClient({ state: 'unregistered', suggestedName: 'Ali' });
    client.register.mockRejectedValueOnce(new ApiError(403, 'users.blocked'));
    const { container } = gate(client);
    await passWelcome();
    await addFace(container);
    fireEvent.click(screen.getByText('Erkak'));
    await act(async () => fireEvent.click(screen.getByText('Raqamni yuborish')));
    expect(await screen.findByText(/butunlay|qoʻllab-quvvatlash/)).toBeTruthy();
  });

  it('asks for the face of both roles when it is missing and retries after an error', async () => {
    const noFace = { state: 'active' as const, profile: { ...profile, hasAvatar: false } };
    gate(fakeClient(noFace), 'driver');
    expect(await screen.findByText('Rasmingizni qoʻshing')).toBeTruthy();
    const failing = fakeClient(new Error('offline'));
    gate(failing);
    fireEvent.click(await screen.findByText('Qayta urinish'));
    await waitFor(() => expect(failing.getMe).toHaveBeenCalledTimes(2));
  });

  it('takes the fresh profile on a live signal, quietly (G43, docs/64)', async () => {
    let signal: () => void = () => undefined;
    const subscribe = (listener: () => void) => {
      signal = listener;
      return () => undefined;
    };
    const client = fakeClient(active);
    renderInShell(
      <FeedContext.Provider value={subscribe}>
        <AccountGate app="passenger" client={client} welcome={welcome}>
          <p>inside</p>
        </AccountGate>
      </FeedContext.Provider>,
    );
    expect(await screen.findByText('inside')).toBeTruthy();
    client.getMe.mockResolvedValueOnce({ state: 'blocked', until: Date.UTC(2026, 9, 27, 12) });
    act(() => signal());
    expect(await screen.findByText('Hisobingiz bloklangan')).toBeTruthy();
  });
});
