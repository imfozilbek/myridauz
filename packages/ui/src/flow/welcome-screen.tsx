import type { TranslationKey } from '@platform/i18n';
import { LargeTitle, Text } from '@telegram-apps/telegram-ui';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import type { IconName } from '../icons';
import { MainButton } from '../telegram/bottom-button';
import { useScreenBackground } from '../telegram/screen-background';

type WelcomeScreenProps = {
  readonly icon: IconName;
  readonly textKey: TranslationKey;
  readonly onContinue: () => void;
};

export function WelcomeScreen({ icon, textKey, onContinue }: WelcomeScreenProps) {
  useScreenView('welcome');
  useScreenBackground('plain');
  const { t } = useI18n();
  const brand = useBrand();
  return (
    <div className="welcome">
      <IconTile name={icon} size="hero" />
      <LargeTitle weight="1" className="welcome-title">
        {brand.name}
      </LargeTitle>
      <Text weight="2" className="welcome-slogan">
        {brand.slogan}
      </Text>
      <Text className="welcome-text">{t(textKey, { brand: brand.name })}</Text>
      <MainButton text={t('common.continue')} onClick={onContinue} />
    </div>
  );
}
