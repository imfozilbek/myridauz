import { toCyrillic } from '@platform/i18n';
import { loadBrand } from '@platform/brands';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sheetClosed } from '../home/sheet-closed';
import { tap } from '../market/market-test-kit';
import { CARD, MEMBERS, PERSON, renderManagement } from './manage-test-kit';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// «Boshqaruv» of the owner in 4 groups (G75, docs/120, mockup g67/2 screen 6).
describe('«Boshqaruv»', () => {
  it('has the 4 groups with the live lines of the day', async () => {
    renderManagement();
    expect(screen.getByText(toCyrillic('Faqat egasi koʻradi'))).toBeTruthy();
    for (const group of [
      ...['Odamlar va safarlar', 'Pul', 'Joylar'].map((name) => toCyrillic(name)),
      loadBrand().name,
    ])
      expect(screen.getByText(group)).toBeTruthy();
    expect(await screen.findByText(toCyrillic('Bugun 17 ta'))).toBeTruthy();
    expect(await screen.findByText(toCyrillic('3 tasida pul kam'))).toBeTruthy();
    expect(await screen.findByText(/^2 та · 41\s200 обуначи$/u)).toBeTruthy();
    expect(await screen.findByText(toCyrillic('64 ta'))).toBeTruthy();
    expect(await screen.findByText(toCyrillic('1 moderator'))).toBeTruthy();
  });

  // The values on the right; «Bloklash» at the bottom, the days in a sheet (G78 sheet 6).
  it('opens a person by the public id in «Odamlar» and blocks for 7 days', async () => {
    const block = vi.fn(async () => undefined);
    renderManagement({ moderation: { block, blocks: async () => ({ active: null, entries: [] }) } });
    await tap(toCyrillic('Odamlar'));
    const field = screen.getByLabelText(toCyrillic('ID raqami'));
    fireEvent.change(field, { target: { value: 'nope' } });
    expect(screen.getByText(toCyrillic('Ochish')).closest('button')?.disabled).toBe(true);
    fireEvent.change(field, { target: { value: PERSON.toUpperCase() } });
    await tap(toCyrillic('Ochish'));
    expect(await screen.findByText(toCyrillic('Haydovchi: 5 · yoʻlovchi: 2'))).toBeTruthy();
    expect(screen.getByText(/4,8 \(37 та баҳо\)/u)).toBeTruthy();
    expect(screen.getByText('01 A 123 BC').className).toBe('manage-value');
    expect(await screen.findByText(toCyrillic('Hech qachon bloklanmagan'))).toBeTruthy();
    await tap(toCyrillic('Bloklash'));
    expect(await screen.findByText(toCyrillic('Qancha muddatga bloklaymiz?'))).toBeTruthy();
    await tap(toCyrillic('7 kun'));
    await waitFor(() => expect(block).toHaveBeenCalledWith(CARD.id, 7));
    await sheetClosed();
  });

  // G91 ADM-6: the block changes the whole card: «Bloklar tarixi» under it too.
  it('a block shows in «Bloklar tarixi» at once', { timeout: 20_000 }, async () => {
    const WEEK = Date.parse('2026-10-27T05:00:00Z');
    const blocks = vi
      .fn()
      .mockResolvedValueOnce({ active: null, entries: [] })
      .mockResolvedValue({
        active: { until: WEEK },
        entries: [{ until: WEEK, reason: 'admin', by: 'Ali', at: 1 }],
      });
    const block = vi.fn(async () => undefined);
    const person = vi
      .fn()
      .mockResolvedValueOnce(CARD)
      .mockResolvedValue({ ...CARD, blocked: true, blockedUntil: WEEK });
    renderManagement({ moderation: { block, blocks }, team: { person } });
    await tap(toCyrillic('Odamlar'));
    fireEvent.change(screen.getByLabelText(toCyrillic('ID raqami')), { target: { value: PERSON } });
    await tap(toCyrillic('Ochish'));
    expect(await screen.findByText(toCyrillic('Hech qachon bloklanmagan'))).toBeTruthy();
    await tap(toCyrillic('Bloklash'));
    await tap(toCyrillic('7 kun'));
    expect(await screen.findByText(/^Ҳозир .+гача блокланган$/u)).toBeTruthy();
  });

  it('adds a moderator by the public id in «Jamoa» and removes one', async () => {
    const add = vi.fn(async () => undefined);
    const remove = vi.fn(async () => undefined);
    renderManagement({ team: { members: async () => MEMBERS, add, remove } });
    await tap(toCyrillic('Jamoa'));
    expect(await screen.findByText(toCyrillic('Egasi'))).toBeTruthy();
    fireEvent.change(screen.getByLabelText(toCyrillic('ID yoki Telegram ID raqami')), {
      target: { value: PERSON },
    });
    await tap(toCyrillic('Qoʻshish'));
    await waitFor(() => expect(add).toHaveBeenCalledWith(PERSON));
    vi.stubGlobal('confirm', () => true);
    await tap('Aziz');
    await waitFor(() => expect(remove).toHaveBeenCalledWith(MEMBERS.members[1]?.id));
  });

  // G84: the colleague sends the owner the Telegram ID; the field takes it as it is.
  it('adds a moderator by the Telegram ID in «Jamoa»', async () => {
    const add = vi.fn(async () => undefined);
    renderManagement({ team: { members: async () => MEMBERS, add, remove: vi.fn() } });
    await tap(toCyrillic('Jamoa'));
    fireEvent.change(await screen.findByLabelText(toCyrillic('ID yoki Telegram ID raqami')), {
      target: { value: ' 123456789 ' },
    });
    await tap(toCyrillic('Qoʻshish'));
    await waitFor(() => expect(add).toHaveBeenCalledWith('123456789'));
  });
});
