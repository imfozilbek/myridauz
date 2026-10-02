import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readStored, syncFromCloud, writeStored } from './device-storage';

const cloud = vi.hoisted(() => new Map<string, string>());
const sdk = vi.hoisted(() => ({
  cloudStorage: {
    getItem: { ifAvailable: vi.fn((key: string) => [true, Promise.resolve(cloud.get(key) ?? '')]) },
    setItem: {
      ifAvailable: vi.fn((key: string, value: string) => {
        cloud.set(key, value);
        return [true, Promise.resolve()];
      }),
    },
  },
}));
vi.mock('@telegram-apps/sdk-react', () => sdk);

beforeEach(() => {
  cloud.clear();
  localStorage.clear();
});

describe('device storage: Telegram CloudStorage with a copy on the phone (docs/88 L12)', () => {
  it('writes to the phone and to the cloud, reads the phone at once', () => {
    writeStored('way_navigator', 'yandex');
    expect(readStored('way_navigator')).toBe('yandex');
    expect(cloud.get('way_navigator')).toBe('yandex');
  });

  it('takes the value of another phone from the cloud', async () => {
    cloud.set('way_navigator', 'google');
    await syncFromCloud();
    expect(readStored('way_navigator')).toBe('google');
  });

  it('moves an old value of this phone to the new key and to the cloud, losing nothing', async () => {
    localStorage.setItem('way.recent', '[1]');
    await syncFromCloud();
    expect(readStored('way_recent')).toBe('[1]');
    expect(cloud.get('way_recent')).toBe('[1]');
    expect(localStorage.getItem('way.recent')).toBeNull();
  });
});
