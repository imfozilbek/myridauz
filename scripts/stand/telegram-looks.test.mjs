import { describe, expect, it } from 'vitest';
import { standLooks } from './telegram-looks.mjs';

// docs/180: the stub of the stand gives back the look a bot set, like Telegram.
describe('the looks of the stand', () => {
  it('gives back the name and the photo a bot set', () => {
    const looks = standLooks();
    expect(looks('getMyName', '1:p', {}, 1)).toEqual({ name: '' });
    looks('setMyName', '1:p', { name: 'Brend | yoʻlovchi' }, 2);
    looks('setMyProfilePhoto', '1:p', { multipart: true }, 3);
    expect(looks('getMyName', '1:p', {}, 4)).toEqual({ name: 'Brend | yoʻlovchi' });
    expect(looks('getUserProfilePhotos', '1:p', { user_id: 1 }, 5)).toEqual({
      total_count: 1,
      photos: [[{ file_unique_id: 'stand-photo-3' }]],
    });
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
