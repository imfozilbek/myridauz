import { loadBrand } from '@platform/brands';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from './app-shell';
import { Search } from './icons';
import { StartScreen } from './start-screen';

describe('StartScreen', () => {
  it('shows the brand name and the description', () => {
    const brand = loadBrand();
    render(
      <AppShell brand={brand}>
        <StartScreen icon={Search} description="Tavsif" />
      </AppShell>,
    );
    expect(screen.getByText(brand.name)).toBeTruthy();
    expect(screen.getByText('Tavsif')).toBeTruthy();
  });

  it('needs a brand around it', () => {
    // React logs the expected error; keep the test output clean.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<StartScreen icon={Search} description="Tavsif" />)).toThrow('ui.brand_missing');
  });
});
