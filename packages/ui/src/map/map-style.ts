import { layers, namedFlavor } from '@protomaps/basemaps';
import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import type { MapSource } from './map-engine';

export const MAP_SOURCE = 'protomaps';
// Names as people in Uzbekistan write them: the local name, not the English one.
const LANGUAGE = 'uz';

// Place icons need a sprite sheet we do not serve: the names of places stay, the icons go.
function withoutIcons(layer: LayerSpecification): LayerSpecification {
  if (layer.type !== 'symbol' || !layer.layout || !('icon-image' in layer.layout)) return layer;
  const layout = { ...layer.layout };
  delete layout['icon-image'];
  return { ...layer, layout };
}

// The light map of Protomaps (docs/20: only a light theme) over our own archive and fonts.
export function mapStyle({ archiveUrl, fontsUrl }: MapSource): StyleSpecification {
  return {
    version: 8,
    glyphs: fontsUrl,
    sources: { [MAP_SOURCE]: { type: 'vector', url: `pmtiles://${archiveUrl}` } },
    layers: layers(MAP_SOURCE, namedFlavor('light'), { lang: LANGUAGE }).map(withoutIcons),
  };
}
