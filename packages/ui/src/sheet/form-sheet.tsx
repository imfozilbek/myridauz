import type { ReactNode } from 'react';
import { Modal } from '../components';
import { useBrand } from '../context/brand-context';
import { SheetOverlay } from '../home/sheet-overlay';
import { useBehind } from '../telegram/behind';
import { useSheetShown } from '../telegram/sheet-shown';
import { brandVars } from '../theme/brand-vars';
import { InFormSheet, useFormSheetOpen } from './form-sheet-cover';
import { SheetBack } from './sheet-back';
import './form-sheet.css';

type Props = {
  readonly open: boolean;
  readonly title?: string;
  readonly hint?: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
};

// A form over its screen (G75, mockup g75/3 A): the screen stays seen under the shade, no «Orqaga»;
// a swipe down or a tap on the shade closes it. The native main button of Telegram does the step:
// the screen under the sheet gives its own button away while the sheet stands (useAnySheet).
export function FormSheet({ open: asked, title, hint, onClose, children }: Props) {
  const { colors } = useBrand().theme;
  const behind = useBehind();
  const open = asked && !behind;
  useSheetShown(open);
  useFormSheetOpen(open);
  return (
    <Modal
      className="form-sheet-modal"
      overlayComponent={<SheetOverlay />}
      open={open}
      onOpenChange={(next) => (next ? undefined : onClose())}
    >
      {open ? (
        <InFormSheet.Provider value>
          <div className="form-sheet" style={brandVars(colors)}>
            <SheetBack onClose={onClose} />
            <span className="form-sheet-grab" aria-hidden />
            {title ? <h2 className="form-sheet-title">{title}</h2> : null}
            {hint ? <p className="form-sheet-hint">{hint}</p> : null}
            {children}
          </div>
        </InFormSheet.Provider>
      ) : null}
    </Modal>
  );
}
