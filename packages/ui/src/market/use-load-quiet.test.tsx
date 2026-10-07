import { activity, counted } from '@platform/api-client';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FeedContext } from '../feed/feed-context';
import { useLoad } from './use-list';

afterEach(cleanup);

// A request of the API, as the clients make it: through the one counter (docs/121 §3).
let answer: () => void = () => undefined;
const load = () =>
  counted(
    () =>
      new Promise<string>((resolve) => {
        answer = () => resolve('data');
      }),
  );
function Screen() {
  useLoad(load);
  return null;
}

// The top loader shows what people wait for; a refresh of the data already on the screen is quiet
// (docs/121 §3, docs/64, G72).
describe('useLoad and the top loader (G72)', () => {
  it('counts the first load, never the quiet refresh after a change of another person', async () => {
    let change: () => void = () => undefined;
    const subscribe = (onChange: () => void) => {
      change = onChange;
      return () => undefined;
    };
    render(
      <FeedContext.Provider value={subscribe}>
        <Screen />
      </FeedContext.Provider>,
    );
    expect(activity.busy()).toBe(1);
    await act(async () => answer());
    expect(activity.busy()).toBe(0);
    act(() => change());
    expect(activity.busy()).toBe(0);
    await act(async () => answer());
  });
});
