import { useI18n } from '../../context/i18n-context';
import { Icon } from '../../icons';
import type { Cue } from './cues';

const ARROW = 14;

// «Hozir: …» on the top edge of the block (G76, mockups g76/2, g76/3): half over it, pointing down.
// A new number of calls swings it 3 times; then it stands still.
export function DockCue({ cue, calls }: { readonly cue: Cue; readonly calls: number }) {
  const { t } = useI18n();
  return (
    <div key={calls} className={`dock-cue dock-cue-${cue.tone}`} data-swing={calls > 0 || undefined}>
      {t(`home.cue.${cue.key}`)}
      <Icon name="cue" size={ARROW} />
    </div>
  );
}
