import type { SoundsState } from '@platform/contracts';
import { useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManagePage, ManageRow } from '../manage/manage-page';
import { useLoad } from '../market/use-list';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { unlockAudio } from './audio';
import { previewSound } from './brand-sound';

// «Ovozlar» in «Boshqaruv» (G54, docs/115, G78 sheet 5): each set its own card to listen to, the one
// in use marked green; the owner picks it by its first row.
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
    <ManagePage title={t('common.admin.sounds')} onBack={onBack}>
      {state.sets.map((set) => {
        const chosen = set === state.set;
        const canPick = !chosen && !busy;
        return (
          <ManageGroup key={set}>
            <ManageRow
              icon={chosen ? 'selected' : 'sounds'}
              {...(chosen ? { tone: 'success' as const } : {})}
              title={t('common.admin.soundSet', { n: set })}
              {...(chosen ? { hint: t('common.admin.soundChosen') } : {})}
              arrow={false}
              {...(canPick ? { onClick: pick(set) } : {})}
            />
            <ManageRow
              icon="play"
              title={t('common.admin.soundRing')}
              arrow={false}
              onClick={listen(set, 'ring')}
            />
            <ManageRow
              icon="play"
              title={t('common.admin.soundNotify')}
              arrow={false}
              onClick={listen(set, 'notify')}
            />
          </ManageGroup>
        );
      })}
    </ManagePage>
  );
}
