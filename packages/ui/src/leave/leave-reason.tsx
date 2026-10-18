import type { LeaveKind, LeaveReason } from '@platform/contracts';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { ChoiceRows } from '../sheet/choice-rows';
import { FormSheet } from '../sheet/form-sheet';
import { LEAVE_LABELS } from './leave-labels';

type Ask = (kind: LeaveKind) => void;
const AskContext = createContext<Ask>(() => undefined);

// «Nega bekor qildingiz?» (G87, docs/191): after a cancelled seat or trip or deleted data, a sheet
// of a few reasons. One tap gives the reason and closes it; a swipe down or a tap on the shade skips
// it. Only the kind and the id of the reason are counted, never who. The sheet lives above every
// screen: the screen of the cancel is often gone when it opens.
export function LeaveReasonProvider({ children }: { readonly children: ReactNode }) {
  const [kind, setKind] = useState<LeaveKind | null>(null);
  return (
    <AskContext.Provider value={setKind}>
      {children}
      <LeaveReasonSheet kind={kind} onClose={() => setKind(null)} />
    </AskContext.Provider>
  );
}

export const useAskLeaveReason = () => useContext(AskContext);

function LeaveReasonSheet({
  kind,
  onClose,
}: {
  readonly kind: LeaveKind | null;
  readonly onClose: () => void;
}) {
  const { t } = useI18n();
  const analytics = useAnalytics();
  const pick = useCallback(
    (reason: LeaveReason) => {
      if (!kind) return;
      analytics.track({ name: 'leave_reason', screen: `leave.${kind}`, kind, reason });
      // Deleted data reloads the app soon after: the answer goes at once.
      void analytics.flush();
      onClose();
    },
    [analytics, kind, onClose],
  );
  return (
    <FormSheet
      open={kind !== null}
      {...(kind ? { title: t(`leave.title.${kind}`) } : {})}
      hint={t('leave.hint')}
      onClose={onClose}
    >
      {kind ? (
        <ChoiceRows<LeaveReason>
          name="leave-reason"
          choices={LEAVE_LABELS[kind].map(({ reason, label }) => ({ key: reason, title: t(label) }))}
          onPick={pick}
        />
      ) : null}
    </FormSheet>
  );
}
