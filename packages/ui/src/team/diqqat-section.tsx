import type { Attention, AttentionSign } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import type { HomeGo, Launch, PersonName } from '../flow/start-action';
import { Icon, type IconName } from '../icons';
import { haptic } from '../telegram/feedback';
import { TeamSection } from './team-section';
import { NAVBAT_SECTION, PEOPLE_SECTION, STATS_SECTION, WALLETS_SECTION } from './team-sections';

const ICON = 20;
type Kind = AttentionSign['kind'];
type Card = {
  readonly icon: IconName;
  // A fault of Rida is red, a thing about people is amber (mockup g67/1).
  readonly fault: boolean;
  readonly titleKey: TranslationKey;
  readonly hintKey?: TranslationKey;
  readonly opens: string;
};
// The order of the cards: what breaks Rida first, then the work, then people.
const CARDS: Record<Kind, Card> = {
  errors: {
    icon: 'error',
    fault: true,
    titleKey: 'team.diqqat.errors',
    hintKey: 'team.diqqat.errorsLink',
    opens: STATS_SECTION,
  },
  drop: {
    icon: 'statistics',
    fault: true,
    titleKey: 'team.diqqat.drop',
    hintKey: 'team.diqqat.dropLink',
    opens: STATS_SECTION,
  },
  late: { icon: 'waiting', fault: true, titleKey: 'team.diqqat.late', opens: NAVBAT_SECTION },
  contact: {
    icon: 'chat',
    fault: false,
    titleKey: 'team.diqqat.contact',
    hintKey: 'team.diqqat.peopleLink',
    opens: PEOPLE_SECTION,
  },
  money: {
    icon: 'price',
    fault: false,
    titleKey: 'team.diqqat.money',
    hintKey: 'team.diqqat.moneyHint',
    opens: WALLETS_SECTION,
  },
  rating: {
    icon: 'star',
    fault: false,
    titleKey: 'team.diqqat.rating',
    hintKey: 'team.diqqat.peopleLink',
    opens: PEOPLE_SECTION,
  },
  pair: {
    icon: 'passengers',
    fault: false,
    titleKey: 'team.diqqat.pair',
    hintKey: 'team.diqqat.peopleLink',
    opens: PEOPLE_SECTION,
  },
  pairCancel: {
    icon: 'passengers',
    fault: false,
    titleKey: 'team.diqqat.pairCancel',
    hintKey: 'team.diqqat.peopleLink',
    opens: PEOPLE_SECTION,
  },
};
const KINDS = Object.keys(CARDS) as Kind[];

// The person a sign is about: one sign of a kind opens that person in «Odamlar» (G75), signs of many
// open the list of them there (G79 К3).
function personOf(sign: AttentionSign): PersonName | undefined {
  if (sign.kind === 'contact' || sign.kind === 'rating' || sign.kind === 'money')
    return { id: sign.person, name: sign.name };
  return sign.kind === 'pair' || sign.kind === 'pairCancel'
    ? { id: sign.driverId, name: sign.driver }
    : undefined;
}

// One person: that person; more: the list of them; none: «Odamlar» as it is.
const whom = ([first, ...more]: readonly PersonName[]): Launch | undefined =>
  !first ? undefined : more.length === 0 ? { person: first.id } : { people: [first, ...more] };

type SectionProps = { readonly attention: Attention; readonly go: HomeGo };

// «Diqqat» of the owner (docs/120, docs/122): the signs of the day, one card for each kind with how
// many there are and where to look. Nothing to look at: no section at all.
export function DiqqatSection({ attention, go }: SectionProps) {
  const { t } = useI18n();
  const brand = useBrand();
  const { colors } = brand.theme;
  const counted = KINDS.map((kind) => {
    const signs = attention.signs.filter(({ sign }) => sign.kind === kind);
    const named = signs.flatMap(({ sign }) => personOf(sign) ?? []);
    const people = named.filter((one, at) => named.findIndex((other) => other.id === one.id) === at);
    return { kind, count: signs.length, people };
  }).filter(({ count }) => count > 0);
  if (counted.length === 0) return null;
  return (
    <TeamSection title={t('team.section.diqqat')}>
      {counted.map(({ kind, count, people }) => {
        const card = CARDS[kind];
        return (
          <button
            key={kind}
            type="button"
            className="team-card diqqat-card"
            onClick={() => {
              haptic.tap();
              go(card.opens, card.opens === PEOPLE_SECTION ? whom(people) : undefined);
            }}
          >
            <Icon name={card.icon} size={ICON} color={card.fault ? colors.danger : colors.attention} />
            <span className="navbat-words">
              <span className="diqqat-title">{t(card.titleKey, { count })}</span>
              {card.hintKey ? (
                <span className="diqqat-hint">{t(card.hintKey, { seats: brand.wallet.fewSeats })}</span>
              ) : null}
            </span>
          </button>
        );
      })}
    </TeamSection>
  );
}
