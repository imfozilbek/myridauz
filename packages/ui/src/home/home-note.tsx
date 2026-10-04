import { useState, type CSSProperties } from 'react';
import { useI18n } from '../context/i18n-context';
import { Icon, type IconName } from '../icons';
import './home-note.css';

const ICON = 20;

type Props = {
  readonly icon: IconName;
  // The words, the light background and the icon of the note.
  readonly ink: string;
  readonly soft: string;
  readonly mark: string;
  readonly title: string;
  readonly text: string;
  // A note for one visit has «Yopish»; a state that lasts (the check) has none.
  readonly closable?: boolean;
};

// A note of the main screen as the mockup of G53: the bold title and the words in one block, the
// application being checked in the colors of the driver app, the approval green.
export function HomeNote({ icon, ink, soft, mark, title, text, closable = false }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="home-note" style={{ '--note': ink, '--note-soft': soft } as CSSProperties}>
      <Icon name={icon} size={ICON} color={mark} />
      <div>
        <span className="home-note-title">{title}</span>
        <br />
        {text}
        {closable ? (
          <button type="button" className="home-note-close" onClick={() => setOpen(false)}>
            {t('common.close')}
          </button>
        ) : null}
      </div>
    </div>
  );
}
