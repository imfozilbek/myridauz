import type { Page } from '@playwright/test';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { tashkent } from './g63-after-mock';
import { mapState, mockMap } from './map-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

// «Profil» of the mockup g65/3, one to one (lesson 151): Murod the driver and Madina the passenger,
// two months with the brand on 7 October, the numbers of the mockup, the phone only they see.
const [PASSENGER, DRIVER] = MINI_APPS;
export type Role = 'driver' | 'passenger';
const PEOPLE = {
  driver: { firstName: 'Murod', gender: 'male', rating: { average: 4.9, count: 23 }, onTime: 96, trips: 41 },
  passenger: {
    firstName: 'Madina',
    gender: 'female',
    rating: { average: 4.9, count: 8 },
    onTime: 100,
    trips: 12,
  },
} as const;

export type Membership = { readonly username: string; readonly member: boolean };

// `more` mocks what a screen opened from «Profil» reads, over the mocks of the whole app.
export async function openMockupProfile(
  page: Page,
  role: Role,
  channels: readonly Membership[] = [],
  more: () => Promise<void> = async () => undefined,
) {
  await mockApi(page, 'active');
  await mockMap(page, mapState());
  const { firstName, gender, rating, onTime, trips } = PEOPLE[role];
  const profile = {
    id: '00000000000000000000000000000001',
    firstName,
    gender,
    phone: '+998901110112',
    roles: [role],
    hasAvatar: true,
    writeAccess: true,
    joinedAt: tashkent('2026-08-01T10:00'),
    rating: rating.average,
    avatarStatus: 'approved',
    avatarReason: null,
  };
  await page.route('**/api/me', (route) =>
    route.request().method() === 'GET'
      ? route.fulfill({ json: { state: 'active', profile } })
      : route.fallback(),
  );
  await page.route(`**/api/${role}/standing`, (route) => route.fulfill({ json: { rating, onTime, trips } }));
  await page.route('**/api/me/channels', (route) => route.fulfill({ json: { channels } }));
  await more();
  await page.clock.setFixedTime(tashkent('2026-10-07T15:00'));
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl((role === 'driver' ? DRIVER : PASSENGER).port)));
  await page.getByLabel(TEXT.profile).click();
}
