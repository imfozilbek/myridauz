import type { RequestBoard, RideRequest } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { useEnds } from './ends';
import { useLaterDay } from './request-day';
import { RequestRow, type RowAction } from './request-row';

type BoardHandlers = {
  readonly onAction: (request: RideRequest, action: RowAction) => unknown;
  readonly onTalk: (request: RideRequest, ring: boolean) => void;
};

type Props = BoardHandlers & {
  readonly board: RequestBoard;
  readonly offered: ReadonlySet<string>;
};

// The requests of the board (mockups g64/1 and g64/2): with a trip of the driver the ones that fit
// it come first under «Safaringizga mos», one tap offers the trip; then the others. A live trip
// keeps the others to a chat and a call: a new offer waits until it is over (docs/172).
export function BoardList({ board, offered, onAction, onTalk }: Props) {
  const { t } = useI18n();
  const ends = useEnds();
  const laterDay = useLaterDay();
  const row = (request: RideRequest, action: RowAction | null, extraKm?: number) => (
    <RequestRow
      key={request.id}
      request={request}
      route={t('requests.card.route', ends(request))}
      {...(extraKm === undefined ? {} : { extraKm })}
      day={action === 'salon' ? laterDay(request.date) : undefined}
      action={action}
      offered={offered.has(request.id)}
      onAction={() => (action ? onAction(request, action) : undefined)}
      onChat={() => onTalk(request, false)}
      onCall={() => onTalk(request, true)}
    />
  );
  const other = (request: RideRequest) =>
    row(request, board.busy ? null : request.wholeCar ? 'salon' : 'offer');
  const busy =
    board.busy && board.others.length > 0 ? <p className="board-busy">{t('requests.board.busy')}</p> : null;
  if (!board.trip)
    return (
      <>
        {busy}
        {board.others.map(other)}
      </>
    );
  return (
    <>
      {board.fits.length > 0 ? (
        <span className="board-label">{t('requests.board.fits', { count: String(board.fits.length) })}</span>
      ) : null}
      {board.fits.map(({ extraKm, ...request }) => row(request, 'onTrip', extraKm))}
      {board.others.length > 0 ? (
        <span className="board-label">
          {t('requests.board.others', { count: String(board.others.length) })}
        </span>
      ) : null}
      {busy}
      {board.others.map(other)}
    </>
  );
}
