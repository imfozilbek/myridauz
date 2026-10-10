import { Icon } from '../icons';
import { haptic } from '../telegram/feedback';
import './tick-rows.css';

type Tick<K extends string> = { readonly key: K; readonly title: string };

type Props<K extends string> = {
  readonly ticks: readonly Tick<K>[];
  readonly chosen: readonly K[];
  readonly onToggle: (key: K) => void;
};

const MARK = 14;

// Several choices of a list (G75, mockup g75/5 A): a square mark of 22px on the left of each row,
// filled with the main color of the app when set; the whole row is tapped.
export function TickRows<K extends string>({ ticks, chosen, onToggle }: Props<K>) {
  return (
    <div className="tick-rows">
      {ticks.map((tick) => {
        const on = chosen.includes(tick.key);
        return (
          <label key={tick.key} className="tick-row">
            <input
              type="checkbox"
              className="tick-input"
              checked={on}
              onChange={() => {
                haptic.select();
                onToggle(tick.key);
              }}
            />
            <span className={on ? 'tick-box tick-box-on' : 'tick-box'} aria-hidden>
              {on ? <Icon name="selected" size={MARK} /> : null}
            </span>
            <span>{tick.title}</span>
          </label>
        );
      })}
    </div>
  );
}
