import { LargeTitle, Text } from '@telegram-apps/telegram-ui';
import type { Welcome } from '../account/registration/registration-flow';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { Icon } from '../icons';
import { MainButton } from '../telegram/bottom-button';
import { useScreenBackground } from '../telegram/screen-background';

type WelcomeScreenProps = { readonly welcome: Welcome; readonly onContinue: () => void };

export function WelcomeScreen({ welcome, onContinue }: WelcomeScreenProps) {
  useScreenView('welcome');
  useScreenBackground('plain');
  const { t } = useI18n();
  const brand = useBrand();
  return (
    <div className="welcome">
      <IconTile name={welcome.icon} size="hero" />
      <LargeTitle weight="1" className="welcome-title">
        {brand.name}
      </LargeTitle>
      <Text weight="2" className="welcome-slogan">
        {brand.slogan}
      </Text>
      <Text className="welcome-text">{t(welcome.textKey, { brand: brand.name })}</Text>
      <ul className="welcome-points">
        {welcome.points.map((point) => (
          <li key={point.textKey}>
            <Icon name={point.icon} />
            <Text>{t(point.textKey)}</Text>
          </li>
        ))}
      </ul>
      <MainButton text={t('common.continue')} onClick={onContinue} />
    </div>
  );
}
