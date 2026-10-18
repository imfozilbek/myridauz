import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Bindings } from '../../../env';
import { escapeHtml } from '../../../shared/telegram/html';
import { tellOwners } from '../../team-queue';
import { peopleOf } from '../../users';

const { t } = createI18n(DEFAULT_LOCALE);

// pair: talked about requests and never booked (docs/129 rule 5, G75); pairCancel: confirmed and
// cancelled seats again and again (G45, docs/83 N26).
type PairKind = 'pair' | 'pairCancel';
const TEXTS = { pair: 'bot.diqqat.pair', pairCancel: 'bot.diqqat.pairCancel' } as const;

// «🤝 Jasur va Dilnoza 3 marta gaplashdi, lekin bron qilmadi» in «Diqqat» of the owner: one line a pair
// a day. The team sees public ids, never Telegram IDs (docs/65 A3).
export async function tellPair(
  env: Bindings,
  kind: PairKind,
  driverId: number,
  passengerId: number,
  count: number,
) {
  const people = peopleOf(env);
  const [driver, passenger] = await Promise.all([people.find(driverId), people.find(passengerId)]);
  if (!driver || !passenger) return;
  const values = {
    driver: escapeHtml(driver.firstName),
    driverId: driver.publicId,
    passenger: escapeHtml(passenger.firstName),
    passengerId: passenger.publicId,
    count: String(count),
  };
  await tellOwners(env, {
    id: `${kind}:${driver.publicId}:${passenger.publicId}`,
    text: t(TEXTS[kind], values),
    ring: false,
    sign: { ...values, driver: driver.firstName, passenger: passenger.firstName, kind, count },
  });
}
