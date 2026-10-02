import { loadBrand } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderInShell } from '../../test-shell';
import { AccountGate } from '../account-gate';
import { fakeClient, settings } from '../account-test-kit';

// The welcome of the driver Mini App, as apps/miniapp-driver gives it (G34).
const welcome = {
  textKey: 'common.driver.welcome',
  points: [
    { icon: 'price', textKey: 'common.welcome.costsBack' },
    { icon: 'bonus', textKey: 'common.welcome.bonus' },
    { icon: 'passengers', textKey: 'common.welcome.passengersFind' },
  ],
} as const;
const brand = loadBrand();
const { formatMoney } = createI18n(DEFAULT_LOCALE);
const open = () =>
  renderInShell(
    <AccountGate
      app="driver"
      client={fakeClient({ state: 'unregistered', suggestedName: 'Rustam', settings })}
      welcome={welcome}
    >
      <p>inside</p>
    </AccountGate>,
  );
afterEach(cleanup);

describe('Registration, screen 1: the welcome with the consent (G34)', () => {
  it('shows the brand logo, the slogan and the points with the bonus of the brand', async () => {
    const { container } = open();
    expect(await screen.findByText(brand.slogan)).toBeTruthy();
    expect(container.querySelector('img.welcome-logo')?.getAttribute('src')).toMatch(/logo\.svg$/);
    expect(screen.getByText('Yoʻl xarajatingiz qaytadi.')).toBeTruthy();
    const bonus = `Boshlash uchun ${formatMoney(brand.promo.amount)} bonus.`;
    expect(screen.getByText(bonus, { normalizer: (text) => text })).toBeTruthy();
    expect(screen.getByText('Yoʻlovchilar sizni oʻzi topadi.')).toBeTruthy();
    expect(screen.getByText(/tugmasini bosib, siz/)).toBeTruthy();
  });

  it('opens each document from the consent line; «Orqaga» comes back to the welcome', async () => {
    open();
    for (const [link, title] of [
      ['ommaviy oferta', 'Ommaviy oferta'],
      ['maxfiylik siyosati', 'Maxfiylik siyosati'],
    ] as const) {
      fireEvent.click(await screen.findByText(link));
      expect(await screen.findAllByText(title)).not.toHaveLength(0);
      expect(screen.queryByText(brand.slogan)).toBeNull();
      fireEvent.click(screen.getByText('Orqaga'));
      expect(await screen.findByText(brand.slogan)).toBeTruthy();
    }
    fireEvent.click(screen.getByText(/shaxsga doir/));
    expect(screen.queryByText(brand.slogan)).toBeNull();
  });

  it('«Davom etish» is the consent: it opens «Siz haqingizda»', async () => {
    const { tracked } = open();
    fireEvent.click(await screen.findByText('Davom etish'));
    expect(await screen.findByText('Siz haqingizda')).toBeTruthy();
    const steps = tracked.filter((event) => event.name === 'registration_step');
    expect(steps.map((event) => 'step' in event && event.step)).toEqual(['consent']);
  });
});
