import { describe, expect, it } from 'vitest';
import { MAX_PER_MINUTE } from './application/room';
import { DRIVER, MINUTE, PASSENGER, room } from './chat-test-kit';

// One person sends at most MAX_PER_MINUTE messages a minute: a flood never reaches the other side
// (G42, docs/111). A minute later the person writes again.
describe('a flood in the chat', () => {
  it('drops the messages over the limit of a minute', async () => {
    const { connect, say, inbox, later } = room();
    const passenger = connect(PASSENGER);
    connect(DRIVER);
    for (let index = 0; index < MAX_PER_MINUTE + 5; index += 1) await say(passenger, `Salom ${index}`);
    const delivered = () => (inbox.get(1) ?? []).filter((event) => event.type === 'message').length;
    expect(delivered()).toBe(MAX_PER_MINUTE);
    await later(MINUTE);
    await say(passenger, 'Yana salom');
    expect(delivered()).toBe(MAX_PER_MINUTE + 1);
  });
});
