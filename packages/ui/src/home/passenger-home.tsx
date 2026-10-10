import { PassengerActions } from '../action-sheet/passenger-actions';
import type { HomeGo } from '../flow/start-action';
import { Screen } from '../screen/screen';
import { usePassengerData } from './passenger-data';

// The main screen of a passenger under the head and the tiles (G76, docs/165): the seat, the
// request and the meeting live in the block at the bottom; here the sheets of the open Mini App
// and a pull down that refreshes the lists (docs/94 W1).
export function PassengerHome({ go }: { readonly go: HomeGo }) {
  const load = usePassengerData();
  return (
    <>
      <Screen onRefresh={load.refresh} />
      <PassengerActions go={go} />
    </>
  );
}
