import { loadBrand } from '@platform/brands';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConsentStep } from '../account/registration/consent-step';
import { renderInShell } from '../test-shell';
import { LegalGate } from './legal-gate';
import { LegalScreen } from './legal-screen';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

describe('legal documents (docs/30)', () => {
  it('shows a document with its edition and the numbers of the brand', () => {
    const brand = loadBrand();
    renderInShell(<LegalScreen document="offer" onBack={vi.fn()} />);
    expect(screen.getByText('Ommaviy oferta')).toBeTruthy();
    expect(screen.getByText(/Tahrir 1\.0/)).toBeTruthy();
    // Each section opens by its title: the needed point is found faster (docs/88 L18).
    const first = screen.getByText('1. Umumiy qoidalar').closest('[aria-expanded]');
    expect(first?.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(screen.getByText('1. Umumiy qoidalar'));
    expect(first?.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText(new RegExp(`${brand.commission.percent} foizi`))).toBeTruthy();
    expect(screen.getAllByText(new RegExp(brand.company.stir)).length).toBeGreaterThan(0);
  });

  it('opens each document from the consent step and comes back to it', () => {
    const accept = vi.fn();
    renderInShell(<ConsentStep onAccept={accept} />);
    fireEvent.click(screen.getByText('Shaxsga doir maʼlumotlarni qayta ishlashga rozilik'));
    expect(screen.getByText(/OʻRQ-547/)).toBeTruthy();
    fireEvent.click(screen.getByText('Orqaga'));
    fireEvent.click(screen.getByText('Roziman'));
    expect(accept).toHaveBeenCalled();
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
