import { beforeEach, describe, expect, it, vi } from 'vitest';
import { haptic } from './feedback';

const sdk = vi.hoisted(() => ({ hapticFeedback: { selectionChanged: { ifAvailable: vi.fn() } } }));
vi.mock('@telegram-apps/sdk-react', () => sdk);

beforeEach(() => vi.clearAllMocks());

describe('haptic (docs/88 L3)', () => {
  it('ticks softly when a choice changes, like Telegram lists', () => {
    haptic.select();
    expect(sdk.hapticFeedback.selectionChanged.ifAvailable).toHaveBeenCalledOnce();
  });
});
