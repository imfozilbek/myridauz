import { expect, test } from '../crash-guard';
import { createModerationClient } from '@platform/api-client';
import { TEXT } from '../apps';
import { passConsent } from '../registration';
import { pressBack } from '../telegram-mock';
import { OWNER } from './people';
import { mainButton, NARROW, openHome, shot, t } from './screen-tour';
import { apply } from './seed';
import { outsideCalls, openAs, signedAs, type Person } from './stand-kit';

// The forms of the first visit and the link of the admin bot (docs/77 P02, P04, docs/79 T17):
// a document read before the consent, a name that is not a name, one application opened by a link.
test.use({ viewport: NARROW });
test.describe.configure({ mode: 'serial' });
test.afterEach(() => expect(outsideCalls()).toEqual([]));
const NEWCOMER: Person = { id: 900609, name: 'Kumush', phone: '998901110609' };

test('P02, P04. a document opens before the consent and comes back; a name of signs is refused', async ({
  page,
}) => {
  await openHome(page, 'passenger', NEWCOMER, 'android');
  // G34: the documents open from the consent line of the welcome.
  await page.getByText(TEXT.offerLink).click();
  await expect(page.getByText(t('legal.offer.title')).first()).toBeVisible();
  await shot(page, 'android', 'p04-document');
  await pressBack(page);
  await expect(page.getByText(TEXT.offerLink)).toBeVisible();
  await passConsent(page);
  await page.getByRole('textbox').fill('😀');
  // A name that is not a name is said at once; the phone is not asked until it is fixed.
  await expect(page.getByText(t('account.name.invalid'))).toBeVisible();
  await page.getByRole('radio', { name: TEXT.female }).click();
  await expect(mainButton(page)).toBeHidden();
  await shot(page, 'android', 'p05-name-invalid');
});

test('T17. «?application=» from the admin bot opens that application', async ({ page }) => {
  const applicant: Person = { id: 900608, name: 'Laziz', phone: '998901110608' };
  await apply(applicant, '01S678TU', 'male');
  const queue = await createModerationClient(await signedAs('admin', OWNER)).queue();
  const id = queue.find((a) => a.firstName === applicant.name)?.userId ?? '';
  await openAs(page, 'admin', OWNER, { search: `?application=${id}` });
  await expect(mainButton(page)).toHaveText(TEXT.approve);
  await expect(page.getByText(applicant.name).first()).toBeVisible();
});
