import type { LoopCard } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useState } from 'react';
import { currentScreen } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { Icon, type IconName } from '../icons';
import { errorKey } from '../market/error-text';
import { ActionFailure } from '../states/action-failure';
import { haptic } from '../telegram/feedback';
import { shareCard } from '../telegram/share-card';
import { useShareTrack } from './use-share-track';
import './loop-invite.css';

type Props = {
  readonly card: LoopCard;
  readonly icon: IconName;
  readonly title: string;
  readonly text: string;
  readonly button: string;
};

const ICON = 20;
const SEND = 18;

// A loop of growth on its screen (docs/123): why to share it, and the button that names to whom.
// The ready message goes from the person's app with the mark of the loop and their code.
export function LoopInvite({ card, icon, title, text, button }: Props) {
  const { t } = useI18n();
  const { growth } = useApiClients();
  const done = useShareTrack(card.loop, currentScreen());
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  const share = async () => {
    setFailure(null);
    try {
      const prepared = await growth.loopCard(card);
      if (await shareCard(prepared.prepared, prepared.link)) {
        done('chat');
        haptic.success();
      }
    } catch (caught) {
      setFailure(errorKey(caught));
    }
  };
  return (
    <div className="loop-invite">
      <div className="loop-invite-top">
        <span className="loop-invite-icon">
          <Icon name={icon} size={ICON} />
        </span>
        <span className="loop-invite-text">
          <b>{title}</b>
          <span>{text}</span>
        </span>
      </div>
      <ActionFailure error={failure} />
      <button type="button" className="loop-invite-button" onClick={() => void share()}>
        <Icon name="send" size={SEND} />
        <span>{button}</span>
      </button>
      <span className="loop-invite-safe">{t('growth.safe')}</span>
    </div>
  );
}
