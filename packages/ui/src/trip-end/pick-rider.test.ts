import { describe, expect, it, vi } from 'vitest';
import { akmal, madina } from '../meeting/meet-test-kit';
import { pickRider } from './pick-rider';

const show = vi.hoisted(() => vi.fn());
vi.mock('@telegram-apps/sdk-react', () => ({ popup: { show: { ifAvailable: show } } }));

describe('the passenger of a row of «Safardan keyin» (docs/129)', () => {
  it('is the only one, or the one chosen in the window of Telegram', async () => {
    await expect(pickRider([madina], 'Qaysi?')).resolves.toBe(madina);
    await expect(pickRider([], 'Qaysi?')).resolves.toBeNull();
    show.mockReturnValueOnce([true, Promise.resolve('a1')]);
    await expect(pickRider([madina, akmal], 'Qaysi?')).resolves.toBe(akmal);
    expect(show).toHaveBeenCalledWith({
      message: 'Qaysi?',
      buttons: [
        { id: 'm1', type: 'default', text: 'Madina' },
        { id: 'a1', type: 'default', text: 'Akmal' },
      ],
    });
    show.mockReturnValueOnce([false, undefined]);
    await expect(pickRider([madina, akmal], 'Qaysi?')).resolves.toBeNull();
  });
});
