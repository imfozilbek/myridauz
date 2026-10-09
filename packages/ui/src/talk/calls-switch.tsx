import type { RideRequest } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ToggleRow } from '../find/toggle-row';
import { ActionFailure } from '../states/action-failure';
import { useFailure } from '../states/use-failure';
import { haptic } from '../telegram/feedback';
import '../bookings/book-points.css';
import '../find/seats.css';

// The passenger lets the drivers call about the request before a booking, or only write (G64,
// docs/127): the numbers stay hidden either way (docs/07). The switch moves at once; a failure
// puts it back and says why.
export function CallsSwitch({ request }: { readonly request: RideRequest }) {
  const { t } = useI18n();
  const { market } = useApiClients();
  const [on, setOn] = useState(!request.callsOff);
  const { failure, fail, clear } = useFailure();
  const change = async (next: boolean) => {
    clear();
    setOn(next);
    haptic.select();
    try {
      await market.setRequestCalls(request.id, next);
    } catch (caught) {
      setOn(!next);
      fail(caught);
    }
  };
  return (
    <>
      <div className="points-card seats-card my-request-calls">
        <ToggleRow
          label={t('requests.talk.callsOn')}
          hint={t('requests.talk.callsHint')}
          checked={on}
          onChange={(next) => void change(next)}
        />
      </div>
      <ActionFailure error={failure} />
    </>
  );
}
