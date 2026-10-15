import { describe, expect, it } from 'vitest';
import { answerBackFromTabs } from './android-tabs';

describe('answerBackFromTabs (lesson 283)', () => {
  it('lets the call of Telegram for Android pass when the app comes back from the tabs', () => {
    const host: { __tg__postBackgroundChange?: () => void } = {};
    answerBackFromTabs(host);
    expect(() => host.__tg__postBackgroundChange?.()).not.toThrow();
    expect(host.__tg__postBackgroundChange).toBeTypeOf('function');
  });

  it('keeps a function Telegram already has', () => {
    const own = () => undefined;
    const host = { __tg__postBackgroundChange: own };
    answerBackFromTabs(host);
    expect(host.__tg__postBackgroundChange).toBe(own);
  });
});
