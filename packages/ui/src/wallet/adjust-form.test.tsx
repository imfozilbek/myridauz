import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../test-shell';
import { AdjustForm } from './adjust-form';

const asked = vi.spyOn(window, 'confirm');
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const tap = (text: string) => act(async () => fireEvent.click(screen.getByText(text, { exact: true })));

// A hand correction of a wallet (docs/12, G78 sheet 4, G49): «Saqlash» waits for a reason of 3 letters
// at least; «Orqaga» out of a touched form asks first, out of an untouched one leaves at once.
describe('the hand correction of a wallet', () => {
  const form = (onBack = vi.fn(), onSave = vi.fn()) => {
    renderInShell(
      <AdjustForm current={{ bonus: 0, main: 10_000 }} error={null} onBack={onBack} onSave={onSave} />,
    );
    return { onBack, onSave };
  };

  it('saves only with a reason of 3 letters or more', async () => {
    const { onSave } = form();
    await tap('Asosiy hisob');
    await tap('Qoʻshish');
    fireEvent.change(screen.getByLabelText('Summa, soʻm'), { target: { value: '2000' } });
    await tap('Boshqa');
    fireEvent.change(screen.getByLabelText('Boshqa'), { target: { value: ' ok ' } });
    expect(screen.queryByText('Saqlash')).toBeNull();
    fireEvent.change(screen.getByLabelText('Boshqa'), { target: { value: 'Naqd' } });
    await tap('Saqlash');
    expect(onSave).toHaveBeenCalledWith({ balance: 'main', amount: 2000, reason: 'Naqd' });
  });

  it('leaves an untouched form at once and asks before leaving a touched one', async () => {
    const { onBack } = form();
    await tap('Orqaga');
    expect(onBack).toHaveBeenCalledOnce();
    expect(asked).not.toHaveBeenCalled();
    await tap('Ayirish');
    asked.mockReturnValueOnce(false);
    await tap('Orqaga');
    expect(asked).toHaveBeenCalledWith('Oʻzgarishlar saqlanmaydi. Chiqasizmi?');
    expect(onBack).toHaveBeenCalledOnce();
  });
});
