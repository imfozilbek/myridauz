import { ApiError } from '@platform/api-client';
import type { Channel, Location } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tap } from '../market/market-test-kit';
import { ManagementScreen } from '../pricing/management-screen';
import { renderInShell, testClients } from '../test-shell';
import { kmBetween, withNear } from './near';

afterEach(cleanup);

const field = (index: number) => screen.getAllByRole('textbox')[index] as HTMLElement;

const place = (id: string, parentId: string | null, name: string, lat: number, lng: number): Location => ({
  id,
  parentId,
  type: parentId === null ? 'region' : 'district',
  name,
  lat,
  lng,
  oneCity: false,
});
const REGION = place('1710', null, 'Qashqadaryo viloyati', 38.8, 66);
const KITOB = place('1710224', '1710', 'Kitob', 39.12, 66.88);
const SHAHRISABZ = place('1710245', '1710', 'Shahrisabz', 39.06, 66.83);
const QARSHI = place('1710401', '1710', 'Qarshi', 38.86, 65.79);
const LOCATIONS = [REGION, KITOB, SHAHRISABZ, QARSHI];
const fixed: Channel = {
  username: 'ch_qashqadaryo',
  title: 'Qashqadaryo viloyati',
  places: ['1710'],
  fixed: true,
};
const kitob: Channel = { username: 'ch_kitob', title: 'Kanal | Kitob', places: ['1710224'], fixed: false };

function setup(list: Channel[], save = vi.fn(async () => kitob)) {
  const channels = { list: vi.fn(async () => list), save, remove: vi.fn(async () => undefined) };
  const locations = { getLocations: async () => ({ version: '1', locations: LOCATIONS }) };
  renderInShell(
    <ManagementScreen onBack={() => undefined} />,
    false,
    true,
    locations,
    testClients({ channels }),
  );
  return channels;
}

describe('Kanallar: the channels of the team (docs/63)', () => {
  it('counts neighbours in a straight line and adds only the close districts', () => {
    expect(kmBetween(KITOB, SHAHRISABZ)).toBeLessThan(10);
    expect(withNear([KITOB], LOCATIONS)).toEqual(['1710224', '1710245']);
    expect(withNear([REGION], LOCATIONS)).toEqual(['1710']);
  });

  it('adds a district channel with its close districts', async () => {
    const channels = setup([fixed]);
    await tap('Kanallar');
    expect(await screen.findByText('Hozircha tuman kanallari yoʻq.')).toBeTruthy();
    expect(screen.getByText('@ch_qashqadaryo · Asosiy kanal')).toBeTruthy();
    await tap('Kanal qoʻshish');
    fireEvent.change(field(0), { target: { value: '@ch_kitob' } });
    fireEvent.change(field(1), { target: { value: 'Kanal | Kitob' } });
    await tap('Qashqadaryo viloyati');
    await tap('Kitob');
    await tap('Yaqin tumanlarni qoʻshish');
    await tap('Saqlash');
    expect(channels.save).toHaveBeenCalledWith('ch_kitob', {
      title: 'Kanal | Kitob',
      places: ['1710224', '1710245'],
    });
  });

  it('says when the bot is not an admin of the channel', async () => {
    setup(
      [fixed],
      vi.fn(async () => Promise.reject(new ApiError(422, 'channels.bot_not_admin'))),
    );
    await tap('Kanallar');
    await tap('Kanal qoʻshish');
    fireEvent.change(field(0), { target: { value: 'ch_kitob' } });
    fireEvent.change(field(1), { target: { value: 'Kanal | Kitob' } });
    await tap('Qashqadaryo viloyati');
    await tap('Kitob');
    await tap('Saqlash');
    expect(await screen.findByText(/Bot bu kanalda administrator emas/u)).toBeTruthy();
  });

  it('changes the places of a channel and removes it', async () => {
    const channels = setup([fixed, kitob]);
    await tap('Kanallar');
    await tap('Kanal | Kitob');
    await tap('Kitob');
    await tap('Qashqadaryo viloyati');
    await tap('Qarshi');
    await tap('Saqlash');
    expect(channels.save).toHaveBeenCalledWith('ch_kitob', { title: 'Kanal | Kitob', places: ['1710401'] });
    // Back on the list after the save: the channel opens again.
    await tap('@ch_kitob · 1 ta joy');
    await tap('Kanalni oʻchirish');
    expect(channels.remove).toHaveBeenCalledWith('ch_kitob');
  });
});
