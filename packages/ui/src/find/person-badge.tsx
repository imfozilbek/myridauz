import type { PersonId } from '@platform/contracts';
import { ProfilePhoto } from '../account/profile/profile-photo';
import './person-badge.css';

// The letter's share of the face: smaller and thinner on the grey face (G60 mockups).
const LETTER = 0.45;
const PLAIN_LETTER = 0.35;

type Props = {
  readonly id: PersonId;
  readonly name: string;
  readonly hasAvatar: boolean;
  readonly size: number;
  // Grey on the screens of a booked trip (G60 mockups), mint in the search (G59).
  readonly plain?: boolean;
  // The size of the letter, when a mockup draws it smaller than the usual share of the face.
  readonly letter?: number;
};

// A small round face, or the first letter on mint while there is no photo (the approved mockups).
export function PersonBadge({ id, name, hasAvatar, size, plain = false, letter }: Props) {
  if (hasAvatar) return <ProfilePhoto userId={id} name={name} hasAvatar size={size} />;
  return (
    <span
      className={plain ? 'person-badge person-badge-plain' : 'person-badge'}
      style={{
        width: size,
        height: size,
        fontSize: letter ?? Math.round(size * (plain ? PLAIN_LETTER : LETTER)),
      }}
      aria-hidden
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
