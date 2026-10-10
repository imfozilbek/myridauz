import type { ReactNode } from 'react';
import { useBrand } from '../../context/brand-context';
import { useWhiteBottomBar } from '../../telegram/screen-background';
import { brandVars } from '../../theme/brand-vars';

// The white block at the bottom of the main screen (G66, G76, docs/165): it stands over the screen
// right above the buttons of Telegram; only it changes, the head and the tiles never move.
export function DockPanel({ cue, children }: { readonly cue?: ReactNode; readonly children: ReactNode }) {
  const { colors } = useBrand().theme;
  useWhiteBottomBar();
  return (
    <div className="home-dock" style={brandVars(colors)}>
      {cue}
      {children}
    </div>
  );
}
