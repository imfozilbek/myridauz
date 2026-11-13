import { describe, expect, it } from 'vitest';
import { eventRows, serverRows, type PathEvent } from './path-events';
import { errorsFile, peopleFile } from './paths-file';
import { pathsReport, tgBucketOf, tgPlatformOf } from './paths';

// G99 (docs/234): people, not events; the first touch, the version of Telegram and its app.
const event = (who: string, name: string, more: Partial<PathEvent> = {}): PathEvent => ({
  who,
  entry: 'ch-yol-andijon',
  tg: '8.0',
  platform: 'android',
  name,
  app: 'passenger',
  code: '',
  at: 1000,
  ...more,
});

describe('the paths by source and Telegram (G99)', () => {
  it('counts each person once on a step, by the source of the first touch', () => {
    const rows = [
      ...eventRows([
        event('a', 'screen_open'),
        event('a', 'screen_open', { at: 2000 }),
        event('b', 'screen_open'),
        event('a', 'trip_search', { code: 'found' }),
        event('c', 'screen_open', { entry: 'direct', tg: '6.9', platform: '' }),
      ]),
      ...serverRows([
        { who: 'a', entry: 'ch-yol-andijon', client: 'android 8.0 chrome 120', step: 'rode', at: 3 },
      ]),
    ];
    const report = pathsReport(rows, [{ entry: 'direct', tg: '6.9', platform: null, count: 4 }]);
    const channel = report.sources.find((row) => row.kind === 'channel');
    const passenger = channel?.paths.find((path) => path.role === 'passenger')?.steps;
    expect(channel?.people).toBe(2);
    expect(passenger?.map((step) => [step.step, step.count])).toEqual([
      ['opened', 2],
      ['from', 0],
      ['to', 0],
      ['searched', 1],
      ['found', 1],
      ['trip_opened', 0],
      ['requested', 0],
      ['confirmed', 0],
      ['rode', 1],
    ]);
    expect(report.sources.find((row) => row.kind === 'direct')).toMatchObject({ people: 1, errors: 4 });
    expect(report.versions.map((row) => [row.tg, row.people, row.errors])).toEqual([
      ['old', 1, 4],
      ['v8', 2, 0],
    ]);
    expect(report.platforms.map((row) => [row.platform, row.people])).toEqual([
      ['android', 2],
      ['unknown', 1],
    ]);
  });

  it('puts every version and app of Telegram in its group', () => {
    expect(['6.9', '7.0', '7.10', '8.0', '9.1', null, '0'].map(tgBucketOf)).toEqual([
      'old',
      'v7',
      'v7',
      'v8',
      'v8',
      'none',
      'none',
    ]);
    expect(['ios', 'android_x', 'weba', 'unigram', null].map(tgPlatformOf)).toEqual([
      'ios',
      'android',
      'weba',
      'other',
      'unknown',
    ]);
  });

  it('writes the files of the analyst without a phone, a name or a Telegram ID', () => {
    const rows = eventRows([event('p1', 'screen_open'), event('p1', 'booking_step', { code: 'requested' })]);
    const [head, line] = peopleFile(rows).split('\n');
    expect(head?.startsWith('person,source,mark,telegram,telegram_group,platform,passenger_opened')).toBe(
      true,
    );
    expect(line?.startsWith('p1,channel,ch-yol-andijon,8.0,v8,android,1970-01-01T00:00:01.000Z')).toBe(true);
    expect(errorsFile([{ entry: null, tg: null, platform: 'tdesktop', count: 2 }]).split('\n')[1]).toBe(
      'direct,,,none,tdesktop,2',
    );
  });
});
