import { useState, type CSSProperties } from 'react';
import { useI18n } from '../context/i18n-context';
import { Icon, type IconName } from '../icons';
import { HomeCard } from './home-card';

const ICON = 22;

type Props = {
  readonly icon: IconName;
  // The color of the note: its words and its light background.
  readonly color: string;
  readonly title: string;
  readonly text: string;
  // A note for one visit has «Yopish»; a state that lasts (the check) has none.
  readonly closable?: boolean;
};

// A note of the main screen in the color of its meaning (the mockup of G53): the application
// being checked is amber, the approval is green.
export function HomeNote({ icon, color, title, text, closable = false }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <HomeCard className="home-note" style={{ '--note': color } as CSSProperties}>
      <Icon name={icon} size={ICON} color={color} />
      <span className="home-card-words">
        <span className="home-card-title">{title}</span>
        <span className="home-card-hint">{text}</span>
        {closable ? (
          <button type="button" className="home-note-close" onClick={() => setOpen(false)}>
            {t('common.close')}
          </button>
        ) : null}
      </span>
    </HomeCard>
  );
}
