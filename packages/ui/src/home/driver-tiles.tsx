import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { HomeTile } from '../flow/home-tile';
import { openInTelegram } from '../telegram/feedback';
import { useHomeTap } from './use-home-tap';

// The last tile of a driver (G62, mockup g62/1 screens 1, 4 and 6): «Yordam», the support bot, on
// the check and after it. «Hamyon» lives in the profile.
export function DriverTiles() {
  const { t } = useI18n();
  const { bots } = useBrand();
  const tap = useHomeTap();
  return (
    <HomeTile
      icon="chat"
      tone="deep"
      title={t('home.support')}
      hint={t('home.supportHint')}
      onClick={tap('support', () => openInTelegram(`https://t.me/${bots.support}`))}
    />
  );
}
