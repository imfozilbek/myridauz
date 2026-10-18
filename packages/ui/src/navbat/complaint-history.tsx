import type { ComplaintCase, Party } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { BlockJournal } from '../moderation/block-journal';

// What the team weighs beside a complaint (docs/17, G45): both sides with their trips and the
// complaints against them, the complaints before against the same person with what was decided, and
// the blocks of that person.
export function ComplaintHistory({ complaint }: { readonly complaint: ComplaintCase }) {
  const { t, formatDate } = useI18n();
  const side = (party: Party) => (
    <div className="case-row" key={party.id}>
      <span className="case-muted">{party.firstName}</span>
      <b>{t('navbat.complaint.history', { trips: party.trips, complaints: party.complaints })}</b>
    </div>
  );
  const { past, against } = complaint;
  return (
    <>
      <div className="case-card">
        {side(complaint.author)}
        {side(against)}
      </div>
      {past.length > 0 ? (
        <div className="case-card">
          <span className="case-row case-small">
            <span>{t('navbat.complaint.past', { name: against.firstName })}</span>
          </span>
          {past.map((one) => (
            <div className="case-row" key={one.id}>
              <span className="case-muted">{formatDate(new Date(one.at))}</span>
              <b>
                {t('home.meta', {
                  when: one.reasons.map((reason) => t(`complaints.reason.${reason}`)).join(', '),
                  more: t(`navbat.complaint.decided.${one.decision ?? 'waiting'}`),
                })}
              </b>
            </div>
          ))}
        </div>
      ) : null}
      <BlockJournal userId={against.id} />
    </>
  );
}
