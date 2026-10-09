import type { Attention, AttentionSign } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import type { HomeGo } from '../flow/start-action';
import { Icon, type IconName } from '../icons';
import { haptic } from '../telegram/feedback';
import { TeamSection } from './team-section';
import { MANAGEMENT_SECTION, NAVBAT_SECTION, PEOPLE_SECTION, STATS_SECTION } from './team-sections';

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
    opens: MANAGEMENT_SECTION,
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
};
const KINDS = Object.keys(CARDS) as Kind[];

type SectionProps = { readonly attention: Attention; readonly go: HomeGo };

// «Diqqat» of the owner (docs/120, docs/122): the signs of the day, one card for each kind with how
// many there are and where to look. Nothing to look at: no section at all.
export function DiqqatSection({ attention, go }: SectionProps) {
  const { t } = useI18n();
  const brand = useBrand();
  const { colors } = brand.theme;
  const counted = KINDS.map((kind) => ({
    kind,
    count: attention.signs.filter(({ sign }) => sign.kind === kind).length,
  })).filter(({ count }) => count > 0);
  if (counted.length === 0) return null;
  return (
    <TeamSection title={t('team.section.diqqat')}>
      {counted.map(({ kind, count }) => {
        const card = CARDS[kind];
        return (
          <button
            key={kind}
            type="button"
            className="team-card diqqat-card"
            onClick={() => {
              haptic.tap();
              go(card.opens);
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
