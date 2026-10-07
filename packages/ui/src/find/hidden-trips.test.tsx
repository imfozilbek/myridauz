import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderMarket, trip } from '../market/market-test-kit';
import { NO_FILTERS } from '../market/trip-filters';
import { testClients } from '../test-shell';
import { HiddenTrips } from './hidden-trips';

afterEach(cleanup);

const withSeats = (seatsLeft: number, id: string) => ({ ...trip, id, seatsLeft });

describe('the trips «Necha kishi?» hid (G59, mockup screen 5)', () => {
  it('counts them by their free seats', () => {
    const trips = [withSeats(1, 'a'), withSeats(1, 'b'), withSeats(2, 'c'), withSeats(3, 'd')];
    renderMarket(<HiddenTrips trips={trips} filters={{ ...NO_FILTERS, seats: 3 }} />, testClients({}));
    expect(screen.getByText('1 joyli 2 ta safar yashirildi')).toBeTruthy();
    expect(screen.getByText('2 joyli 1 ta safar yashirildi')).toBeTruthy();
  });

  it('says nothing when the people fit every trip', () => {
    renderMarket(<HiddenTrips trips={[withSeats(3, 'a')]} filters={NO_FILTERS} />, testClients({}));
    expect(screen.queryByText(/yashirildi/u)).toBeNull();
  });
});
