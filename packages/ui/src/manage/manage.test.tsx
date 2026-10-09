import { loadBrand } from '@platform/brands';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
    expect(screen.getByText('Faqat egasi koʻradi')).toBeTruthy();
    for (const group of ['Odamlar va safarlar', 'Pul', 'Joylar', loadBrand().name])
      expect(screen.getByText(group)).toBeTruthy();
    expect(await screen.findByText('Bugun 17 ta')).toBeTruthy();
    expect(await screen.findByText('3 tasida pul kam')).toBeTruthy();
    expect(await screen.findByText(/^2 ta · 41\s200 obunachi$/u)).toBeTruthy();
    expect(await screen.findByText('64 ta')).toBeTruthy();
    expect(await screen.findByText('1 moderator')).toBeTruthy();
  });

  it('opens a person by the public id in «Odamlar» and blocks for 7 days', async () => {
    const block = vi.fn(async () => undefined);
    renderManagement({ moderation: { block, blocks: async () => ({ active: null, entries: [] }) } });
    await tap('Odamlar');
    const field = screen.getByLabelText('ID raqami');
    fireEvent.change(field, { target: { value: 'nope' } });
    expect(screen.getByText('Ochish').closest('button')?.disabled).toBe(true);
    fireEvent.change(field, { target: { value: PERSON.toUpperCase() } });
    await tap('Ochish');
    expect(await screen.findByText('Haydovchi: 5 · yoʻlovchi: 2')).toBeTruthy();
    expect(screen.getByText(/4,8 \(37 ta baho\)/u)).toBeTruthy();
    expect(screen.getByText('01 A 123 BC')).toBeTruthy();
    await tap('Bloklash');
    await tap('7 kun');
    await waitFor(() => expect(block).toHaveBeenCalledWith(CARD.id, 7));
  });

  it('adds a moderator by the public id in «Jamoa» and removes one', async () => {
    const add = vi.fn(async () => undefined);
    const remove = vi.fn(async () => undefined);
    renderManagement({ team: { members: async () => MEMBERS, add, remove } });
    await tap('Jamoa');
    expect(await screen.findByText('Egasi')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('ID raqami'), { target: { value: PERSON } });
    await tap('Qoʻshish');
    await waitFor(() => expect(add).toHaveBeenCalledWith(PERSON));
    vi.stubGlobal('confirm', () => true);
    await tap('Aziz');
    await waitFor(() => expect(remove).toHaveBeenCalledWith(MEMBERS.members[1]?.id));
  });
});
