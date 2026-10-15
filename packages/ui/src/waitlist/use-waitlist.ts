import { quietly } from '@platform/api-client';
import type { WaitlistAnswers, WaitlistMe } from '@platform/contracts';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { onAppVisible } from '../telegram/app-visible';
import { TelegramContext } from '../telegram/in-telegram-context';
import { startVia } from '../telegram/launch-param';

// The records of the person in the list (docs/181). The first opening tells the mark of the link and
// the platform once (docs/116); back from a channel, «✓ Aʼzosiz» comes with a fresh answer (G80).
export function useWaitlist() {
  const { waitlist } = useApiClients();
  const { client } = useContext(TelegramContext);
  const [me, setMe] = useState<WaitlistMe | null>(null);
  const [failed, setFailed] = useState(false);
  const load = useCallback(() => {
    setFailed(false);
    waitlist.open(startVia(), client).then(setMe, () => setFailed(true));
  }, [waitlist, client]);
  useEffect(() => {
    load();
    return onAppVisible(() => void quietly(() => waitlist.open(null, null)).then(setMe, () => undefined));
  }, [load, waitlist]);
  const save = useCallback(
    async (answers: WaitlistAnswers) => {
      const fresh = await waitlist.save(answers);
      setMe(fresh);
      return fresh;
    },
    [waitlist],
  );
  return { me, failed, retry: load, save };
}
