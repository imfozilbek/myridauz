import places from '../../../../seed/locations.json' with { type: 'json' };

// The names and the regions of districts and cities from the directory (docs/48): the last step
// of the ladder and the region of a pitak (G24).
const byId = new Map(places.map((place) => [place.id, place]));

export const districtName = (id: string) => byId.get(id)?.name;
export const regionOfDistrict = (id: string) => byId.get(id)?.parentId ?? undefined;
export const isRegionId = (id: string) => byId.has(id) && byId.get(id)?.parentId === null;
