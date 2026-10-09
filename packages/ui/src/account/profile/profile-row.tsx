import type { ReactNode } from 'react';
import { IconTile } from '../../icon-tile';
import { Icon, type IconName } from '../../icons';

const CHEVRON = 10;

type Props = {
  readonly icon: IconName;
  readonly title: string;
  readonly hint?: string | undefined;
  // What stands on the right: the plate of the car, the switch, the small drawings of channels.
  readonly after?: ReactNode;
  // A row that opens something ends with «›», unless something else stands on the right.
  readonly onClick?: (() => void) | undefined;
  readonly chevron?: boolean;
};

// One row of «Profil» (G65, mockup g65/3): the soft icon of the app, the title, a line under it.
export function ProfileRow({ icon, title, hint, after, onClick, chevron = after === undefined }: Props) {
  const content = (
    <>
      <IconTile name={icon} tone="mint" soft />
      <span className="profile-row-text">
        <span className="profile-row-title">{title}</span>
        {hint ? <span className="profile-row-hint">{hint}</span> : null}
      </span>
      {after === undefined ? null : <span className="profile-row-after">{after}</span>}
      {onClick && chevron ? (
        <span className="profile-row-chevron">
          <Icon name="next" size={CHEVRON} />
        </span>
      ) : null}
    </>
  );
  return onClick ? (
    <button type="button" className="profile-row" onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className="profile-row">{content}</div>
  );
}

// A white group of rows with its header above (mockup g65/3: «Sozlamalar», «Yordam»).
export function ProfileGroup({
  header,
  children,
}: {
  readonly header?: string;
  readonly children: ReactNode;
}) {
  return (
    <>
      {header ? <h2 className="profile-head">{header}</h2> : null}
      <div className="profile-group">{children}</div>
    </>
  );
}
