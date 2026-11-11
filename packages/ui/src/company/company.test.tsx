import { toCyrillic } from '@platform/i18n';
import { ApiError } from '@platform/api-client';
import type { Company, CompanyState } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tap } from '../market/market-test-kit';
import { ManagementScreen } from '../manage/management-screen';
import { renderInShell, testClients } from '../test-shell';

const asked = vi.spyOn(window, 'confirm');
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const company: Company = {
  legalName: 'Yoʻldosh',
  form: 'MChJ',
  stir: '123456789',
  address: 'Toshkent shahri',
  email: 'info@example.uz',
};
// 12:00 in Tashkent on 20 October 2026, after the base edition.
const AT = Date.parse('2026-10-20T07:00:00Z');
const empty: CompanyState = { current: null, history: [] };
const savedOnce: CompanyState = {
  current: { version: 1, company, changedBy: 'Fozil', changedAt: AT },
  history: [{ version: 1, company, changedBy: 'Fozil', changedAt: AT }],
};

function open(
  state: CompanyState,
  save = vi.fn<(company: Company) => Promise<CompanyState>>(async () => savedOnce),
) {
  renderInShell(
    <ManagementScreen onBack={() => undefined} />,
    false,
    true,
    undefined,
    testClients({ company: { state: async () => state, save } }),
  );
  return save;
}
const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('Kompaniya rekvizitlari (G34, docs/96 T22 … T27)', () => {
  it('saves the five fields after the STIR check and shows the new edition and the history', async () => {
    const save = open(empty);
    await tap(toCyrillic('Hujjatlar va kompaniya'));
    // Nothing entered yet: the offer names the brand.
    expect(await screen.findByText(toCyrillic('Ofertada shunday koʻrinadi'))).toBeTruthy();
    type(toCyrillic('Kompaniya nomi'), 'Yoʻldosh');
    type(toCyrillic('Shakli (masalan, MChJ)'), 'MChJ');
    type(toCyrillic('STIR'), '12345');
    type(toCyrillic('Manzil'), 'Toshkent shahri');
    type(toCyrillic('Elektron pochta'), 'info@example.uz');
    expect(
      screen.getByText(
        `Yoʻldosh (MChJ, ${toCyrillic('STIR')} 12345, ${toCyrillic('manzil')}: Toshkent shahri)`,
      ),
    ).toBeTruthy();
    await tap(toCyrillic('Saqlash'));
    expect(screen.getByText(toCyrillic('STIR 9 ta raqamdan iborat.'))).toBeTruthy();
    expect(save).not.toHaveBeenCalled();
    type(toCyrillic('STIR'), '123456789');
    await tap(toCyrillic('Saqlash'));
    expect(save).toHaveBeenCalledWith(company);
    expect(await screen.findByText(toCyrillic('Saqlandi. Hujjatlar 1.11 tahririga oʻtdi.'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Oʻzgarishlar tarixi'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Tahrir 1.11, 20-oktabr 2026'))).toBeTruthy();
  });

  it('shows the reason when the API refuses', async () => {
    open(
      savedOnce,
      vi.fn(async () => Promise.reject(new ApiError(403, 'auth.not_owner'))),
    );
    await tap(toCyrillic('Hujjatlar va kompaniya'));
    await screen.findByLabelText(toCyrillic('Manzil'));
    type(toCyrillic('Manzil'), 'Samarqand shahri');
    await tap(toCyrillic('Saqlash'));
    expect(await screen.findByText(toCyrillic('Buni faqat loyiha egasi qila oladi.'))).toBeTruthy();
  });

  // G49: a wrong field other than the STIR has the common words; «Orqaga» asks before losing the typing.
  it('names a wrong field and asks before leaving what was typed', async () => {
    const save = open(savedOnce);
    await tap(toCyrillic('Hujjatlar va kompaniya'));
    await screen.findByLabelText(toCyrillic('Elektron pochta'));
    type(toCyrillic('Elektron pochta'), 'pochta emas');
    await tap(toCyrillic('Saqlash'));
    expect(screen.getByText(toCyrillic('Kompaniya rekvizitlarini tekshiring.'))).toBeTruthy();
    expect(save).not.toHaveBeenCalled();
    asked.mockReturnValueOnce(false);
    await tap(toCyrillic('Orqaga'));
    expect(asked).toHaveBeenCalledWith(toCyrillic('Oʻzgarishlar saqlanmaydi. Chiqasizmi?'));
    expect(screen.getByLabelText(toCyrillic('Elektron pochta'))).toBeTruthy();
  });
});
