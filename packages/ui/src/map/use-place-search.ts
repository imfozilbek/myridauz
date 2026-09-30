import type { MapClient } from '@platform/api-client';
import { SEARCH_MIN_LETTERS, type FoundPlace, type Point } from '@platform/contracts';
import { useEffect, useState } from 'react';

// The search asks when the person stops typing: one request for a word, not one per letter (G23).
const PAUSE_MS = 400;

export type PlaceSearch =
  | { readonly status: 'idle' }
  | { readonly status: 'found'; readonly places: readonly FoundPlace[] }
  | { readonly status: 'failed' };

export function usePlaceSearch(search: MapClient['search'], near: Point) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<PlaceSearch>({ status: 'idle' });
  const asked = query.trim();
  const { lat, lng } = near;
  useEffect(() => {
    setResult({ status: 'idle' });
    if (asked.length < SEARCH_MIN_LETTERS) return undefined;
    let gone = false;
    const timer = setTimeout(() => {
      search(asked, { lat, lng }).then(
        (places) => void (gone || setResult({ status: 'found', places })),
        () => void (gone || setResult({ status: 'failed' })),
      );
    }, PAUSE_MS);
    return () => {
      gone = true;
      clearTimeout(timer);
    };
  }, [search, asked, lat, lng]);
  return { query, setQuery, result };
}
