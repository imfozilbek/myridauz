import { ApiError } from '@platform/api-client';
import { loadBrand } from '@platform/brands';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NOW, profile, renderProfile } from './profile-test-kit';

const compress = vi.hoisted(() => ({ compressImage: vi.fn(async (file: Blob) => file) }));
vi.mock('./compress-image', () => compress);

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  URL.createObjectURL = vi.fn(() => 'blob:photo');
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('«Profil» (G65, mockup g65/3)', () => {
  it('shows who the person is, the three numbers and the phone only to its owner', async () => {
    const { client } = renderProfile();
    fireEvent.click(screen.getByText('Dilnoza'));
    expect(screen.getByText(`Yoʻlovchi · ${loadBrand().name} bilan 2 oy`)).toBeTruthy();
    expect(screen.getByText('Haydovchilar meni qanday koʻradi ›')).toBeTruthy();
    expect(await screen.findByText('★ 4,9')).toBeTruthy();
    expect(screen.getByText('8 baho')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('100%')).toBeTruthy();
    expect(screen.getByText('vaqtida')).toBeTruthy();
    expect(screen.getByText('8 izoh')).toBeTruthy();
    expect(screen.getByText('+998 90 123 45 67 · faqat siz koʻrasiz')).toBeTruthy();
    // A passenger has no car and no wallet here.
    expect(screen.queryByText('Mashinam')).toBeNull();
    expect(screen.queryByText('Hamyon')).toBeNull();
    // The past trips live in «Oʻtgan» only (owner decision 10.10.2026): no «Safarlar tarixi».
    expect(screen.queryByText('Safarlar tarixi')).toBeNull();
    await waitFor(() => expect(screen.getAllByAltText('Dilnoza').length).toBeGreaterThan(0));
    expect(client.getAvatar).toHaveBeenCalledWith(profile.id);
    fireEvent.click(screen.getByText('Orqaga'));
    expect(screen.getByLabelText('Profil va rasm')).toBeTruthy();
  });

  it('says «Yangi» while nobody rated the person', async () => {
    const fresh = { rating: { average: null, count: 0 }, onTime: null, trips: 0 };
    renderProfile({}, { clients: { comfort: { standing: async () => fresh } } });
    fireEvent.click(screen.getByText('Dilnoza'));
    expect(await screen.findAllByText('Yangi')).toHaveLength(2);
    expect(screen.getByText('0 baho')).toBeTruthy();
  });

  it('keeps «Bot xabarlari» always on: it shows and never switches off', () => {
    renderProfile();
    fireEvent.click(screen.getByText('Dilnoza'));
    const bot = screen.getByLabelText('Bot xabarlari') as HTMLInputElement;
    expect(bot.checked).toBe(true);
    expect(bot.disabled).toBe(true);
    expect(screen.getByText('Doim yoqilgan: bron, chat, safar xabarlari')).toBeTruthy();
  });

  it('opens «Yordam», the support bot, from the profile', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    renderProfile();
    fireEvent.click(screen.getByText('Dilnoza'));
    fireEvent.click(screen.getByRole('button', { name: 'Yordam' }));
    expect(open.mock.calls[0]?.[0]).toBe(`https://t.me/${loadBrand().bots.support}`);
    open.mockRestore();
  });

  it('uploads a new photo and reports a failure in simple words', async () => {
    const { client, account } = renderProfile();
    fireEvent.click(screen.getByText('Dilnoza'));
    const input = document.querySelector('input[type=file]') as HTMLInputElement;
    // The camera or the gallery, as on screen 2 of the registration (G58).
    expect(input.hasAttribute('capture')).toBe(false);
    const photo = new File(['x'], 'me.jpg', { type: 'image/jpeg' });
    await act(async () => fireEvent.change(input, { target: { files: [photo] } }));
    expect(client.uploadAvatar).toHaveBeenCalledWith(photo);
    expect(account.onAvatarChanged).toHaveBeenCalled();
    client.uploadAvatar.mockRejectedValueOnce(new Error('offline'));
    await act(async () => fireEvent.change(input, { target: { files: [photo] } }));
    expect(screen.getByText('Rasmni yuklab boʻlmadi. Qayta urinib koʻring.')).toBeTruthy();
    // A photo too large says so: another try of the same photo would not help (docs/86 T5).
    client.uploadAvatar.mockRejectedValueOnce(new ApiError(413, 'users.avatar_too_large'));
    await act(async () => fireEvent.change(input, { target: { files: [photo] } }));
    expect(screen.getByText('Rasm juda katta. Boshqa rasmni tanlang.')).toBeTruthy();
  });

  it('works on Telegram Desktop too: a file instead of the camera (G58)', () => {
    renderProfile({ app: 'driver', profile: { ...profile, hasAvatar: false } }, { hasCamera: false });
    fireEvent.click(screen.getByText('Dilnoza'));
    expect(screen.getByText('Rasm qoʻshish')).toBeTruthy();
    expect(document.querySelector('input[type=file]')?.hasAttribute('capture')).toBe(false);
  });
});

describe('the documents (docs/30)', () => {
  it('opens a legal document from «Hujjatlar»', async () => {
    renderProfile();
    fireEvent.click(screen.getByText('Dilnoza'));
    expect(screen.getByText('Oferta, maxfiylik')).toBeTruthy();
    fireEvent.click(screen.getByText('Hujjatlar'));
    // A title on top, as «Safarlar tarixi»: the list paints no gray over the gradient (docs/121 §5).
    expect(screen.getByText('Hujjatlar').className).toContain('market-title');
    fireEvent.click(screen.getByText('Maxfiylik siyosati'));
    // The edition comes with the requisites from the API (G34).
    expect(await screen.findByText(/Tahrir 1\.4/)).toBeTruthy();
  });
});
