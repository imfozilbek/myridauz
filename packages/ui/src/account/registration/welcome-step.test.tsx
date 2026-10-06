import { loadBrand } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../../test-shell';
import { AccountGate } from '../account-gate';
import { fakeClient } from '../account-test-kit';

const permissions = vi.hoisted(() => ({
  requestSignedContact: vi.fn(async () => null),
  requestBotMessages: vi.fn(async () => true),
}));
vi.mock('../../telegram/permissions', () => permissions);

// The welcome of the driver Mini App, as apps/miniapp-driver gives it (G58).
const welcome = {
  logo: 'logo-driver.svg',
  points: [
    { icon: 'wallet', textKey: 'common.welcome.costsBack' },
    { icon: 'bonus', textKey: 'common.welcome.bonus' },
    { icon: 'passengers', textKey: 'common.welcome.passengersFind' },
  ],
} as const;
const brand = loadBrand();
const { formatMoney } = createI18n(DEFAULT_LOCALE);
const OFFER = /ni qabul qilaman/;
const DATA = /ga roziman/;
const open = () =>
  renderInShell(
    <AccountGate
      app="driver"
      client={fakeClient({ state: 'unregistered', suggestedName: 'Rustam' })}
      welcome={welcome}
    >
      <p>inside</p>
    </AccountGate>,
  );
const button = () => screen.getByRole('button', { name: 'Davom etish' });
const tick = (line: RegExp) => {
  const label = screen.getByText(line).closest('label');
  if (label) fireEvent.click(label);
};
const checked = () => screen.getAllByRole('checkbox').map((box) => (box as HTMLInputElement).checked);
afterEach(cleanup);

describe('Registration, screen 1: the welcome with two ticks (G58)', () => {
  it('shows the logo of the app, the brand, the slogan and «Nima uchun» rows; no subtitle', async () => {
    const { container } = open();
    expect(await screen.findByText(brand.slogan)).toBeTruthy();
    expect(container.querySelector('img.welcome-logo')?.getAttribute('src')).toMatch(/logo-driver\.svg$/);
    expect(screen.getByText(brand.name)).toBeTruthy();
    expect(screen.getByText(`Nima uchun ${brand.name}`)).toBeTruthy();
    expect(screen.getByText('Yoʻl xarajatingiz qaytadi.')).toBeTruthy();
    const bonus = `Boshlash uchun ${formatMoney(brand.promo.amount)} bonus.`;
    expect(screen.getByText(bonus, { normalizer: (text) => text })).toBeTruthy();
    expect(screen.getByText('Yoʻlovchilar sizni oʻzi topadi.')).toBeTruthy();
    // Each row has its icon in a tile, as the tiles of the main screen.
    const section = screen.getByText(`Nima uchun ${brand.name}`).closest('section');
    expect(section?.querySelectorAll('span[style] > svg')).toHaveLength(3);
    expect(screen.queryByText('Safaringizga yoʻlovchi toping')).toBeNull();
    expect(screen.queryByText(/tugmasini bosib, siz/)).toBeNull();
  });

  it('«Davom etish» stays inactive until both ticks are set', async () => {
    open();
    await screen.findByText(brand.slogan);
    expect(checked()).toEqual([false, false]);
    expect(button()).toHaveProperty('disabled', true);
    tick(OFFER);
    expect(button()).toHaveProperty('disabled', true);
    tick(DATA);
    expect(checked()).toEqual([true, true]);
    expect(button()).toHaveProperty('disabled', false);
    tick(OFFER);
    expect(button()).toHaveProperty('disabled', true);
  });

  it('a document name opens the document without ticking; «Orqaga» keeps the ticks', async () => {
    open();
    await screen.findByText(brand.slogan);
    tick(DATA);
    for (const link of [
      'Ommaviy oferta',
      'Maxfiylik siyosati',
      'Shaxsga doir maʼlumotlarimni qayta ishlash',
    ]) {
      fireEvent.click(screen.getByText(link));
      expect(screen.queryByText(brand.slogan)).toBeNull();
      fireEvent.click(screen.getByText('Orqaga'));
      expect(await screen.findByText(brand.slogan)).toBeTruthy();
      expect(checked()).toEqual([false, true]);
    }
  });

  it('«Davom etish» asks Telegram to let the bot write and opens «Siz haqingizda»', async () => {
    const { tracked } = open();
    await screen.findByText(brand.slogan);
    tick(OFFER);
    tick(DATA);
    fireEvent.click(button());
    expect(permissions.requestBotMessages).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Siz haqingizda')).toBeTruthy();
    const steps = tracked.filter((event) => event.name === 'registration_step');
    expect(steps.map((event) => 'step' in event && event.step)).toEqual(['consent']);
  });
});
