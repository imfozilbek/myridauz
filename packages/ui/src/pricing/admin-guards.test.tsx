import type { Direction } from '@platform/contracts';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChannelEdit } from '../channels/channel-edit';
import { PitakEdit } from '../pitaks/pitak-edit';
import { buildDirectory } from '../places/directory';
import { locations } from '../market/market-test-kit';
import { PlacesGate } from '../market/places-gate';
import { renderInShell } from '../test-shell';
import { AdjustForm } from '../wallet/adjust-form';
import { DirectionEdit } from './direction-edit';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const UNSAVED = 'Oʻzgarishlar saqlanmaydi. Chiqasizmi?';
const directory = buildDirectory([]);
const direction: Direction = {
  from: '1726',
  to: '1730',
  km: 320,
  formula: 95000,
  manual: null,
  median: null,
  medianTrips: 0,
};
type Form = (onBack: () => void) => ReactNode;
const FORMS: [string, Form][] = [
  [
    'a direction price',
    (onBack) => <DirectionEdit direction={direction} failed={null} onBack={onBack} onSave={vi.fn()} />,
  ],
  ['a channel', (onBack) => <ChannelEdit channel={null} directory={directory} onBack={onBack} />],
  [
    'a pitak',
    (onBack) => <PitakEdit pitak={null} start={{ lat: 41, lng: 69 }} directory={directory} onBack={onBack} />,
  ],
  [
    'a wallet correction',
    (onBack) => <AdjustForm current={{ main: 0, bonus: 0 }} error={null} onBack={onBack} onSave={vi.fn()} />,
  ],
];
const back = async () => {
  const button = await screen.findByText('Orqaga');
  await act(async () => fireEvent.click(button));
};

describe('an admin form asks before Back loses what was typed (docs/94 F3)', () => {
  it.each(FORMS)('%s: untouched leaves at once, typed asks and stays on «no»', async (_name, form) => {
    const asked = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const onBack = vi.fn();
    const shown = (ui: ReactNode) => renderInShell(<PlacesGate>{ui}</PlacesGate>, false, true, locations);
    const untouched = shown(form(onBack));
    await back();
    expect(onBack).toHaveBeenCalledOnce();
    untouched.unmount();
    onBack.mockClear();
    shown(form(onBack));
    await screen.findByText('Orqaga');
    const input = document.querySelector('input:not([type=checkbox])');
    fireEvent.change(input as HTMLInputElement, { target: { value: '12345' } });
    await back();
    expect(asked).toHaveBeenCalledWith(UNSAVED);
    expect(onBack).not.toHaveBeenCalled();
  });
});
