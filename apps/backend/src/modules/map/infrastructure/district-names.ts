import places from '../../../../seed/locations.json' with { type: 'json' };

// The names of districts and cities from the directory (docs/48): the last step of the ladder.
const names = new Map(places.map((place) => [place.id, place.name]));

export const districtName = (id: string) => names.get(id);
