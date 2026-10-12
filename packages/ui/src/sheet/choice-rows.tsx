import { Icon } from '../icons';
import { haptic } from '../telegram/feedback';
import './choice-rows.css';

type Choice<K extends string> = { readonly key: K; readonly title: string; readonly hint?: string };

type Props<K extends string> = {
  readonly name: string;
  readonly choices: readonly Choice<K>[];
  // Without a value a tap does the step at once, an arrow on the right (G78 sheet 2, «Xabar bering»).
  readonly value?: K;
  readonly onPick: (key: K) => void;
};

// One choice of a few in a sheet (G75, mockup g75/3 A): a row with its gray line and a round mark on
// the right; the whole row is tapped, the main button does the step.
export function ChoiceRows<K extends string>({ name, choices, value, onPick }: Props<K>) {
  const pick = (key: K) => {
    haptic.select();
    onPick(key);
  };
  if (value === undefined)
    return (
      <div className="choice-rows">
        {choices.map((choice) => (
          <button key={choice.key} type="button" className="choice-row" onClick={() => pick(choice.key)}>
            <Words choice={choice} />
            <span className="choice-arrow">
              <Icon name="next" size={18} />
            </span>
          </button>
        ))}
      </div>
    );
  return (
    <div className="choice-rows" role="radiogroup">
      {choices.map((choice) => (
        <label key={choice.key} className="choice-row">
          <Words choice={choice} />
          <input
            type="radio"
            className="choice-radio"
            name={name}
            checked={choice.key === value}
            onChange={() => pick(choice.key)}
          />
        </label>
      ))}
    </div>
  );
}

function Words<K extends string>({ choice }: { readonly choice: Choice<K> }) {
  return (
    <span className="choice-words">
      <span>{choice.title}</span>
      {choice.hint ? <span className="choice-hint">{choice.hint}</span> : null}
    </span>
  );
}
