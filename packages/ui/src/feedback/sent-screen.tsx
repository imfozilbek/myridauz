import type { ReactNode } from 'react';
import { useI18n } from '../context/i18n-context';
import { useGoHome } from '../flow/home-context';
import type { IconName } from '../icons';
import { Screen } from '../screen/screen';
import { EmptyState } from '../states/empty-state';
import { MainButton } from '../telegram/bottom-button';
import '../market/market.css';

type Props = {
  readonly icon: IconName;
  readonly title: string;
  readonly description: string;
  readonly onBack: () => void;
  // Opened from the bot: «Yopish» closes the Mini App, the person is back in the chat (docs/94 C1).
  readonly onClose?: (() => void) | undefined;
  readonly children?: ReactNode;
};

// A review or a complaint is sent: what happens next, and the way out; «Назад» to the main screen (docs/103).
export function SentScreen({ icon, title, description, onBack, onClose, children }: Props) {
  const { t } = useI18n();
  const home = useGoHome(onBack);
  return (
    <div className="market">
      <Screen onBack={home} />
      <EmptyState icon={icon} title={title} description={description} />
      {children}
      {onClose ? <MainButton text={t('common.close')} onClick={onClose} /> : null}
    </div>
  );
}
