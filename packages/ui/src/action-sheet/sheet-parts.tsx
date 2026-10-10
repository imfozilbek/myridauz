import { UzPlate } from '../plate/uz-plate';
import './sheet-parts.css';

// One row of the short card: «2 joy × 100 000 · 200 000» (mockup g68/7 screen 3).
export type BlockRow = { readonly label: string; readonly value?: string; readonly strong?: boolean };

// The short trip card of a sheet: when and where in bold, then its rows.
export function TripBlock({
  head,
  rows = [],
}: {
  readonly head: string;
  readonly rows?: readonly BlockRow[];
}) {
  return (
    <div className="action-block">
      <b className="action-block-head">{head}</b>
      {rows.map((row) => (
        <span key={row.label} className="action-row">
          <span>{row.label}</span>
          {row.value ? row.strong ? <b>{row.value}</b> : <span>{row.value}</span> : null}
        </span>
      ))}
    </div>
  );
}

// The words of a new message, as written (mockup g68/8 «Xabar»).
export function QuoteBlock({ text }: { readonly text: string }) {
  return <div className="action-block action-quote">{`«${text}»`}</div>;
}

// The car of the driver under the name, with its plate (mockup g68/8 «Taklif», «Qoʻngʻiroq»).
export function CarLine({ car, plate }: { readonly car: string; readonly plate: string | null }) {
  return (
    <>
      <span>{car}</span>
      {plate ? <UzPlate plate={plate} size="s" /> : null}
    </>
  );
}
