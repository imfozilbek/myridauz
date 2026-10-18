import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderInShell, testClients } from '../test-shell';
import { booking } from './booking-test-kit';
import { useSeatSteps } from './use-seat-steps';

// The car is on the road and the passenger in it: «Yetib keldim» works.
const onRoad = { ...booking, status: 'confirmed' as const, boardedAt: booking.trip.departAt };

function Steps() {
  const steps = useSeatSteps(onRoad, () => undefined);
  return (
    <>
      <button onClick={steps.step}>step</button>
      <button onClick={steps.answer}>answer</button>
    </>
  );
}

// «Yetib keldingizmi?» of the main screen is the question of the bot (G46, docs/43): «Ha, yetib
// keldim» is the arrival and closes the link of close people; the plain «Yetib keldim» keeps it.
describe('the answer to «Yetib keldingizmi?»', () => {
  it('marks the arrival and closes the link; «Yetib keldim» only marks it', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(onRoad.trip.departAt + 60 * 60_000);
    const arrived = vi.fn(async () => ({ ...onRoad, arrivedAt: Date.now() }));
    const stopSharing = vi.fn(async () => undefined);
    renderInShell(<Steps />, true, true, undefined, testClients({ chat: { arrived, stopSharing } }));
    fireEvent.click(screen.getByText('step'));
    await waitFor(() => expect(arrived).toHaveBeenCalledTimes(1));
    expect(stopSharing).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('answer'));
    await waitFor(() => expect(stopSharing).toHaveBeenCalledWith(onRoad.id));
    vi.useRealTimers();
  });
});
