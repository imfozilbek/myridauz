import { cleanup, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderInShell } from '../test-shell';
import { UzPlate } from './uz-plate';
import { UzPlateInput } from './uz-plate-input';

afterEach(cleanup);

function Field() {
  const [value, setValue] = useState('');
  return <UzPlateInput value={value} label="Davlat raqami" onChange={setValue} />;
}

describe('the Uzbek plate (G62, mockup g62/2-plate)', () => {
  it('shows the region in its own cell, the number and «UZ»', () => {
    const { container } = renderInShell(<UzPlate plate="01A123BC" size="s" />);
    expect(container.querySelector('.uz-plate-region')?.textContent).toBe('01');
    expect(container.querySelector('.uz-plate-number')?.textContent).toBe('A 123 BC');
    expect(container.querySelector('.uz-plate-s')).toBeTruthy();
    expect(screen.getByRole('img', { name: '01 A 123 BC' })).toBeTruthy();
    expect(screen.getByText('UZ')).toBeTruthy();
  });

  it('shows a company plate: three digits and three letters', () => {
    const { container } = renderInShell(<UzPlate plate="10123ABC" />);
    expect(container.querySelector('.uz-plate-number')?.textContent).toBe('123 ABC');
  });

  it('typing without spaces: two digits go to the region, the rest to the number', () => {
    const { container } = renderInShell(<Field />);
    expect(container.querySelector('.uz-plate-region')?.textContent).toBe('01');
    fireEvent.change(screen.getByLabelText('Davlat raqami'), { target: { value: '01a12' } });
    const region = container.querySelector('.uz-plate-region');
    const number = container.querySelector('.uz-plate-number');
    expect(region?.querySelector('.uz-plate-ghost')?.textContent).toBe('');
    expect(number?.textContent).toBe('A 123 BC');
    expect(number?.querySelector('.uz-plate-ghost')?.textContent).toBe('3 BC');
  });
});
