import '../team/team.css';
import '../team/navbat.css';
import './manage.css';
import type { ReactNode } from 'react';
import { useBrand } from '../context/brand-context';
import { Icon, type IconName } from '../icons';
import { Screen } from '../screen/screen';
import { useScreenBackground } from '../telegram/screen-background';
import { haptic } from '../telegram/feedback';
import { brandVars } from '../theme/brand-vars';
import { TeamSection } from '../team/team-section';

const ICON = 20;
const ARROW = 16;

type PageProps = {
  readonly title: string;
  readonly hint?: string;
  readonly onBack: () => void;
  // A pull down loads the list again quietly (docs/64).
  readonly onRefresh?: () => void;
  readonly children: ReactNode;
};

// A screen of «Boshqaruv» (G75, docs/120, mockup g67/2 screen 6): the title, a gray line under it,
// then groups of rows on white cards.
export function ManagePage({ title, hint, onBack, onRefresh, children }: PageProps) {
  useScreenBackground();
  const { colors } = useBrand().theme;
  return (
    <div className="manage" style={brandVars(colors)}>
      <Screen onBack={onBack} {...(onRefresh ? { onRefresh } : {})} />
      <h1 className="manage-title">{title}</h1>
      {hint ? <p className="manage-hint">{hint}</p> : null}
      {children}
    </div>
  );
}

// A group with its gray title in capitals: «ODAMLAR VA SAFARLAR», «PUL» (mockup g67/2 screen 6). A
// card without a title follows the one before it (G78 sheet 4).
export function ManageGroup({ title, children }: { readonly title?: string; readonly children: ReactNode }) {
  const card = <div className="team-card">{children}</div>;
  if (!title) return <div className="team-section">{card}</div>;
  return <TeamSection title={title}>{card}</TeamSection>;
}

// A gray note under a card: what the card means, when the numbers came (G78 sheet 4).
export function ManageNote({ children }: { readonly children: ReactNode }) {
  return <p className="manage-hint manage-note">{children}</p>;
}

type RowProps = {
  readonly icon: IconName;
  readonly title: string;
  // A live line like «Bugun 17 ta»; its place is kept while it loads, the rows do not move.
  readonly hint?: string | null;
  readonly danger?: boolean;
  // The line under the title in red: «Pitak yoʻq», a step most people left (G78 sheet 4).
  readonly alarm?: boolean;
  // The number or the money on the right, bold (G78 sheet 4).
  readonly value?: ReactNode;
  readonly onClick?: () => void;
};

// One row: the gray icon tile, the title, the line under it, the value, and an arrow when it opens
// something.
export function ManageRow({ icon, title, hint, danger = false, alarm = false, value, onClick }: RowProps) {
  const words = (
    <>
      <span className="navbat-icon">
        <Icon name={icon} size={ICON} />
      </span>
      <span className="navbat-words">
        <span className={danger ? 'navbat-title manage-danger' : 'navbat-title'}>{title}</span>
        {hint === undefined ? null : (
          <span className={alarm ? 'navbat-hint manage-row-hint manage-danger' : 'navbat-hint manage-row-hint'}>
            {hint}
          </span>
        )}
      </span>
      {value === undefined ? null : <span className="manage-value">{value}</span>}
    </>
  );
  if (!onClick) return <div className="navbat-row manage-row">{words}</div>;
  return (
    <button
      type="button"
      className="navbat-row manage-row"
      onClick={() => {
        haptic.tap();
        onClick();
      }}
    >
      {words}
      <Icon name="next" size={ARROW} />
    </button>
  );
}
