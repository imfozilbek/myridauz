import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../test-shell';
import { useScreenView } from './analytics-context';
import { useBrand } from './brand-context';
import { LanguageSwitcher, useI18n } from './i18n-context';

describe('contexts', () => {
  it('hides the language switcher while one language is enabled', () => {
    const { container } = renderInShell(<LanguageSwitcher />);
    expect(container.textContent).toBe('');
  });

  it('shows the language switcher when a second language appears', () => {
    renderInShell(<LanguageSwitcher locales={['uz-Latn', 'uz-Latn']} />);
    expect(screen.getByText('Til')).toBeTruthy();
    screen.getAllByText(/lotin/i)[0]?.click();
  });

  it.each([
    ['ui.brand_missing', () => useBrand()],
    ['ui.i18n_missing', () => useI18n()],
    ['ui.analytics_missing', () => useScreenView('home')],
  ])('fails with %s outside the shell', (code, hook) => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const Probe = () => {
      hook();
      return null;
    };
    expect(() => render(<Probe />)).toThrow(code);
  });
});
