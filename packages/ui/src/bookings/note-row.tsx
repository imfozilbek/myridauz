import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';

// «Izoh (ixtiyoriy)»: how the driver knows the passenger at the meeting (owner decision 08.10.2026),
// a third row of the card of the two ends. A booking (G63) and a request (G48) share it.
export function NoteRow({ note, onOpen }: { readonly note: string; readonly onOpen: () => void }) {
  const { t } = useI18n();
  return (
    <button type="button" className="points-row" onClick={onOpen}>
      <span className="points-tile points-note">
        <Icon name="chat" size={20} />
      </span>
      <span className="points-text">
        <span className="points-label">{t('bookings.points.note')}</span>
        <span className={note ? 'points-value' : 'points-value points-empty'}>
          {note || t('market.comment.placeholder')}
        </span>
      </span>
      <Icon name="next" size={18} />
    </button>
  );
}
