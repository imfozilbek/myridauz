import type { Cadence, Pain, WaitlistRole } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import type { ReactNode } from 'react';
import { Icon, type IconName } from '../icons';

// The icons of the approved mockups (goals/g83): one per pain and one per answer of «Qachon».
export const PAIN_ICONS: Readonly<Record<Pain, IconName>> = {
  chats: 'painChats',
  fixed: 'painFixed',
  phone: 'painPhone',
  wait: 'painWait',
  price: 'painPrice',
  woman: 'female',
  empty: 'painEmpty',
  safety: 'team',
};
export const CADENCE_ICONS: Readonly<Record<Cadence, IconName>> = {
  daily: 'cadenceDaily',
  weekly: 'cadenceWeekly',
  monthly: 'cadenceMonthly',
  holidays: 'cadenceHolidays',
  once: 'cadenceOnce',
  sometimes: 'cadenceSometimes',
};
// The words of a pain of a role (docs/182): its name, its hint on the screen, the answer of the brand.
export const painKey = (part: 'pain' | 'hint' | 'solution', role: WaitlistRole, pain: Pain) =>
  `waitlist.${part}.${role}.${pain}` as TranslationKey;
const STEPS = 4;
const TILE_ICON = 20;
const CHEVRON = 18;

// The four bars of the questionnaire: the pains, the region, «Qachon», the channels (mockup 2).
export function WaitlistSteps({ at }: { readonly at: number }) {
  return (
    <div className="wl-steps" aria-hidden>
      {Array.from({ length: STEPS }, (_, index) => (
        <i key={index} className={index < at ? 'wl-on' : undefined} />
      ))}
    </div>
  );
}

export function WaitlistTitle({ title, hint }: { readonly title: string; readonly hint?: string }) {
  return (
    <h1 className="wl-title">
      {title}
      {hint ? <small>{hint}</small> : null}
    </h1>
  );
}

export const WaitlistTile = ({ icon }: { readonly icon: IconName }) => (
  <span className="wl-tile">
    <Icon name={icon} size={TILE_ICON} />
  </span>
);

type CellProps = {
  readonly icon?: IconName;
  readonly title: string;
  readonly hint?: string;
  // On the right: a link, a pill; nothing with a tap opens the arrow.
  readonly right?: ReactNode;
  readonly onClick?: () => void;
};

// A row of a white card: an icon tile, a bold title, a gray hint, an arrow when it opens something.
export function WaitlistCell({ icon, title, hint, right, onClick }: CellProps) {
  const inner = (
    <>
      {icon ? <WaitlistTile icon={icon} /> : null}
      <span className="wl-cell-text">
        <b>{title}</b>
        {hint ? <span className="wl-cell-hint">{hint}</span> : null}
      </span>
      {right ??
        (onClick ? (
          <span className="wl-chevron">
            <Icon name="next" size={CHEVRON} />
          </span>
        ) : null)}
    </>
  );
  return onClick ? (
    <button type="button" className="wl-cell" onClick={onClick}>
      {inner}
    </button>
  ) : (
    <div className="wl-cell">{inner}</div>
  );
}
