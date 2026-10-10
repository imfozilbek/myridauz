import { useEffect, useState, type ReactNode } from 'react';
import { useBrand } from '../../context/brand-context';
import { shineMain } from '../../telegram/bottom-button';
import { useWhiteBottomBar } from '../../telegram/screen-background';
import { brandVars } from '../../theme/brand-vars';
import type { Cue } from './cues';
import { DockCue } from './dock-cue';
import './dock-cue.css';

// Two pulses of the main button (docs/165), then it rests.
const PULSE_MS = 1400;
const still = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

type Props = {
  readonly cue?: Cue | null;
  // How many times the block called the eye (use-attention): each new one swings and pulses.
  readonly calls?: number;
  readonly children: ReactNode;
};

// The white block at the bottom of the main screen (G66, G76, docs/165): it stands over the screen
// right above the buttons of Telegram; only it changes, the head and the tiles never move.
export function DockPanel({ cue = null, calls = 0, children }: Props) {
  const { colors } = useBrand().theme;
  const [pulse, setPulse] = useState(false);
  useWhiteBottomBar();
  useEffect(() => {
    if (calls === 0) return;
    setPulse(true);
    if (!still()) shineMain(true);
    const rest = setTimeout(() => {
      setPulse(false);
      shineMain(false);
    }, PULSE_MS);
    return () => {
      clearTimeout(rest);
      shineMain(false);
    };
  }, [calls]);
  const style = {
    ...brandVars(colors),
    '--dock-pulse': cue?.tone === 'now' ? colors.danger : colors.brandStrong,
  };
  return (
    <div className="home-dock" data-testid="home-dock" data-pulse={pulse || undefined} style={style}>
      {cue ? <DockCue cue={cue} calls={calls} /> : null}
      {children}
    </div>
  );
}
