import type { HomeGo } from '../flow/start-action';
import { useDirectory } from '../places/use-directory';
import type { PlaceDirectory } from '../places/directory';
import { useActionItems } from './action-queue';
import { useDriverAnswers } from './kinds/answer-items';
import { useDriverMeetings } from './kinds/meeting-items';
import { useMessageItems } from './kinds/message-items';
import { useRequestItems } from './kinds/request-items';

// What waits for an answer of a driver on the main screen (docs/122): the sheet shows it one at a
// time. It leaves with the main screen: on the screen of a thing itself there is no sheet.
export function DriverActions({ go }: { readonly go: HomeGo }) {
  const [places] = useDirectory();
  return places.status === 'ready' ? <Ready directory={places.directory} go={go} /> : null;
}

function Ready({ directory, go }: { readonly directory: PlaceDirectory; readonly go: HomeGo }) {
  useActionItems('driver', [
    ...useDriverMeetings(directory),
    ...useRequestItems(directory),
    ...useDriverAnswers(directory, go),
    ...useMessageItems(directory),
  ]);
  return null;
}
