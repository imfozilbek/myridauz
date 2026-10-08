import { loadBrand } from '@platform/brands';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInShell, testClients } from '../test-shell';
import { LegalGate } from './legal-gate';
import { LegalScreen } from './legal-screen';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

describe('legal documents (docs/30)', () => {
  it('shows a document with its edition and the numbers of the brand', async () => {
    const brand = loadBrand();
    renderInShell(<LegalScreen document="offer" onBack={vi.fn()} />);
    expect(screen.getByText('Ommaviy oferta')).toBeTruthy();
    // Without an answer of the API: the base edition and the brand name, never a placeholder (G34).
    expect(await screen.findByText(/Tahrir 1\.3/)).toBeTruthy();
    // Each section opens by its title: the needed point is found faster (docs/88 L18).
    const first = screen.getByText('1. Umumiy qoidalar').closest('[aria-expanded]');
    expect(first?.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(screen.getByText('1. Umumiy qoidalar'));
    expect(first?.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText(new RegExp(`${brand.commission.percent} foizi`))).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/\{/u);
  });

  it('takes the requisites and the edition the owner saved (G34)', async () => {
    const company = {
      legalName: 'Yoʻldosh Servis',
      form: 'MChJ',
      stir: '123456789',
      address: 'Toshkent shahri',
      email: 'info@example.uz',
    };
    const current = async () => ({ company, edition: { version: '1.2', date: '2026-10-05' } });
    renderInShell(
      <LegalScreen document="privacy" onBack={vi.fn()} />,
      false,
      true,
      undefined,
      testClients({ company: { current } }),
    );
    expect(await screen.findByText(/Tahrir 1\.2/)).toBeTruthy();
    fireEvent.click(screen.getByText(/^1\. /u));
    expect(
      screen.getByText(/Yoʻldosh Servis \(MChJ, STIR 123456789, manzil: Toshkent shahri\)/u),
    ).toBeTruthy();
  });

  it('opens a document from a bot link before anything else, then the app', () => {
    window.history.replaceState(null, '', '/?doc=privacy');
    renderInShell(
      <LegalGate>
        <p>inside</p>
      </LegalGate>,
    );
    expect(screen.getByText('Maxfiylik siyosati')).toBeTruthy();
    fireEvent.click(screen.getByText('Orqaga'));
    expect(screen.getByText('inside')).toBeTruthy();
    expect(window.location.search).toBe('');
  });

  it('ignores an unknown document in the link', () => {
    window.history.replaceState(null, '', '/?doc=other');
    renderInShell(
      <LegalGate>
        <p>inside</p>
      </LegalGate>,
    );
    expect(screen.getByText('inside')).toBeTruthy();
  });
});
