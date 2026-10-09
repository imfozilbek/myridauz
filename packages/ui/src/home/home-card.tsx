import type { CSSProperties, ReactNode } from 'react';
import { useBrand } from '../context/brand-context';
import { Icon, type IconName } from '../icons';
import './home-cards.css';

const ICON = 22;
const ROW_ARROW = 18;

type CardProps = {
  readonly onClick?: () => void;
  readonly className?: string;
  readonly style?: CSSProperties;
  // What a screen reader says for the whole card, like «Profil va rasm».
  readonly label?: string;
  readonly children: ReactNode;
};

// One white rounded card of the main screen (G53, docs/114); with a tap it is a button.
export function HomeCard({ onClick, className, style, label, children }: CardProps) {
  const name = className ? `home-card ${className}` : 'home-card';
  return onClick ? (
    <button type="button" className={name} style={style} aria-label={label} onClick={onClick}>
      {children}
    </button>
  ) : (
    <div className={name} style={style}>
      {children}
    </div>
  );
}

type RowProps = {
  readonly icon: IconName;
  readonly color: string;
  readonly title: string;
  readonly hint?: string;
  // An arrow at the end: the card opens a list (the mockup of «Boshqaruv»).
  readonly arrow?: boolean;
  readonly onClick: () => void;
};

// A card of one line: a colored icon, the words, maybe an arrow.
export function HomeRowCard({ icon, color, title, hint, arrow = false, onClick }: RowProps) {
  const { colors } = useBrand().theme;
  return (
    <HomeCard className="home-card-row" onClick={onClick}>
      <Icon name={icon} size={ICON} color={color} />
      <span className="home-card-words">
        <span className="home-card-title">{title}</span>
        {hint ? <span className="home-card-hint">{hint}</span> : null}
      </span>
      {arrow ? <Icon name="next" size={ROW_ARROW} color={colors.textMuted} /> : null}
    </HomeCard>
  );
}
