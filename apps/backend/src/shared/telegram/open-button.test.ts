import { loadBrand } from '@platform/brands';
import { BOOKING_LINK } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { appButton, botAppUrl } from './open-button';

const brand = loadBrand();

// G87 V4 (docs/116): every button of a bot message carries the mark of its message.
describe('the buttons of bot messages', () => {
  it('open the Mini App on its link with the mark bot-<kind>', () => {
    const id = '6f1c2f7e-0000-4000-8000-000000000001';
    expect(appButton(brand, 'passenger', 'Ochish', { name: BOOKING_LINK, id }).web_app.url).toBe(
      `https://passenger.${brand.domain}/?booking=${id}&via=bot-booking`,
    );
    expect(appButton(brand, 'driver', 'Ochish').web_app.url).toBe(
      `https://driver.${brand.domain}/?via=bot-home`,
    );
  });

  it('keep the mark in the form of docs/116: small letters, digits and hyphens, 21 signs', () => {
    const url = new URL(botAppUrl(brand, 'admin', 'Team_Queue.Card of the day', { stats: 'day' }));
    expect(url.searchParams.get('stats')).toBe('day');
    expect(url.searchParams.get('via')).toBe('bot-team-queue-card-o');
  });
});
