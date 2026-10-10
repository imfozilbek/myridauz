import { haptic } from '../telegram/feedback';
import './choice-rows.css';

type Choice<K extends string> = { readonly key: K; readonly title: string; readonly hint?: string };

type Props<K extends string> = {
  readonly name: string;
  readonly choices: readonly Choice<K>[];
  readonly value: K;
  readonly onPick: (key: K) => void;
};

// One choice of a few in a sheet (G75, mockup g75/3 A): a row with its gray line and a round mark on
// the right; the whole row is tapped, the main button does the step.
export function ChoiceRows<K extends string>({ name, choices, value, onPick }: Props<K>) {
  return (
    <div className="choice-rows" role="radiogroup">
      {choices.map((choice) => (
        <label key={choice.key} className="choice-row">
          <span className="choice-words">
            {choice.title}
            {choice.hint ? <span className="choice-hint">{choice.hint}</span> : null}
          </span>
          <input
            type="radio"
            className="choice-radio"
            name={name}
            checked={choice.key === value}
            onChange={() => {
              haptic.select();
              onPick(choice.key);
            }}
          />
        </label>
      ))}
    </div>
  );
}
