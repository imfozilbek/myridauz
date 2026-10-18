import { createChatClient, createModerationClient } from '@platform/api-client';
import type { PersonId } from '@platform/contracts';
import { expect, test } from '../crash-guard';
import { TEXT } from '../apps';
import { press } from './bot-kit';
import { confirmedSeat } from './g27-kit';
import { OWNER } from './people';
import { t } from './screen-tour';
import { approvedDriver, PHOTO, register } from './seed';
import { openAs, signedAs, type Person } from './stand-kit';
import { standRows } from './stand-tools';

// G49 (docs/77 P07, P08, docs/79 T65, docs/80 S75): the account of a passenger on the whole local Rida.
test.describe.configure({ mode: 'serial' });
const SABINA: Person = { id: 900904, name: 'Sabina', phone: '998901110904' };
const NILUFAR: Person = { id: 900903, name: 'Nilufar', phone: '998901110903' };
const BAHROM: Person = { id: 900906, name: 'Bahrom', phone: '998901110906' };
const ZUHRA: Person = { id: 900905, name: 'Zuhra', phone: '998901110905' };
// A close one of Zuhra with Telegram but without Rida.
const KAMOL: Person = { id: 900907, name: 'Kamol', phone: '998901110907' };

// The card of a person as another person sees it (GET /users/:id): with a photo or without.
async function photoShownTo(viewer: Person, person: PersonId): Promise<boolean> {
  const { baseUrl, initData } = await signedAs('passenger', viewer);
  const headers = { authorization: `tma ${initData}`, 'x-mini-app': 'passenger' };
  const response = await fetch(`${baseUrl}/users/${person}`, { headers });
  return ((await response.json()) as { hasAvatar: boolean }).hasAvatar;
}

test('P07. «Bot xabarlari» in «Profil» is always on: shown, never switched off', async ({ page }) => {
  await register('passenger', SABINA, 'female');
  await openAs(page, 'passenger', SABINA);
  await page.getByLabel(t('account.profile.open')).click();
  const bot = page.getByLabel(t('account.profile.bot'));
  await expect(bot).toBeChecked();
  await expect(bot).toBeDisabled();
});

test('P08, T65. a new face photo waits for «Rasm mos» of the team; until then only its owner sees it', async () => {
  const users = await register('passenger', NILUFAR, 'female');
  const me = await users.getMe();
  const id = me.state === 'active' ? me.profile.id : '';
  const moderation = createModerationClient(await signedAs('admin', OWNER));
  const approve = async () => {
    if ((await moderation.faces()).some((face) => face.userId === id))
      await moderation.decideFace(id, { action: 'approve' });
  };
  await approve();
  expect(await photoShownTo(SABINA, id)).toBe(true);
  await users.uploadAvatar(PHOTO);
  const after = await users.getMe();
  expect(after.state === 'active' ? after.profile.avatarStatus : null).toBe('pending');
  expect(await photoShownTo(SABINA, id)).toBe(false);
  // «Rasm mos» under the card of the photo in the admin bot (G58, G68): one tap of the team.
  const [row] = standRows(`SELECT avatar_at FROM users WHERE id = ${NILUFAR.id}`);
  await press('admin', OWNER, `face:${NILUFAR.id}:${Number(row?.['avatar_at']).toString(36)}:ok`);
  await expect.poll(() => photoShownTo(SABINA, id)).toBe(true);
});

test('S75. «Men ham yoʻlga chiqaman» on the card of a close one leads into the registration', async ({
  page,
}) => {
  await approvedDriver(BAHROM, '01G906BH');
  await register('passenger', ZUHRA, 'female');
  const { seat } = await confirmedSeat(BAHROM, ZUHRA);
  const { link } = await createChatClient(await signedAs('passenger', ZUHRA)).share(seat.id);
  const token = link.split('follow_')[1] ?? '';
  await openAs(page, 'passenger', KAMOL, { search: `?follow=${token}` });
  await expect(page.getByText(new RegExp(`^${ZUHRA.name}ning safari`, 'u'))).toBeVisible();
  await page.getByText(t('share.follow.join')).click();
  await expect(page.getByText(TEXT.offerLink)).toBeVisible();
});
