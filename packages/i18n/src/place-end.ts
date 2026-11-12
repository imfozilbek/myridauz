// The ending of «-ga», «-gacha» after a place's name (docs/25): a «k» or a «q» at its end changes it,
// «Muborakka», «Chortoqqa»; any other letter takes «ga», «Yakkabogʻga». The catalog picks the ending
// by this value: «{place}{end, select, k {ka} q {qa} other {ga}}». A name in Cyrillic ends the same
// way with «к», «қ» (G98, docs/228).
export type PlaceEnd = 'k' | 'q' | 'other';

export function placeEnd(name: string): PlaceEnd {
  const last = name.trim().slice(-1).toLowerCase();
  if (last === 'k' || last === 'к') return 'k';
  return last === 'q' || last === 'қ' ? 'q' : 'other';
}
