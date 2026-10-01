import type { ReactNode } from 'react';
import { ProfileCell } from '../account/profile/profile-cell';
import { useChevron } from '../chevron';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { LanguageSwitcher, useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { useScreenBackground } from '../telegram/screen-background';
import type { StartAction } from './start-action';

type HomeScreenProps = {
  readonly actions: readonly StartAction[];
  readonly notice?: ReactNode;
  readonly top?: ReactNode;
  readonly onOpen: (action: StartAction) => void;
  readonly onProfile: () => void;
};

// At most 3 actions (docs/19). No big title: the Telegram header already names the app
// (owner decision 01.10.2026), so the profile and the trips come first.
export function HomeScreen({ actions, notice, top, onOpen, onProfile }: HomeScreenProps) {
  useScreenView('home');
  useScreenBackground('grouped');
  const { t } = useI18n();
  const chevron = useChevron();
  return (
    <div className="home">
      <List>
        <ProfileCell onOpen={onProfile} />
        {notice}
        {top}
        <Section>
          {actions.map((action) => (
            <Cell
              key={action.id}
              before={<IconTile name={action.icon} tone={action.tone} />}
              subtitle={t(action.hintKey)}
              after={chevron()}
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
