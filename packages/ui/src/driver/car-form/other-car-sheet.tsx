import { useState } from 'react';
import { Cell, Input, Modal, Section } from '../../components';
import { useI18n } from '../../context/i18n-context';
import { SheetOverlay } from '../../home/sheet-overlay';
import { SheetBack } from '../../sheet/sheet-back';
import { useBehind } from '../../telegram/behind';
import { useSheetShown } from '../../telegram/sheet-shown';
import { findCars, typedCar, type CarName } from '../car-choices';

type Props = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onPick: (car: CarName) => void;
};

// «Boshqa ›» (G62, docs/118 path 5): the whole list with a search; a car not in it is typed with its
// make and model.
export function OtherCarSheet({ open: asked, onClose, onPick }: Props) {
  const behind = useBehind();
  const open = asked && !behind;
  useSheetShown(open);
  return (
    <Modal
      overlayComponent={<SheetOverlay />}
      open={open}
      onOpenChange={(next) => (next ? undefined : onClose())}
    >
      {open ? (
        <>
          <SheetBack onClose={onClose} />
          <Search onPick={onPick} />
        </>
      ) : null}
    </Modal>
  );
}

function Search({ onPick }: { readonly onPick: (car: CarName) => void }) {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const found = findCars(text);
  const typed = typedCar(text);
  const name = (car: CarName) => `${car.make} ${car.model}`;
  const known = typed !== null && found.some((car) => name(car).toLowerCase() === name(typed).toLowerCase());
  return (
    <div className="other-car">
      <span className="other-car-title">{t('drivers.other.title')}</span>
      <Input
        placeholder={t('drivers.other.search')}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      {found.length === 0 && typed === null && text.trim() !== '' ? (
        <span className="other-car-hint">{t('drivers.other.twoWords')}</span>
      ) : null}
      <Section>
        {typed && !known ? (
          <Cell onClick={() => onPick(typed)}>{t('drivers.other.add', { name: name(typed) })}</Cell>
        ) : null}
        {found.map((car) => (
          <Cell key={name(car)} onClick={() => onPick(car)}>
            {name(car)}
          </Cell>
        ))}
      </Section>
    </div>
  );
}
