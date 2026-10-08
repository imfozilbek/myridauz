import { describe, expect, it, vi } from 'vitest';
import { akmal, madina } from '../meeting/meet-test-kit';
import { pickRider } from './pick-rider';

const show = vi.hoisted(() => vi.fn());
vi.mock('@telegram-apps/sdk-react', () => ({ popup: { show: { ifAvailable: show } } }));

const rider = (n: number) => ({ ...madina, id: `r${n}` });

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
    show.mockReturnValueOnce([true, Promise.resolve('')]);
    await expect(pickRider([madina, akmal], 'Qaysi?')).resolves.toBeNull();
  });

  it('is chosen on the list screen with more people than the window holds, or outside Telegram', async () => {
    show.mockClear();
    await expect(pickRider([1, 2, 3, 4].map(rider), 'Qaysi?')).resolves.toBe('list');
    expect(show).not.toHaveBeenCalled();
    show.mockReturnValueOnce([false, undefined]);
    await expect(pickRider([madina, akmal], 'Qaysi?')).resolves.toBe('list');
  });
});
