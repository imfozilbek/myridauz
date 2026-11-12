import { toCyrillic } from '@platform/i18n';
import { loadBrand } from '@platform/brands';
import { HELP_TOPICS, helpQuestions } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { approved } from '../account/profile/profile-test-kit';
import { DriverContext } from '../driver/driver-context';
import { renderInShell } from '../test-shell';
import { HelpScreen } from './help-screen';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const brand = loadBrand();
const LEAD = toCyrillic('Javobni shu yerdan toping yoki jamoamizga yozing.');
// Outside Telegram the screen draws its own «Orqaga»: the rows of the page come after it.
const rows = () =>
  screen
    .getAllByRole('button')
    .map((one) => one.textContent ?? '')
    .filter((text) => text !== toCyrillic('Orqaga'));

// G97 (docs/226): «Yordam» of the Mini Apps, the same list and words as the bots and the site.
describe('«Yordam»', () => {
  it('shows «Boshqa savolim bor» on top and the topics of a passenger, trips first', () => {
    renderInShell(<HelpScreen onBack={() => undefined} />);
    expect(screen.getByText(LEAD)).toBeTruthy();
    expect(
      rows()
        .slice(0, 5)
        .map((row) => row.split(toCyrillic('Jamoamiz'))[0]),
    ).toEqual([
      toCyrillic('Boshqa savolim bor'),
      toCyrillic('Safar topish'),
      toCyrillic('Joy band qilish'),
      toCyrillic('Haydovchi boʻlish'),
      toCyrillic('Hisob va xavfsizlik'),
    ]);
    expect(
      screen.getByText(toCyrillic('Jamoamiz har kuni soat 07:00 dan 23:00 gacha javob beradi')),
    ).toBeTruthy();
  });

  // A passenger has no wallet (owner decision 12.11.2026): only a driver sees it, with no trips topics.
  it('a driver sees the wallet, an answer with the numbers of the brand, and goes back step by step', () => {
    const back = vi.fn();
    const { tracked } = renderInShell(
      <DriverContext.Provider value={approved}>
        <HelpScreen onBack={back} />
      </DriverContext.Provider>,
    );
    expect(rows().slice(1)).toEqual(
      ['Haydovchi boʻlish', 'Hamyon va komissiya', 'Hisob va xavfsizlik'].map((one) => toCyrillic(one)),
    );
    fireEvent.click(screen.getByText(toCyrillic('Hamyon va komissiya')));
    expect(screen.getByText(toCyrillic('Yoʻlovchi kelmasa, komissiya qaytadimi?'))).toBeTruthy();
    fireEvent.click(screen.getByText(toCyrillic('Haydovchi uchun qancha turadi?')));
    expect(
      screen.getByText(
        new RegExp(`${toCyrillic('narxining')} ${brand.commission.percent} ${toCyrillic('foizi')}`, 'u'),
      ),
    ).toBeTruthy();
    expect(tracked.filter((one) => one.name === 'help_open')).toEqual([
      { name: 'help_open', screen: 'help', code: 'wallet' },
      { name: 'help_open', screen: 'help', code: 'wallet.fee' },
    ]);
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    fireEvent.click(screen.getByText(toCyrillic('Boshqa savolim bor')));
    expect(open.mock.calls[0]?.[0]).toBe(`https://t.me/${brand.bots.support}`);
    expect(tracked.at(-1)).toEqual({ name: 'help_more', screen: 'help', code: 'wallet.fee' });
    expect(back).not.toHaveBeenCalled();
  });

  it('opened on a topic, «Назад» leaves at once', () => {
    renderInShell(<HelpScreen help="driver" onBack={() => undefined} />);
    expect(screen.getByText(toCyrillic('Arizam qaytarildi. Nima qilaman?'))).toBeTruthy();
    expect(screen.queryByText(LEAD)).toBeNull();
  });

  it('every answer is filled: no braces are left', () => {
    for (const topic of HELP_TOPICS)
      for (const question of helpQuestions(topic)) {
        renderInShell(<HelpScreen help={topic} onBack={() => undefined} />);
        const row = screen.getAllByRole('button').filter((one) => one.textContent !== 'Orqaga')[
          helpQuestions(topic).indexOf(question)
        ];
        fireEvent.click(row as HTMLElement);
        expect(screen.queryByText(LEAD)).toBeNull();
        expect(document.body.textContent).not.toMatch(/[{}]/u);
        cleanup();
      }
  });
});
