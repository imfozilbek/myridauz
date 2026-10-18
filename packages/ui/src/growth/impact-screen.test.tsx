import type { GrowthClient } from '@platform/api-client';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { ImpactScreen } from './impact-screen';
import { QrScreen } from './qr-screen';

vi.mock('./qr-picture', async (original) => ({
  ...(await original<typeof import('./qr-picture')>()),
  drawQrPicture: async () => new Blob(['png'], { type: 'image/png' }),
}));

afterEach(cleanup);

const MINE = { joined: 3, rode: 2, qr: 'https://t.me/brand_bot?startapp=__qr-a1b2c3' };
const CARD = {
  prepared: null,
  link: 'https://t.me/brand_bot?startapp=__share-join-a1b2c3',
  text: 'Siz ham qoʻshiling!',
};
const open = (ui: JSX.Element, growth: Partial<GrowthClient> = {}) =>
  renderMarket(ui, testClients({ growth: { mine: async () => MINE, ...growth } }));

// «Sizning taʼsiringiz» and «Oynaga QR» (G69, docs/123, mockup g69/2 phone 3).
describe('what came of the links of a person', () => {
  it('shows who came and rode, the badge reached, the next with its bar and the later one', async () => {
    open(<ImpactScreen onBack={() => undefined} />);
    expect(await screen.findByText('3 kishi')).toBeTruthy();
    expect(screen.getByText('havolangiz orqali qoʻshildi · 2 tasi safarga chiqdi')).toBeTruthy();
    expect(screen.getByText('Yoʻl hamrohi')).toBeTruthy();
    expect(screen.getByText('1 kishini olib keldingiz')).toBeTruthy();
    expect(screen.getByText('5 kishi · yana 2 ta')).toBeTruthy();
    expect(screen.getAllByRole('progressbar')).toHaveLength(1);
    expect(screen.getByText('Yoʻnalish qahramoni')).toBeTruthy();
    expect(screen.getByText('25 kishi')).toBeTruthy();
  });

  it('«Yana ulashish» sends the ready card with the own link; an old Telegram gets its words (G88)', async () => {
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    const loopCard = vi.fn<GrowthClient['loopCard']>(async () => CARD);
    const { tracked } = open(<ImpactScreen onBack={() => undefined} />, { loopCard });
    await tap('Yana ulashish');
    await waitFor(() => expect(opened).toHaveBeenCalled());
    expect(loopCard).toHaveBeenCalledWith({ loop: 'share-join' });
    expect(String(opened.mock.calls[0]?.[0])).toBe(
      `https://t.me/share/url?url=${encodeURIComponent(CARD.link)}&text=${encodeURIComponent(CARD.text)}`,
    );
    expect(tracked.find((event) => event.name === 'share_done')).toMatchObject({
      button: 'share-join',
      target: 'chat',
    });
    opened.mockRestore();
  });

  it('gives a driver the QR of the own link to print and download', async () => {
    const qrPicture = vi.fn<GrowthClient['qrPicture']>(async () => 'https://api.test/stories/x');
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    const { tracked } = open(<QrScreen onBack={() => undefined} />, { qrPicture });
    const code = await screen.findByRole('img', { name: /^Skanerlang: / });
    expect(code.getAttribute('src')).toMatch(/^data:image\/svg\+xml/u);
    await tap('Rasmni yuklab olish');
    await waitFor(() =>
      expect(opened).toHaveBeenCalledWith('https://api.test/stories/x', '_blank', 'noopener'),
    );
    expect(qrPicture.mock.calls[0]?.[0].type).toBe('image/png');
    expect(tracked.find((event) => event.name === 'share_done')).toMatchObject({ button: 'qr' });
    opened.mockRestore();
  });
});
