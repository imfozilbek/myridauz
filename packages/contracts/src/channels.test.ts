import { describe, expect, it } from 'vitest';
import { driverTripPublicityPath, tripPublicitySchema, tripViewPath } from './channels';

const publicity = {
  channels: [{ username: 'yol_samarqand', title: 'Samarqand', posted: true }],
  views: 3,
  link: 'https://t.me/test_bot?startapp=trip_1__driver',
};

describe('what the driver sees after the publishing (G63, docs/119)', () => {
  it('reads the channels of the trip, the people who opened it and its link', () => {
    expect(tripPublicitySchema.parse(publicity)).toEqual(publicity);
    expect(tripPublicitySchema.parse({ ...publicity, channels: [], views: 0 }).views).toBe(0);
    expect(driverTripPublicityPath('t-1')).toBe('/driver/trips/t-1/publicity');
    // The trip page of the passenger app says it was opened (search, post button, link).
    expect(tripViewPath('t-1')).toBe('/trips/t-1/view');
  });

  it('refuses a broken answer', () => {
    for (const views of [-1, 1.5])
      expect(tripPublicitySchema.safeParse({ ...publicity, views }).success).toBe(false);
    expect(tripPublicitySchema.safeParse({ ...publicity, link: 'trip_1' }).success).toBe(false);
    const channel = { username: 'a b', title: 'Samarqand', posted: true };
    expect(tripPublicitySchema.safeParse({ ...publicity, channels: [channel] }).success).toBe(false);
  });
});
