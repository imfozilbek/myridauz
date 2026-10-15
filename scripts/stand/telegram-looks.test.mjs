import { describe, expect, it } from 'vitest';
import { standLooks } from './telegram-looks.mjs';

// docs/180: the stub of the stand gives back the look a bot set, like Telegram.
describe('the looks of the stand', () => {
  it('gives back the name the bot of the channels set', () => {
    const looks = standLooks();
    expect(looks('getMyName', '5:c', {}, 1)).toEqual({ name: '' });
    looks('setMyName', '5:c', { name: 'Brend | poster' }, 2);
    expect(looks('getMyName', '5:c', {}, 3)).toEqual({ name: 'Brend | poster' });
  });

  it('keeps a channel by its chat, a number from a form and a text from JSON alike', () => {
    const looks = standLooks();
    looks('setChatPhoto', '5:c', { multipart: true, chat_id: -100123 }, 7);
    looks('setChatTitle', '5:c', { chat_id: '-100123', title: 'Kanal' }, 8);
    expect(looks('getChat', '5:c', { chat_id: '-100123' }, 9)).toEqual({
      id: '-100123',
      title: 'Kanal',
      photo: { big_file_unique_id: 'stand-photo-7' },
    });
    expect(looks('sendMessage', '5:c', { chat_id: '-100123' }, 10)).toBeUndefined();
  });
});
