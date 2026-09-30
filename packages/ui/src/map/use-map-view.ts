import type { Point } from '@platform/contracts';
import { useEffect, useRef, useState } from 'react';
import { useMapEngine, type MapSource, type MapView } from './map-engine';

// A map drawn into a box once the screen shows it; "Qayta urinish" draws it again (G22).
// The map is removed with the screen: nothing keeps reading the archive after "Back".
export function useMapView({ archiveUrl, fontsUrl }: MapSource, { lat, lng }: Point) {
  const loadEngine = useMapEngine();
  const box = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<MapView | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const element = box.current;
    if (!element) return undefined;
    let shown: MapView | null = null;
    let gone = false;
    loadEngine()
      .then((engine) => engine(element, { archiveUrl, fontsUrl }, { lat, lng }))
      .then(
        (made) => {
          if (gone) return made.remove();
          shown = made;
          return setView(made);
        },
        () => void (gone || setFailed(true)),
      );
    return () => {
      gone = true;
      shown?.remove();
      setView(null);
    };
  }, [loadEngine, archiveUrl, fontsUrl, lat, lng, attempt]);
  const retry = () => {
    setFailed(false);
    setAttempt((count) => count + 1);
  };
  return { box, view, failed, retry };
}
