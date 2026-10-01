import { describe, expect, it } from 'vitest';
import { closeCodeFor } from './close-code';

describe('closeCodeFor', () => {
  it('echoes a code the server may send', () => {
    expect(closeCodeFor(1000)).toBe(1000);
    expect(closeCodeFor(4001)).toBe(4001);
  });

  it('answers 1000 to a code that only describes a lost connection', () => {
    // A phone that lost the network: no status (1005), an abnormal end (1006), a broken TLS (1015).
    expect(closeCodeFor(1005)).toBe(1000);
    expect(closeCodeFor(1006)).toBe(1000);
    expect(closeCodeFor(1015)).toBe(1000);
    expect(closeCodeFor(1001)).toBe(1000);
  });
});
