import { ApiError } from '@platform/api-client';
import type { Company, CompanyState } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tap } from '../market/market-test-kit';
import { ManagementScreen } from '../pricing/management-screen';
import { renderInShell, testClients } from '../test-shell';

afterEach(cleanup);

const company: Company = {
  legalName: 'Yoʻldosh',
  form: 'MChJ',
  stir: '123456789',
  address: 'Toshkent shahri',
  email: 'info@example.uz',
};
// 12:00 in Tashkent on 5 October 2026.
const AT = Date.parse('2026-10-05T07:00:00Z');
const empty: CompanyState = { current: null, history: [], canEdit: true };
const savedOnce: CompanyState = {
  current: { version: 1, company, changedBy: 900, changedAt: AT },
  history: [{ version: 1, company, changedBy: 900, changedAt: AT }],
  canEdit: true,
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
    await tap('Kompaniya rekvizitlari');
    // Nothing entered yet: the offer names the brand.
    expect(await screen.findByText('Ofertada shunday koʻrinadi')).toBeTruthy();
    type('Kompaniya nomi', 'Yoʻldosh');
    type('Shakli (masalan, MChJ)', 'MChJ');
    type('STIR', '12345');
    type('Manzil', 'Toshkent shahri');
    type('Elektron pochta', 'info@example.uz');
    expect(screen.getByText('Yoʻldosh (MChJ, STIR 12345, manzil: Toshkent shahri)')).toBeTruthy();
    await tap('Saqlash');
    expect(screen.getByText('STIR 9 ta raqamdan iborat.')).toBeTruthy();
    expect(save).not.toHaveBeenCalled();
    type('STIR', '123456789');
    await tap('Saqlash');
    expect(save).toHaveBeenCalledWith(company);
    expect(await screen.findByText('Saqlandi. Hujjatlar 1.2 tahririga oʻtdi.')).toBeTruthy();
    expect(screen.getByText('Oʻzgarishlar tarixi')).toBeTruthy();
    expect(screen.getByText('Tahrir 1.2, 5-oktabr 2026')).toBeTruthy();
  });

  it('shows the reason when the API refuses', async () => {
    open(
      savedOnce,
      vi.fn(async () => Promise.reject(new ApiError(403, 'auth.not_owner'))),
    );
    await tap('Kompaniya rekvizitlari');
    await screen.findByLabelText('Manzil');
    type('Manzil', 'Samarqand shahri');
    await tap('Saqlash');
    expect(await screen.findByText('Buni faqat loyiha egasi qila oladi.')).toBeTruthy();
  });

  it('lets a moderator read the requisites without changing them', async () => {
    open({ ...savedOnce, canEdit: false });
    await tap('Kompaniya rekvizitlari');
    const name = await screen.findByLabelText('Kompaniya nomi');
    expect(name).toHaveProperty('disabled', true);
    expect(screen.getByText('Buni faqat loyiha egasi qila oladi.')).toBeTruthy();
    expect(screen.queryByText('Saqlash')).toBeNull();
  });
});
