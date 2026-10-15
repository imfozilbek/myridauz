import { describe, expect, it } from 'vitest';
import { keepLooks, uncheckedSince, type Face, type LooksDeps } from './application/looks';
import type { Look, Seen, TextPart } from './domain/look';
import { createMemoryLooks } from './infrastructure/d1-looks';

const NOW = Date.parse('2026-10-13T19:30:00Z');
const HOUR = 60 * 60 * 1000;
const LOOK: Look = { name: 'Brend | Boʻka', description: 'Safarlar', avatar: 'https://site.uz/a.jpg' };
const NOTHING: Seen = { name: null, description: null, photo: null };

// A face of Telegram in memory: what it shows now, and every call that changed it.
function fakeFace(key: string, seen: Seen, cost = 6) {
  const set: string[] = [];
  let shown = seen;
  let photos = 0;
  const face: Face = {
    key,
    look: LOOK,
    cost,
    read: async () => shown,
    write: async (part: TextPart, text: string) => {
      set.push(part);
      shown = { ...shown, [part]: text };
    },
    photo: async () => {
      set.push('photo');
      photos += 1;
      shown = { ...shown, photo: `made-${photos}` };
      return shown.photo;
    },
  };
  return { face, set, change: (next: Partial<Seen>) => (shown = { ...shown, ...next }) };
}

function setup(faces: readonly Face[], file = 'v1') {
  let picture = file;
  const deps: LooksDeps = {
    faces,
    store: createMemoryLooks(),
    picture: () => new Response(picture).arrayBuffer(),
    hash: async (bytes) => new TextDecoder().decode(bytes),
    now: () => NOW,
  };
  return { deps, newFile: (next: string) => (picture = next) };
}

// docs/180: Telegram comes to the repository, and only what differs is set.
describe('the looks of the channels', () => {
  it('sets the texts and the picture a face lacks, then leaves a face like the repository alone', async () => {
    const channel = fakeFace('channel:@a', NOTHING);
    const { deps } = setup([channel.face]);
    await keepLooks(deps, 24);
    expect(channel.set).toEqual(['name', 'description', 'photo']);
    await keepLooks(deps, 24);
    expect(channel.set).toEqual(['name', 'description', 'photo']);
  });

  it('takes the photo a channel has the first time: a new one writes to all its people', async () => {
    const channel = fakeFace('channel:@a', { ...NOTHING, name: LOOK.name, photo: 'by-hand' });
    const { deps } = setup([channel.face]);
    await keepLooks(deps, 24);
    expect(channel.set).toEqual(['description']);
    expect((await deps.store.rows())[0]?.memory).toEqual({ hash: 'v1', photo: 'by-hand' });
  });

  it('sets only the name of the bot of the channels: it has no picture', async () => {
    const poster = fakeFace('bot:poster', { ...NOTHING, photo: 'own' });
    const { key, cost, read, write } = poster.face;
    const { deps } = setup([{ key, cost, read, write, look: { name: 'Brend | poster' } }]);
    await keepLooks(deps, 24);
    expect(poster.set).toEqual(['name']);
    expect((await deps.store.rows())[0]?.memory).toBeNull();
  });

  it('sets the photo again for a new file of the repository and for a photo changed by hand', async () => {
    const channel = fakeFace('channel:@a', NOTHING);
    const { deps, newFile } = setup([channel.face]);
    await keepLooks(deps, 24);
    newFile('v2');
    await keepLooks(deps, 24);
    channel.change({ photo: 'by-hand', name: 'Boshqa' });
    await keepLooks(deps, 24);
    expect(channel.set).toEqual(['name', 'description', 'photo', 'photo', 'name', 'photo']);
    expect((await deps.store.rows())[0]?.memory).toEqual({ hash: 'v2', photo: 'made-3' });
  });

  it('checks the faces checked the longest ago while the calls of the run last', async () => {
    const faces = ['a', 'b', 'c', 'd'].map((key) => fakeFace(key, NOTHING, 10));
    const { deps } = setup(faces.map(({ face }) => face));
    await deps.store.save({ key: 'a', checkedAt: NOW - HOUR, memory: null });
    expect(await keepLooks(deps, 24)).toEqual(['b', 'c']);
    expect(await uncheckedSince(deps, NOW)).toBe(2);
    expect(await keepLooks(deps, 24)).toEqual(['d', 'a']);
    expect(await uncheckedSince(deps, NOW)).toBe(0);
  });

  it('goes on after a face it may not change, and tries it again in the next round', async () => {
    const locked = fakeFace('channel:@locked', NOTHING);
    const open = fakeFace('channel:@open', NOTHING);
    const failing: Face = {
      ...locked.face,
      write: async () => Promise.reject(new Error('telegram.setChatTitle_400')),
    };
    const { deps } = setup([failing, open.face]);
    expect(await keepLooks(deps, 24)).toEqual(['channel:@locked', 'channel:@open']);
    expect(open.set).toEqual(['name', 'description', 'photo']);
    expect((await deps.store.rows()).map((row) => row.key)).toEqual(['channel:@locked', 'channel:@open']);
  });
});
