import { afterEach, describe, expect, it } from 'vitest';
import { launchArrival } from './arrival';
import { startParam } from './launch-param';

const open = (start: string | null) =>
  window.history.replaceState(null, '', start === null ? '/' : `/#tgWebAppStartParam=${start}`);
afterEach(() => open(null));

describe('where the person came from (G55, docs/116)', () => {
  it('reads the kind of the link, the mark of its source and the app', () => {
    open('trip_6f1c2f7e__ch-yol-samarqand');
    expect(launchArrival('android 9.6 chrome 120')).toEqual({
      source: 'trip',
      via: 'ch-yol-samarqand',
      client: 'android 9.6 chrome 120',
    });
    // The screen of the trip reads the link as before.
    expect(startParam()).toBe('trip_6f1c2f7e');
  });

  it('takes an ad without a link and a visit without any link', () => {
    open('__ad-insta1');
    expect(launchArrival('ios 9.6')).toEqual({ source: 'direct', via: 'ad-insta1', client: 'ios 9.6' });
    expect(startParam()).toBeNull();
    open(null);
    expect(launchArrival('browser')).toEqual({ source: 'direct', client: 'browser' });
    open('find_1703_1714');
    expect(launchArrival('android 9.6')).toEqual({ source: 'find', client: 'android 9.6' });
  });
});
