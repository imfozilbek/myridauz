import { loadBrand } from '@platform/brands';
import { AppShell } from '@platform/ui';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StartPage } from './start-page';

describe('StartPage', () => {
  it('shows the brand and the start text', () => {
    const brand = loadBrand();
    render(
      <AppShell brand={brand}>
        <StartPage />
      </AppShell>,
    );
    expect(screen.getByText(brand.name)).toBeTruthy();
    expect(screen.getByText(`${brand.name} jamoasi uchun`)).toBeTruthy();
  });
});
