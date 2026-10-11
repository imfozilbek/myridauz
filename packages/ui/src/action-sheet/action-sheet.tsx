import { SHEET_LINK, SHEET_LINK_VALUE } from '@platform/contracts';
import { useEffect, useRef, useState } from 'react';
import { Modal, Snackbar } from '../components';
import { useI18n } from '../context/i18n-context';
import { SheetOverlay } from '../home/sheet-overlay';
import { Icon } from '../icons';
import { SheetBack } from '../sheet/sheet-back';
import { forgetLaunchParam, launchParam } from '../telegram/launch-param';
import { useSheetShown } from '../telegram/sheet-shown';
import { ActionCard } from './action-card';
import type { ActionItem } from './action-item';
import { answeredSheet, closeSheet, pinFirst, useActionQueue } from './action-queue';

// Long enough to read «Madina tasdiqlandi · 20 000 komissiya» once.
const PLAQUE_MS = 4000;

// The sheet of the open Mini App (docs/122, docs/164, mockups g68/7, g68/8): a call rises by itself,
// the rest open from the block at the bottom or a bot link. One thing at a time, «1 / 3» while more
// of its kind wait, the next one right after an answer; a short plaque on top says what happened.
export function ActionSheet() {
  const { t } = useI18n();
  const queue = useActionQueue();
  const [done, setDone] = useState(0);
  const [plaque, setPlaque] = useState<string | null>(null);
  const item = queue[0];
  useSheetShown(item !== undefined);
  // A bot link names its thing: the main screen opens and that sheet comes first.
  useEffect(() => {
    const named = launchParam(SHEET_LINK, SHEET_LINK_VALUE);
    if (named === null) return;
    forgetLaunchParam(SHEET_LINK);
    pinFirst(named);
  }, []);
  // The last one answered: the sheet closes, a new thing waits in the block (docs/164). Not before
  // the first one came: the lists load after a bot link named its thing (G77).
  const shown = useRef(false);
  useEffect(() => {
    shown.current ||= item !== undefined;
    if (item || !shown.current) return;
    shown.current = false;
    setDone(0);
    closeSheet();
  }, [item]);
  const total = done + queue.length;
  // An answer takes the thing away and brings the next one; «Keyinroq» closes the sheet.
  const answer = (gone: ActionItem) => {
    setDone((count) => count + 1);
    gone.onAside?.();
    answeredSheet(gone.key);
  };
  // A call put aside is declined (G68): it never comes back.
  const leave = (gone: ActionItem) => (gone.kind === 'call' ? answer(gone) : closeSheet());
  return (
    <>
      <Modal
        overlayComponent={<SheetOverlay />}
        open={item !== undefined}
        onOpenChange={(open) => (open || !item ? undefined : leave(item))}
      >
        {item ? <SheetBack onClose={() => leave(item)} /> : null}
        {item ? (
          <ActionCard
            key={item.key}
            item={item}
            counter={total > 1 ? t('sheet.counter', { index: String(done + 1), total: String(total) }) : null}
            laterLabel={t('sheet.later')}
            onDone={(words) => {
              answer(item);
              if (words) setPlaque(words);
            }}
            onLater={() => leave(item)}
          />
        ) : null}
      </Modal>
      {plaque ? (
        <Snackbar
          className="action-plaque"
          duration={PLAQUE_MS}
          before={<Icon name="selected" size={20} />}
          onClose={() => setPlaque(null)}
        >
          {plaque}
        </Snackbar>
      ) : null}
    </>
  );
}
