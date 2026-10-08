import type { ChatAbout } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { PersonBadge } from '../find/person-badge';
import { UzPlate } from '../plate/uz-plate';
import { otherSide } from './other-side';

const PHOTO = 118;
const LETTER = 40;

// Who is on the call (mockup g60/4): the face in a ring, the name, the car and the plate. A driver
// knows the own car: the passenger is a face and a name. Before a booking the offer shows the car
// (mockups g64/2, g64/4): the head is a face and a name.
export function CallPerson({ about, name }: { readonly about: ChatAbout | null; readonly name: string }) {
  const { t } = useI18n();
  const other = about ? otherSide(about) : null;
  const car = about?.booking ? other?.car : null;
  return (
    <>
      <span className="call-ring">
        {other ? (
          <PersonBadge
            id={other.id}
            name={other.firstName}
            hasAvatar={other.hasAvatar}
            size={PHOTO}
            letter={LETTER}
            plain
          />
        ) : null}
      </span>
      <b className="call-name">{name}</b>
      {car ? (
        <span className="call-car">
          {`${car.model}, ${t(`drivers.color.${car.color}`)} · `}
          {car.plate ? <UzPlate plate={car.plate} size="s" /> : null}
        </span>
      ) : null}
    </>
  );
}
