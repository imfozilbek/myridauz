import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket } from './market-test-kit';
import { TripRuleStep } from './trip-rule-step';

afterEach(cleanup);

const open = () => {
  const { container } = renderMarket(
    <TripRuleStep model="Cobalt" seats={4} price={90_000} onBack={() => undefined} onDone={vi.fn()} />,
  );
  return { container };
};

describe('«Qanday band qilinadi?» as the mockup 2-whole-car screen 1 (G61)', () => {
  it('names the car, the seats and the price of a seat under the title', async () => {
    open();
    expect(await screen.findByText(/^Cobalt · 4 ta joy · bir joy 90.000/)).toBeTruthy();
  });

  it('shows the three rules as cards with a radio, seats only chosen first', async () => {
    const { container } = open();
    await screen.findByText('Faqat joylar');
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(container.querySelectorAll('.rule-card')).toHaveLength(3);
    expect((radios[0] as HTMLInputElement).checked).toBe(true);
    expect(container.querySelector('.rule-card-on')?.textContent).toContain('Faqat joylar');
  });

  it('a tap anywhere on a card chooses it', async () => {
    const { container } = open();
    fireEvent.click(await screen.findByText('Joylar yoki butun salon'));
    expect(container.querySelector('.rule-card-on')?.textContent).toContain('Joylar yoki butun salon');
    expect((screen.getAllByRole('radio')[1] as HTMLInputElement).checked).toBe(true);
  });

  it('shows the price of the whole car under the cards', async () => {
    open();
    expect(await screen.findByText(/Butun salon narxi: 4 joy × 90.000 = 360.000/)).toBeTruthy();
  });
});
