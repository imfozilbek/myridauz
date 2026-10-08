import { maskPlate, plateParts } from '@platform/contracts';
import { PlateCountry } from './uz-plate';
import './uz-plate.css';

type Props = {
  readonly value: string;
  readonly label: string;
  readonly problem?: boolean;
  readonly onChange: (value: string) => void;
};

// The plate typed into a plate (G62, mockup g62/2-plate): the first two digits fill the region cell,
// then the number goes on in the middle; no spaces to type, the grey rest of the example shows what
// comes next. A clear field lies over the plate and takes the typing.
export function UzPlateInput({ value, label, problem = false, onChange }: Props) {
  const parts = plateParts(value);
  const inRegion = parts.regionGhost !== '';
  const caret = <span className="uz-plate-caret" aria-hidden />;
  return (
    <label
      className={
        problem ? 'uz-plate uz-plate-l uz-plate-input uz-plate-problem' : 'uz-plate uz-plate-l uz-plate-input'
      }
    >
      <span className="uz-plate-region" aria-hidden>
        <span>
          {parts.region}
          {inRegion ? caret : null}
          <span className="uz-plate-ghost">{parts.regionGhost}</span>
        </span>
      </span>
      <span className="uz-plate-number" aria-hidden>
        <span>
          {parts.number}
          {inRegion ? null : caret}
          <span className="uz-plate-ghost">{parts.numberGhost}</span>
        </span>
      </span>
      <PlateCountry />
      <input
        className="uz-plate-field"
        value={value}
        aria-label={label}
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => onChange(maskPlate(event.target.value).value)}
      />
    </label>
  );
}
