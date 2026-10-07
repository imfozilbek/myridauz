import type { PersonId } from '@platform/contracts';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { Icon, type IconName } from '../icons';

const PHOTO = 80;
const BADGE = 16;

type Props = {
  readonly id: PersonId;
  readonly name: string;
  readonly hasAvatar: boolean;
  readonly badge: IconName;
};

// The top of a sheet of the main screen (mockups g60/6, g60/7): the grabber, then the face with a
// round badge that says what the sheet is about.
export function SheetFace({ id, name, hasAvatar, badge }: Props) {
  return (
    <>
      <span className="sheet-grab" aria-hidden />
      <span className="sheet-face">
        <ProfilePhoto userId={id} name={name} hasAvatar={hasAvatar} size={PHOTO} />
        <span className="sheet-badge" aria-hidden>
          <Icon name={badge} size={BADGE} />
        </span>
      </span>
    </>
  );
}
