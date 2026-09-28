import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon } from './icons';

describe('Icon', () => {
  it('draws the icon for a meaning', () => {
    const { container } = render(<Icon name="trip" size={20} />);
    expect(container.querySelector('svg')?.getAttribute('width')).toBe('20');
  });
});
