import { LargeTitle } from '@telegram-apps/telegram-ui';
import { ProfileCell } from '../account/profile/profile-cell';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { LanguageSwitcher, useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { Icon } from '../icons';
import { usePlatform } from '../telegram/in-telegram-context';
import { useScreenBackground } from '../telegram/screen-background';
import type { StartAction } from './start-action';

type HomeScreenProps = {
  readonly actions: readonly StartAction[];
  readonly onOpen: (action: StartAction) => void;
  readonly onProfile: () => void;
};

// At most 3 actions (docs/19). A chevron only on iOS, like Telegram itself.
export function HomeScreen({ actions, onOpen, onProfile }: HomeScreenProps) {
  useScreenView('home');
  useScreenBackground('grouped');
  const { t } = useI18n();
  const brand = useBrand();
  const chevron =
    usePlatform() === 'ios' ? <Icon name="next" size={20} color={brand.theme.colors.textMuted} /> : null;
  return (
    <div className="home">
      <LargeTitle weight="1" className="home-title">
        {brand.name}
      </LargeTitle>
      <List>
        <ProfileCell onOpen={onProfile} />
        <Section>
          {actions.map((action) => (
            <Cell
              key={action.id}
              before={<IconTile name={action.icon} tone={action.tone} />}
              subtitle={t(action.hintKey)}
              after={chevron}
              onClick={() => onOpen(action)}
            >
              {t(action.labelKey)}
            </Cell>
          ))}
        </Section>
        <LanguageSwitcher />
      </List>
    </div>
  );
}
