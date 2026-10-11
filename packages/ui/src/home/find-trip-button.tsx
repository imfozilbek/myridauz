import type { Launch } from '../flow/start-action';
import { useI18n } from '../context/i18n-context';
import type { PlaceDirectory } from '../places/directory';
import { MainButton } from '../telegram/bottom-button';
import { startFind, useDockEnds } from './dock-ends';

type Props = { readonly directory: PlaceDirectory; readonly onFind: (launch: Launch) => void };

// «Safar topish» of an empty list (G79 П21): the search starts from the ends the block of the main
// screen shows, not from nothing.
export function FindTripButton({ directory, onFind }: Props) {
  const { t } = useI18n();
  const ends = useDockEnds(directory);
  return <MainButton text={t('common.passenger.findTrip')} onClick={() => onFind(startFind(ends))} />;
}
