import { describe, expect, it } from 'vitest';
import { chatAbout } from './application/chat-about';
import { openTalk } from './application/talks';
import { DILNOZA, DRIVER, setup } from './test-kit';

// Prod 21.11.2026: users.avatar_hidden 4 times in the chat of a driver. The Mini App of a driver shows
// no face of a passenger, so the chat says the passenger has none and no photo is asked.
describe('the chat of a driver asks for no face of a passenger', () => {
  it('gives the driver no photo of the request, the passenger still sees the own one', async () => {
    const { deps, addRequest } = setup();
    const requestId = addRequest();
    const opened = await openTalk(deps, DRIVER, requestId);
    const key = opened.ok ? opened.value.chatKey : '';
    const view = deps.requests.view.bind(deps.requests);
    const withFace = {
      ...deps,
      requests: {
        ...deps.requests,
        view: async (id: string) => {
          const request = await view(id);
          return request && { ...request, passenger: { ...request.passenger, hasAvatar: true } };
        },
      },
    };
    expect((await chatAbout(withFace, key, DRIVER))?.request?.passenger.hasAvatar).toBe(false);
    expect((await chatAbout(withFace, key, DILNOZA))?.request?.passenger.hasAvatar).toBe(true);
  });
});
