import type { TranslationKey } from '@platform/i18n';
import { Placeholder } from '@telegram-apps/telegram-ui';
import { useCallback, useState } from 'react';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { LanguageSwitcher, useI18n } from '../context/i18n-context';
import { EmptyState } from '../states/empty-state';
import { BackButton } from '../telegram/back-button';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { Icon, type IconName } from '../icons';

export type StartAction = { readonly id: string; readonly icon: IconName; readonly labelKey: TranslationKey };

type StartFlowProps = {
  readonly welcomeIcon: IconName;
  readonly welcome: TranslationKey;
  readonly actions: readonly StartAction[];
};

const WELCOME_ICON_SIZE = 72;

function Welcome({
  icon,
  text,
  onContinue,
}: {
  icon: IconName;
  text: TranslationKey;
  onContinue: () => void;
}) {
  useScreenView('welcome');
  const { t } = useI18n();
  const brand = useBrand();
  const description = (
    <>
      {brand.slogan}
      <br />
      {t(text, { brand: brand.name })}
    </>
  );
  return (
    <>
      <Placeholder header={brand.name} description={description}>
        <Icon name={icon} size={WELCOME_ICON_SIZE} color={brand.theme.colors.brand} />
      </Placeholder>
      <MainButton text={t('common.continue')} onClick={onContinue} />
    </>
  );
}

function Home({
  actions,
  onOpen,
}: {
  actions: readonly StartAction[];
  onOpen: (action: StartAction) => void;
}) {
  useScreenView('home');
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  return (
    <List>
      <Section>
        {actions.map((action) => (
          <Cell
            key={action.id}
            before={<Icon name={action.icon} color={colors.brand} />}
            onClick={() => onOpen(action)}
          >
            {t(action.labelKey)}
          </Cell>
        ))}
      </Section>
      <LanguageSwitcher />
    </List>
  );
}

function Soon({ action, onBack }: { action: StartAction; onBack: () => void }) {
  useScreenView(action.id);
  const { t } = useI18n();
  return (
    <>
      <BackButton onClick={onBack} />
      <EmptyState icon={action.icon} title={t(action.labelKey)} description={t('common.soon')} />
    </>
  );
}

// Welcome → main screen with at most 3 actions (docs/19) → a section. Sections arrive in later goals.
export function StartFlow({ welcomeIcon, welcome, actions }: StartFlowProps) {
  const [screen, setScreen] = useState<'welcome' | 'home' | StartAction>('welcome');
  const openHome = useCallback(() => setScreen('home'), []);
  const openAction = useCallback((action: StartAction) => {
    haptic.tap();
    setScreen(action);
  }, []);
  if (screen === 'welcome') return <Welcome icon={welcomeIcon} text={welcome} onContinue={openHome} />;
  if (screen === 'home') return <Home actions={actions} onOpen={openAction} />;
  return <Soon action={screen} onBack={openHome} />;
}
