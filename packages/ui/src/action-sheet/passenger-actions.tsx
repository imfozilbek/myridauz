import type { HomeGo } from '../flow/start-action';
import { useDirectory } from '../places/use-directory';
import type { PlaceDirectory } from '../places/directory';
import { useActionItems } from './action-queue';
import { usePassengerAnswers } from './kinds/answer-items';
import { useOfferItems } from './kinds/offer-items';
import { useMessageItems } from './kinds/message-items';
import { usePassengerMeetings } from './kinds/meeting-items';

// What waits for an answer of a passenger on the main screen (docs/122): the sheet shows it one at
// a time. It leaves with the main screen: on the screen of a thing itself there is no sheet.
export function PassengerActions({ go }: { readonly go: HomeGo }) {
  const [places] = useDirectory();
  return places.status === 'ready' ? <Ready directory={places.directory} go={go} /> : null;
}

function Ready({ directory, go }: { readonly directory: PlaceDirectory; readonly go: HomeGo }) {
  useActionItems('passenger', [
    ...usePassengerMeetings(directory),
    ...useOfferItems(directory, go),
    ...usePassengerAnswers(directory, go),
    ...useMessageItems(directory),
  ]);
  return null;
}
