import { describe, expect, it } from 'vitest';
import { arrivalSchema, channelVia, splitStart, tripBookLink, VIA_DRIVER, withVia } from './arrival';

describe('the mark of a link (G55, docs/116)', () => {
  it('goes after the link and comes back without changing it', () => {
    const link = withVia('trip_6f1c2f7e-3c1b-4f5e-9a3d-2b8c1d0e4f5a', 'ch-yol-samarqand');
    expect(link.length).toBeLessThanOrEqual(64);
    expect(splitStart(link)).toEqual({
      start: 'trip_6f1c2f7e-3c1b-4f5e-9a3d-2b8c1d0e4f5a',
      via: 'ch-yol-samarqand',
    });
    expect(splitStart(withVia('sub_1703_1714_2026-10-05', 'story'))).toEqual({
      start: 'sub_1703_1714_2026-10-05',
      via: 'story',
    });
  });

  it('keeps an old link as it is, and an ad without a link goes to the home', () => {
    expect(splitStart('find_1703_1714')).toEqual({ start: 'find_1703_1714', via: null });
    expect(splitStart('__ad-insta1')).toEqual({ start: null, via: 'ad-insta1' });
    expect(splitStart('trip_1__Bad Mark')).toEqual({ start: 'trip_1__Bad Mark', via: null });
  });

  it('names a channel in a short mark of letters, digits and hyphens', () => {
    expect(channelVia('yol_andijon')).toBe('ch-yol-andijon');
    expect(channelVia('Yol_Qashqadaryo_Shahrisabz')).toBe('ch-yol-qashqadaryo-sh');
    expect(channelVia('a_very_long_name_ending_in__')).toMatch(/^ch-[a-z0-9-]*[a-z0-9]$/);
  });

  it('accepts only marks and names, never free text', () => {
    expect(
      arrivalSchema.safeParse({ source: 'trip', via: 'ad-1', client: 'android 9.6 chrome 120' }).success,
    ).toBe(true);
    expect(arrivalSchema.safeParse({ via: 'Ali Valiyev' }).success).toBe(false);
    expect(arrivalSchema.safeParse({ client: '+998901234567' }).success).toBe(false);
  });

  it('builds the link of a trip ready to book with the mark of its source (G63, docs/119)', () => {
    const id = '6f1c2f7e-3c1b-4f5e-9a3d-2b8c1d0e4f5a';
    const link = tripBookLink('test_bot', id, VIA_DRIVER);
    expect(link).toBe(`https://t.me/test_bot?startapp=trip_${id}__driver`);
    const start = link.split('?startapp=')[1] ?? '';
    expect(start.length).toBeLessThanOrEqual(64);
    expect(splitStart(start)).toEqual({ start: `trip_${id}`, via: 'driver' });
  });
});
