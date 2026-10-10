import './case.css';
import './case-parts.css';
import './case-talk.css';
import type { NavbatKind } from '@platform/contracts';
import { useEffect, useState, type ComponentType } from 'react';
import { Snackbar } from '../components';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import type { Launch } from '../flow/start-action';
import { useLoad } from '../market/use-list';
import { Screen } from '../screen/screen';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { ApplicationCase } from './application-case';
import type { CaseProps, Outcome } from './case-props';
import { ComplaintCase } from './complaint-case';
import { FaceCase } from './face-case';
import { forgetLinkedCase } from './linked-case';
import { nextCase, progressOf, type CaseKey } from './next-case';
import { SupportCase } from './support-case';

const CASES: Record<NavbatKind, ComponentType<CaseProps>> = {
  application: ApplicationCase,
  complaint: ComplaintCase,
  face: FaceCase,
  support: SupportCase,
};

const SEPARATOR = ':';
type NavbatProps = { readonly onBack: () => void } & Launch;

// The cases of «Navbat» one after another (G75, docs/120): the case tapped on the main screen, then
// after each decision the next one of the same filter by itself; none left: «Hammasi koʻrildi».
// The case on the screen is taken: the other members see «Aziz koʻrmoqda».
export function NavbatScreen({ onBack, navbat: launched }: NavbatProps) {
  useScreenBackground();
  const { t } = useI18n();
  const { team } = useApiClients();
  const { colors } = useBrand().theme;
  const filter = launched?.filter ?? 'all';
  const { value, failed, reload, refresh } = useLoad(() => team.navbat(), 'team.navbat');
  const [done, setDone] = useState<readonly CaseKey[]>([]);
  const [chosen, setChosen] = useState<CaseKey | null>(
    launched ? { kind: launched.kind, id: launched.id } : null,
  );
  const [told, setTold] = useState<Outcome | null>(null);
  const items = value?.items ?? [];
  const open = chosen ?? (value ? nextCase(items, filter, done) : null);
  const openKey = open ? [open.kind, open.id].join(SEPARATOR) : null;
  useEffect(forgetLinkedCase, []);
  // The case is taken once when it opens, not on every new list.
  useEffect(() => {
    if (openKey === null) return;
    const [kind, id] = openKey.split(SEPARATOR) as [NavbatKind, string];
    team.take(kind, id).catch(() => undefined);
  }, [team, openKey]);
  const notice = told ? <Snackbar onClose={() => setTold(null)}>{t(`moderation.${told}`)}</Snackbar> : null;
  if (!open)
    return (
      <>
        {failed ? (
          <ErrorScreen onRetry={reload} onBack={onBack} />
        ) : value ? (
          <div className="center-screen">
            <Screen onBack={onBack} />
            <EmptyState icon="selected" title={t('team.empty')} />
          </div>
        ) : (
          <ScreenSkeleton onBack={onBack} />
        )}
        {notice}
      </>
    );
  const Case = CASES[open.kind];
  const decided = (outcome: Outcome) => {
    setDone((list) => [...list, open]);
    setChosen(null);
    setTold(outcome);
    void refresh();
  };
  return (
    <div style={brandVars(colors)}>
      <Case
        key={openKey}
        id={open.id}
        item={items.find((item) => item.kind === open.kind && item.id === open.id)}
        progress={progressOf(items, filter, done)}
        onBack={onBack}
        onDone={decided}
      />
      {notice}
    </div>
  );
}
