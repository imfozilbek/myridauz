import type { ReactNode } from 'react';
import { Modal } from '../components';
import { useBrand } from '../context/brand-context';
import { SheetOverlay } from '../home/sheet-overlay';
import { SheetBack } from '../sheet/sheet-back';
import { useBehind } from '../telegram/behind';
import { brandVars } from '../theme/brand-vars';
import './board-sheet.css';

type Props = {
  readonly open: boolean;
  // «offer» and «salon» stand at the heights of their mockups (g64/1 phone 3, g64/3 phone 2).
  readonly kind: 'offer' | 'salon';
  readonly onClose: () => void;
  readonly children: ReactNode;
};

// A sheet over «Yoʻlovchilar soʻrovlari» (G64): only what the request does not say yet; the native
// main button of Telegram sends, as on every screen of the app (docs/21).
export function BoardSheet({ open: asked, kind, onClose, children }: Props) {
  const { colors } = useBrand().theme;
  const behind = useBehind();
  const open = asked && !behind;
  return (
    <Modal
      className="board-sheet-modal"
      overlayComponent={<SheetOverlay />}
      open={open}
      onOpenChange={(next) => (next ? undefined : onClose())}
    >
      {open ? (
        <div className="board-sheet" data-sheet={kind} style={brandVars(colors)}>
          <SheetBack onClose={onClose} />
          <span className="board-sheet-grab" aria-hidden />
          {children}
        </div>
      ) : null}
    </Modal>
  );
}
