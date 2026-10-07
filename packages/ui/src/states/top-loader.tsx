import type { CSSProperties } from 'react';
import { useBrand } from '../context/brand-context';
import './top-loader.css';
import { useTopLoader } from './use-top-loader';

// The thin line of the Mini App color at the very top while people wait for the server or the code of
// a screen (docs/121 §3, G72, mockup g66/4): one line for the whole app, its color only from the token.
export function TopLoader() {
  const state = useTopLoader();
  const { brandStrong } = useBrand().theme.colors;
  if (state === 'hidden') return null;
  return (
    <div
      className="top-loader"
      data-leaving={state === 'leaving' ? '' : undefined}
      style={{ '--top-loader': brandStrong } as CSSProperties}
      aria-hidden
    >
      <span className="top-loader-run" />
    </div>
  );
}
