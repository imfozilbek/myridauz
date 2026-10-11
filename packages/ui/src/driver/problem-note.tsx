import {
  CAR_PHOTO_KINDS,
  reasonsAt,
  type DriverApplication,
  type ModerationReason,
  type ProblemPlace,
} from '@platform/contracts';
import { Caption } from '@telegram-apps/telegram-ui';
import { useI18n } from '../context/i18n-context';

type ProblemNoteProps = {
  readonly reasons: readonly ModerationReason[];
  readonly place: ProblemPlace;
};

// What the team asked to fix, right under the photo or the field (docs/04): red, one reason per line.
export function ProblemNote({ reasons, place }: ProblemNoteProps) {
  const { t } = useI18n();
  const here = reasonsAt(reasons, place);
  if (here.length === 0) return null;
  return (
    <span className="problem-note" role="alert">
      {here.map((reason) => (
        <Caption key={reason} className="problem-text">
          {t(`drivers.reason.${reason}`)}
        </Caption>
      ))}
    </span>
  );
}

export const hasProblem = (reasons: readonly ModerationReason[], place: ProblemPlace) =>
  reasonsAt(reasons, place).length > 0;

// The three photos of the car are taken and the team asks for no photo, the face neither: ready to send.
export const photosReady = (photos: DriverApplication['photos'], reasons: readonly ModerationReason[]) =>
  !hasProblem(reasons, 'avatar') &&
  CAR_PHOTO_KINDS.every((kind) => photos[kind] && !hasProblem(reasons, kind));
