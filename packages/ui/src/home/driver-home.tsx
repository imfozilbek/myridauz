import { DriverActions } from '../action-sheet/driver-actions';
import { Screen } from '../screen/screen';
import { useDriverData } from './driver-data';

// The main screen of a driver under the head and the tiles (G76, docs/165): the application, the
// trip and the requests live in the block at the bottom; here the sheets of the open Mini App and a
// pull down that refreshes the lists (docs/94 W1).
export function DriverHome() {
  const load = useDriverData();
  return (
    <>
      <Screen onRefresh={load.refresh} />
      <DriverActions />
    </>
  );
}
