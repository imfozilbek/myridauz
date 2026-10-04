import { describe, expect, it } from 'vitest';
import { crashFacts } from './crash-facts';

describe('crashFacts (G52, docs/112)', () => {
  it('keeps the class and the words of an error, without numbers and signs', () => {
    const error = new TypeError("Cannot read properties of undefined (reading 'lat') at 12:34 +998901234567");
    expect(crashFacts(error)).toEqual({
      error: 'TypeError',
      detail: "Cannot read properties of undefined (reading 'lat') at #:# #",
    });
  });

  it('drops letters of other alphabets and cuts a long message', () => {
    expect(crashFacts(new Error('Алишер не найден')).detail).toBe('');
    expect(crashFacts(new Error('a'.repeat(300))).detail).toHaveLength(120);
  });

  it('names a thrown value that is not an Error', () => {
    expect(crashFacts('ui.analytics_missing')).toEqual({ error: 'Thrown', detail: 'ui.analytics_missing' });
    expect(crashFacts(undefined)).toEqual({ error: 'Thrown', detail: 'undefined' });
  });
});
