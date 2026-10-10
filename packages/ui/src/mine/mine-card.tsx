import './mine-card.css';
import type { ReactNode } from 'react';
import { Icon } from '../icons';
import { haptic } from '../telegram/feedback';

const CHEVRON = 18;
type ChipTone = 'gray' | 'good' | 'brand';
type Props = {
  readonly head: string;
  readonly route: string;
  readonly meta: ReactNode;
  readonly chip?: { readonly text: string; readonly tone: ChipTone } | null;
  // «Qayta yuborish» under an old request: its own tap, not the card's (G75, mockup g75/2 A).
  readonly link?: ReactNode;
  readonly onOpen: () => void;
};

const CHIP: Record<ChipTone, string> = {
  gray: 'mine-chip',
  good: 'mine-chip mine-chip-good',
  brand: 'mine-chip mine-chip-brand',
};

// One card of «Mening safarlarim» of a passenger (G75, mockup g75/2 A): «Ertaga · 08:00», the way,
// who or how many, a tag; the whole card opens the seat or the request.
export function MineCard({ head, route, meta, chip, link, onOpen }: Props) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="mine-card"
      onClick={() => {
        haptic.tap();
        onOpen();
      }}
      onKeyDown={(event) => event.key === 'Enter' && onOpen()}
    >
      <span className="mine-card-top">
        <span className="mine-card-words">
          <b>{head}</b>
          <span className="mine-card-route">{route}</span>
          <span className="mine-card-meta">{meta}</span>
        </span>
        <span className="mine-card-chevron">
          <Icon name="next" size={CHEVRON} />
        </span>
      </span>
      {chip ? (
        <span className="mine-card-tags">
          <span className={CHIP[chip.tone]}>{chip.text}</span>
        </span>
      ) : null}
      {link}
    </div>
  );
}
