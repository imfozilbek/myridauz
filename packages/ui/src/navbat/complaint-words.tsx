import type { Complaint } from '@platform/contracts';
import { useState } from 'react';
import { useI18n } from '../context/i18n-context';

const MINUTE_MS = 60_000;
const HOUR = 60;
const DAY = 24 * HOUR;

// «Madinaning soʻzi · 2 soat oldin» and what the person wrote (mockup g67/2 screen 4); a complaint
// without words has no card.
export function ComplaintWords({ complaint }: { readonly complaint: Complaint }) {
  const { t } = useI18n();
  const [now] = useState(Date.now);
  if (!complaint.comment) return null;
  const minutes = Math.max(0, Math.floor((now - complaint.createdAt) / MINUTE_MS));
  const ago =
    minutes < HOUR
      ? t('navbat.complaint.minutesAgo', { count: minutes })
      : minutes < DAY
        ? t('navbat.complaint.hoursAgo', { count: Math.floor(minutes / HOUR) })
        : t('navbat.complaint.daysAgo', { count: Math.floor(minutes / DAY) });
  return (
    <div className="case-card case-words">
      <span className="case-row case-small">
        <span>{t('navbat.complaint.words', { name: complaint.author.firstName })}</span>
        <span>{ago}</span>
      </span>
      <p>{complaint.comment}</p>
    </div>
  );
}
