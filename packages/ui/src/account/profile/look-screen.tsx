import type { Standing } from '@platform/contracts';
import { useScreenView } from '../../context/analytics-context';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { useDriver } from '../../driver/driver-context';
import { Icon } from '../../icons';
import { Screen } from '../../screen/screen';
import { useScreenBackground } from '../../telegram/screen-background';
import { brandVars } from '../../theme/brand-vars';
import { useAccount } from '../account-context';
import { LookCard } from './look-card';
import './look-screen.css';

const CHEVRON = 18;

type Props = {
  readonly standing: Standing | null;
  readonly onReviews: () => void;
  readonly onBack: () => void;
};

// «Yoʻlovchilar meni qanday koʻradi» (G75, mockup g75/5 A): the card the other side sees with its
// three numbers, «Baholarim» under it; the phone stays hidden from everyone (docs/07).
export function LookScreen({ standing, onReviews, onBack }: Props) {
  useScreenView('profile.look');
  useScreenBackground();
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const account = useAccount();
  const driver = useDriver();
  if (!account) return null;
  return (
    <div className="look" style={brandVars(colors)}>
      <Screen onBack={onBack} />
      <h1 className="look-title">
        {t(driver ? 'account.profile.lookTitle.driver' : 'account.profile.lookTitle.passenger')}
      </h1>
      <LookCard standing={standing} />
      <button type="button" className="look-reviews" onClick={onReviews}>
        <span className="look-reviews-text">
          {t('account.profile.reviews')}
          <small>{t('account.profile.reviewsCount', { count: String(standing?.rating.count ?? 0) })}</small>
        </span>
        <Icon name="next" size={CHEVRON} />
      </button>
      <p className="look-note">{t('account.profile.lookPhone')}</p>
    </div>
  );
}
