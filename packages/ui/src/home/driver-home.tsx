import { DriverActions } from '../action-sheet/driver-actions';
import { Screen } from '../screen/screen';
import { useFreshLists } from './fresh-lists';
import { useDriverData } from './driver-data';

// The main screen of a driver under the head and the tiles (G76, docs/165): the application, the
// trip and the requests live in the block at the bottom; here the sheets of the open Mini App and a
// pull down that refreshes the lists (docs/94 W1).
export function DriverHome() {
  const load = useDriverData();
  // Back on the main screen after the person's own step (a seat, a request, a cancel): its lists
  // refresh quietly, no signal comes for it (G77, lesson 230).
  useFreshLists(load);
  return (
    <>
      <Screen onRefresh={load.refresh} />
      <DriverActions />
    </>
  );
}
