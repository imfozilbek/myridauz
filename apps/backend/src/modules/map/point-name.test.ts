import { describe, expect, it, vi } from 'vitest';
import { whereIs } from './application/point-name';
import { districtBorders } from './infrastructure/district-borders';
import { districtName } from './infrastructure/district-names';
import { memoryPlaceIndex } from './infrastructure/memory-place-index';
import type { PlaceRow } from './infrastructure/place-rows';
import { placeRow } from './test-kit';

// Chorsu, Tashkent: Shayxontohur by the borders. A metre is about 1e-5 of a degree of latitude.
const CHORSU = { lat: 41.3265, lng: 69.2347 };
const SHAYXONTOHUR = '1726277';
const north = (metres: number) => ({ lat: CHORSU.lat + metres / 111_320, lng: CHORSU.lng });
const where = (rows: PlaceRow[], point = CHORSU) => {
  const index = memoryPlaceIndex(rows);
  const around = vi.spyOn(index, 'around');
  return { around, answer: whereIs({ index, borders: districtBorders(), districtName }, point) };
};

describe('the name of a point: the ladder of docs/69 (G24)', () => {
  it('names the landmark a person names first, within 150 m: a bazaar before a pharmacy', async () => {
    const rows = [
      placeRow('Dorixona', 'health', north(20)),
      placeRow('Chorsu bozori', 'market', north(90)),
      placeRow('Uzoq bozor', 'market', north(400)),
    ];
    expect(await where(rows).answer).toEqual({
      district: SHAYXONTOHUR,
      name: { step: 'landmark', name: 'Chorsu bozori' },
    });
  });

  it('takes the mahalla within 500 m when no landmark is close, then the street within 150 m', async () => {
    const street = placeRow('Navoiy koʻchasi', 'street', north(100));
    const mahalla = placeRow('Chorsu mahallasi', 'mahalla', north(450));
    expect((await where([street, mahalla]).answer).name).toEqual({
      step: 'mahalla',
      name: 'Chorsu mahallasi',
    });
    expect((await where([street]).answer).name).toEqual({ step: 'street', name: 'Navoiy koʻchasi' });
  });

  it('takes the settlement within 3 km, else the district, and reads the index twice at most', async () => {
    const village = placeRow('Qoʻshtepa', 'settlement', north(2500));
    const near = where([village]);
    expect((await near.answer).name).toEqual({ step: 'settlement', name: 'Qoʻshtepa' });
    expect(near.around).toHaveBeenCalledTimes(2);
    const far = await where([placeRow('Uzoq qishloq', 'settlement', north(3500))]).answer;
    expect(far).toEqual({ district: SHAYXONTOHUR, name: { step: 'district', name: 'Shayxontohur' } });
  });

  it('knows no district and no name abroad, without reading the index', async () => {
    const abroad = where([], { lat: 43.2389, lng: 76.8897 });
    expect(await abroad.answer).toEqual({ district: null, name: null });
    expect(abroad.around).not.toHaveBeenCalled();
  });
});
