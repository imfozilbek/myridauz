import { CHAT_SYSTEM_EVENTS, type ChatLine, type ChatSystemEvent, type Complaint } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useLoad } from '../market/use-list';
import { Screen } from '../screen/screen';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';

// A system line comes as its event (docs/35): the moderator reads it in words.
const EVENT = new Set<string>(CHAT_SYSTEM_EVENTS);

type ChatProps = { readonly complaint: Complaint; readonly onBack: () => void };

// «Suhbatni koʻrish»: the chat of the booking, read only for this complaint; the read goes to the
// log (docs/07, docs/17).
export function ComplaintChat({ complaint, onBack }: ChatProps) {
  const { t } = useI18n();
  const { feedback } = useApiClients();
  const { value, failed, reload } = useLoad(() => feedback.chat(complaint.id));
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  const text = (line: ChatLine) =>
    line.author === null && EVENT.has(line.text)
      ? t(`chat.system.${line.text as ChatSystemEvent}`)
      : line.text;
  const name = (author: string | null) =>
    author === complaint.author.id
      ? complaint.author.firstName
      : author === null
        ? t('complaints.system')
        : complaint.against.firstName;
  return (
    <div className="case">
      <Screen onBack={onBack} />
      <h1 className="case-title">{t('navbat.complaint.chat')}</h1>
      {value.length === 0 ? (
        <EmptyState icon="chat" title={t('complaints.chatEmpty')} />
      ) : (
        <div className="case-card">
          {value.map((line) => (
            <p key={`${line.at}-${line.text}`} className="case-line">
              <b>{name(line.author)}</b>
              <span>{text(line)}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
