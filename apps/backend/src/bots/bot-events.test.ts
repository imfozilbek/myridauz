import { describe, expect, it } from 'vitest';
import { botEventOf } from './bot-events';

const message = (text?: string) => ({
  message: { message_id: 1, chat: { id: 1 }, ...(text ? { text } : {}) },
});
const button = (data: string) => ({ callback_query: { id: 'q', from: { id: 1 }, data } });

describe('botEventOf (G12)', () => {
  it('keeps the command id, without the bot name and the payload', () => {
    expect(botEventOf('passenger', message('/start sub_1_2'))).toEqual({
      name: 'bot_command',
      source: 'passenger',
      code: 'start',
    });
    expect(botEventOf('admin', message('/Help@some_bot'))?.code).toBe('help');
  });

  it('keeps only the kind of a button, never its ids', () => {
    expect(botEventOf('driver', button('rate:b1:5'))).toEqual({
      name: 'bot_button',
      source: 'driver',
      code: 'rate',
    });
  });

  it('counts a person who blocked the bot or came back, never who (G87)', () => {
    const member = (status: string, type = 'private') => ({
      my_chat_member: { chat: { id: 7, type }, new_chat_member: { status } },
    });
    expect(botEventOf('passenger', member('kicked'))).toEqual({
      name: 'bot_member',
      source: 'passenger',
      code: 'blocked',
    });
    expect(botEventOf('driver', member('member'))?.code).toBe('unblocked');
    // The bot added to or taken out of a group is not a person leaving.
    expect(botEventOf('admin', member('left', 'group'))).toBeUndefined();
  });

  it('never keeps free text: an odd command becomes "other", a plain message is no event', () => {
    expect(botEventOf('passenger', message('/+998901234567'))?.code).toBe('other');
    expect(botEventOf('passenger', button('Ali Valiyev'))?.code).toBe('other');
    expect(botEventOf('passenger', message('salom'))).toBeUndefined();
    expect(botEventOf('passenger', message())).toBeUndefined();
  });
});
