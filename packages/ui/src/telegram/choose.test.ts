import { describe, expect, it, vi } from 'vitest';
import { choose } from './feedback';

const show = vi.hoisted(() => vi.fn());
vi.mock('@telegram-apps/sdk-react', () => ({ popup: { show: { ifAvailable: show } } }));

describe('a choice in the native Telegram window (G24)', () => {
  it('gives the chosen id, null when closed, and nothing outside Telegram', async () => {
    const options = [{ id: 'yandex', text: 'Yandex' }];
    show.mockReturnValueOnce([true, Promise.resolve('yandex')]);
    await expect(choose('Qaysi?', options)).resolves.toBe('yandex');
    show.mockReturnValueOnce([true, Promise.resolve('')]);
    await expect(choose('Qaysi?', options)).resolves.toBeNull();
    show.mockReturnValueOnce([false, undefined]);
    await expect(choose('Qaysi?', options)).resolves.toBeUndefined();
    expect(show).toHaveBeenCalledWith({
      message: 'Qaysi?',
      buttons: [{ id: 'yandex', type: 'default', text: 'Yandex' }],
    });
  });
});
