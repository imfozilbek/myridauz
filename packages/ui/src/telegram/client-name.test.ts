import { describe, expect, it } from 'vitest';
import { clientOf } from './client-name';

const ANDROID =
  'Mozilla/5.0 (Linux; Android 10; K; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/83.0.4103.106 Mobile Safari/537.36';
const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

describe('clientOf', () => {
  it('says the app, its version and the major version of the engine (G52)', () => {
    expect(clientOf('android', '9.6', ANDROID)).toBe('android 9.6 chrome 83');
    expect(clientOf('ios', '9.6', IPHONE)).toBe('ios 9.6 safari 17');
  });

  it('keeps only letters and digits, and nothing of an unknown engine', () => {
    expect(clientOf('Web-K!', '7.10b', 'Unknown/1')).toBe('webk 7.10');
    expect(clientOf('', '', '')).toBe('unknown 0');
  });
});
