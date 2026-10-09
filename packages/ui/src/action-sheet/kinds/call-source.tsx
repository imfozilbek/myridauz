import { useEffect, useRef, useState } from 'react';
import { otherSide } from '../../call/other-side';
import { startTone } from '../../call/call-tones';
import { useChat } from '../../chat/use-chat';
import { useApiClients } from '../../context/api-clients';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { useLoad } from '../../market/use-list';
import { useDirectory } from '../../places/use-directory';
import { unlockAudio } from '../../sounds/audio';
import { itemKey, type ActionItem } from '../action-item';
import { useActionItems } from '../action-queue';
import { CarLine, TripBlock } from '../sheet-parts';
import { useSheetWords } from '../trip-line';
import type { PlaceDirectory } from '../../places/directory';

const NO_RING_MS = 3000;
let rings = 0;

type Props = {
  readonly chatKey: string;
  // The ring is over: answered elsewhere, hung up, missed or declined.
  readonly onGone: () => void;
  readonly onAnswer: () => void;
};

// A call while the Mini App is open (docs/122, mockup g68/8 «Qoʻngʻiroq»): the chat of the call
// listens in the background, the phone rings, the sheet asks; the screen under it stays. «Javob
// berish» opens the chat and takes the call there; «Rad etish» or a tap beside it declines.
export function CallSource({ chatKey, onGone, onAnswer }: Props) {
  const [places] = useDirectory();
  const { loaded, calling } = useChat(chatKey);
  const ringing = calling.call?.status === 'ringing' && calling.call.caller === 'other';
  const [rang, setRang] = useState(false);
  useEffect(() => {
    if (ringing) return void setRang(true);
    if (rang) return void onGone();
    // The chat sends its history, then the call: a call over before the chat opened never comes.
    if (!loaded) return undefined;
    const timer = setTimeout(onGone, NO_RING_MS);
    return () => clearTimeout(timer);
  }, [ringing, loaded]);
  // The phone rings while the sheet asks (docs/08).
  useEffect(() => {
    if (!ringing) return undefined;
    return startTone('ring');
  }, [ringing]);
  const decline = () => calling.emit({ type: 'call', action: 'decline' });
  return ringing && places.status === 'ready' ? (
    <Ringing chatKey={chatKey} directory={places.directory} onAnswer={onAnswer} onDecline={decline} />
  ) : null;
}

type RingingProps = {
  readonly chatKey: string;
  readonly directory: PlaceDirectory;
  readonly onAnswer: () => void;
  readonly onDecline: () => void;
};

function Ringing({ chatKey, directory, onAnswer, onDecline }: RingingProps) {
  const { t } = useI18n();
  const { chat } = useApiClients();
  const brand = useBrand().name;
  const words = useSheetWords(directory);
  const about = useLoad(() => chat.about(chatKey)).value;
  const answered = useRef(false);
  // Each ring is its own: a declined ring never hides the next call of the same chat.
  const [ring] = useState(() => (rings += 1));
  const side = about ? otherSide(about) : null;
  const line = about ? words.about(about) : null;
  const car = side?.car;
  const item: ActionItem | null =
    side && about
      ? {
          key: itemKey('call', `${chatKey}:${ring}`),
          kind: 'call',
          call: true,
          face: { id: side.id, name: side.firstName, hasAvatar: side.hasAvatar },
          kicker: t('sheet.call.kicker', { brand }),
          title: side.firstName,
          ...(car
            ? {
                sub: (
                  <CarLine
                    car={t('sheet.car', {
                      color: t(`drivers.color.${car.color}`),
                      make: car.make,
                      model: car.model,
                    })}
                    plate={car.plate}
                  />
                ),
              }
            : {}),
          ...(line ? { body: <TripBlock head={line} /> } : {}),
          main: {
            label: t('sheet.call.answer'),
            icon: 'phone',
            run: () => {
              answered.current = true;
              // The tap itself opens the sound on iPhone: the voice plays in the chat.
              unlockAudio();
              onAnswer();
              return undefined;
            },
          },
          second: { label: t('sheet.call.decline'), icon: 'close', run: () => void onDecline() },
          note: t('sheet.call.hidden'),
          onAside: () => {
            if (!answered.current) onDecline();
          },
        }
      : null;
  useActionItems('call', item ? [item] : []);
  return null;
}
