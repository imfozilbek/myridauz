import type { SoundsState } from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { IconTile } from '../icon-tile';
import { useLoad } from '../market/use-list';
import { Screen } from '../screen/screen';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { unlockAudio } from './audio';
import { previewSound } from './brand-sound';
import '../market/market.css';

// «Ovozlar» in «Boshqaruv» (G54, docs/115): every set to listen to; the owner picks the one in use.
export function SoundsScreen({ onBack }: { readonly onBack: () => void }) {
  useScreenView('sounds');
  const { sounds } = useApiClients();
  const { value, failed, reload } = useLoad(() => sounds.state());
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  return <SoundSets loaded={value} onBack={onBack} />;
}

function SoundSets({ loaded, onBack }: { readonly loaded: SoundsState; readonly onBack: () => void }) {
  const { t } = useI18n();
  const { sounds } = useApiClients();
  const [state, setState] = useState(loaded);
  const [busy, setBusy] = useState(false);
  const listen = (set: string, kind: 'ring' | 'notify') => () => {
    // The tap itself opens the sound on iPhone.
    unlockAudio();
    void previewSound(set, kind, import.meta.env.BASE_URL);
  };
  const pick = (set: string) => async () => {
    setBusy(true);
    try {
      setState(await sounds.pick(set));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="market">
      <Screen onBack={onBack} />
      <Title weight="1" className="market-title">
        {t('common.admin.sounds')}
      </Title>
      <List>
        {state.sets.map((set) => {
          const chosen = set === state.set;
          const canPick = state.canEdit && !chosen && !busy;
          return (
            <Section key={set}>
              <Cell
                before={<IconTile name="sounds" />}
                after={chosen ? <Icon name="selected" /> : undefined}
                subtitle={chosen ? t('common.admin.soundChosen') : undefined}
                {...(canPick ? { onClick: pick(set) } : {})}
              >
                {t('common.admin.soundSet', { n: set })}
              </Cell>
              <Cell before={<Icon name="play" />} onClick={listen(set, 'ring')}>
                {t('common.admin.soundRing')}
              </Cell>
              <Cell before={<Icon name="play" />} onClick={listen(set, 'notify')}>
                {t('common.admin.soundNotify')}
              </Cell>
            </Section>
          );
        })}
      </List>
    </div>
  );
}
