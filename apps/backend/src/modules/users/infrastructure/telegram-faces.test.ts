import { loadBrand } from '@platform/brands';
import { describe, expect, it, vi } from 'vitest';
import type { NotificationJob } from '../../notifications';
import type { User } from '../domain/user';
import { telegramFaces } from './telegram-faces';

// A refused face is told in the bot of the person's role (G58): a driver may never have opened the
// passenger bot.
function notifier() {
  const sent: NotificationJob[] = [];
  const faces = telegramFaces({
    fetch: vi.fn(),
    brand: loadBrand(),
    adminToken: undefined,
    recipients: async () => [],
    avatars: { get: async () => undefined, put: async () => undefined, delete: async () => undefined },
    send: async (jobs) => void sent.push(...jobs),
  });
  return { faces, sent };
}
const person = (isDriver: boolean) => ({ id: 7, isDriver }) as User;

describe('telegramFaces.rejected (G58)', () => {
  it('tells a passenger in the passenger bot and a driver in the driver bot', async () => {
    const { faces, sent } = notifier();
    await faces.rejected(person(false), 'face_not_visible');
    await faces.rejected(person(true), 'not_one_person');
    expect(sent.map((job) => job.bot)).toEqual(['passenger', 'driver']);
    expect(JSON.stringify(sent[1])).toContain('?profile=photo');
  });
});
