import type { ReactNode } from 'react';
import { ProfilePhoto } from '../../account/profile/profile-photo';
import { Icon } from '../../icons';
import './dock-card.css';

const FACE = 34;
const TOOL = 18;
const CLOCK = 12;

type CardTone = 'brand' | 'soon' | 'now' | 'off';
type ChipTone = 'brand' | 'green' | 'red' | 'gray';
type Tool = {
  readonly icon: 'phone' | 'chat';
  readonly label: string;
  readonly dot?: boolean;
  readonly onClick: () => void;
};
type Person = { readonly id: string; readonly firstName: string; readonly hasAvatar: boolean };

export type DockCardProps = {
  readonly chip: string;
  readonly chipTone?: ChipTone;
  // A live timer next to the chip: amber soon, red now (docs/165).
  readonly timer?: { readonly text: string; readonly now: boolean };
  readonly title: string;
  readonly text: ReactNode;
  readonly tone?: CardTone;
  // The other person of the trip with the chat and the call (docs/07: numbers hidden).
  readonly who?: { readonly person: Person; readonly sub: string; readonly tools?: readonly Tool[] };
  // Ready words under the card: «5 daqiqada», «10 daqiqada» (docs/164, from the meeting sheet).
  readonly quick?: readonly { readonly label: string; readonly onClick: () => void }[];
};

// The card of the block at the bottom (G76, mockups g76/2, g76/3): the chip of the state, the live
// timer, what it is in big words, a line under it, the person; one look tells what to do now.
export function DockCard({
  chip,
  chipTone = 'brand',
  timer,
  title,
  text,
  tone = 'brand',
  who,
  quick,
}: DockCardProps) {
  return (
    <>
      <div className={`dock-card dock-card-${tone}`}>
        <span className={`dock-chip dock-chip-${chipTone}`}>{chip}</span>
        {timer ? (
          <span className={timer.now ? 'dock-timer dock-timer-now' : 'dock-timer'}>
            <Icon name="waiting" size={CLOCK} />
            {timer.text}
          </span>
        ) : null}
        <h3 className="dock-card-title">{title}</h3>
        <p className="dock-card-text">{text}</p>
        {who ? (
          <div className="dock-who">
            <ProfilePhoto
              userId={who.person.id}
              name={who.person.firstName}
              hasAvatar={who.person.hasAvatar}
              size={FACE}
            />
            <span className="dock-who-words">
              <b>{who.person.firstName}</b>
              <span>{who.sub}</span>
            </span>
            <span className="dock-tools">
              {(who.tools ?? []).map((tool) => (
                <button
                  key={tool.icon}
                  type="button"
                  className="dock-tool"
                  aria-label={tool.label}
                  onClick={tool.onClick}
                >
                  <Icon name={tool.icon} size={TOOL} />
                  {tool.dot ? <span className="dock-tool-dot" /> : null}
                </button>
              ))}
            </span>
          </div>
        ) : null}
      </div>
      {quick ? (
        <div className="dock-quick">
          {quick.map((one) => (
            <button key={one.label} type="button" onClick={one.onClick}>
              {one.label}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
