import { useDirectory } from '../places/use-directory';
import type { PlaceDirectory } from '../places/directory';
import { useActionItems } from './action-queue';
import { useMessageItems } from './kinds/message-items';
import { useRequestItems } from './kinds/request-items';

// What waits for an answer of a driver on the main screen (docs/122): the sheet shows it one at a
// time. It leaves with the main screen: on the screen of a thing itself there is no sheet.
export function DriverActions() {
  const [places] = useDirectory();
  return places.status === 'ready' ? <Ready directory={places.directory} /> : null;
}

function Ready({ directory }: { readonly directory: PlaceDirectory }) {
  useActionItems('driver', [...useRequestItems(directory), ...useMessageItems(directory)]);
  return null;
}
