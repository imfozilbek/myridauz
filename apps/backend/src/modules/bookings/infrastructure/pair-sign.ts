import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Bindings } from '../../../env';
import { escapeHtml } from '../../../shared/telegram/html';
import { tellOwners } from '../../team-queue';
import { peopleOf } from '../../users';

const { t } = createI18n(DEFAULT_LOCALE);

// «🤝 Jasur va Dilnoza 3 marta gaplashdi, lekin bron qilmadi» in «Diqqat» of the owner (docs/129
// rule 5, G75): one line a pair a day. The team sees public ids, never Telegram IDs (docs/65 A3).
export async function tellPairTalked(env: Bindings, driverId: number, passengerId: number, talks: number) {
  const people = peopleOf(env);
  const [driver, passenger] = await Promise.all([people.find(driverId), people.find(passengerId)]);
  if (!driver || !passenger) return;
  const values = {
    driver: escapeHtml(driver.firstName),
    driverId: driver.publicId,
    passenger: escapeHtml(passenger.firstName),
    passengerId: passenger.publicId,
    count: String(talks),
  };
  await tellOwners(env, {
    id: `pair:${driver.publicId}:${passenger.publicId}`,
    text: t('bot.diqqat.pair', values),
    ring: false,
    sign: { ...values, driver: driver.firstName, passenger: passenger.firstName, kind: 'pair', count: talks },
  });
}
