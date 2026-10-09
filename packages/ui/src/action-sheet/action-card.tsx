import { Button } from '../components';
import { useBrand } from '../context/brand-context';
import { SheetFace } from '../home/sheet-face';
import { Icon } from '../icons';
import { ActionFailure } from '../states/action-failure';
import { useFailure } from '../states/use-failure';
import { useOneAtATime } from '../telegram/one-at-a-time';
import { brandVars } from '../theme/brand-vars';
import type { ActionItem, SheetAction } from './action-item';
import './action-sheet.css';

const ICON = 20;
// The face of a ringing call is bigger, without a badge (mockup g68/8 «Qoʻngʻiroq»).
const CALL_FACE = 94;

type Props = {
  readonly item: ActionItem;
  // «1 / 3» when more things wait (mockup g68/7 screen 5).
  readonly counter: string | null;
  readonly laterLabel: string;
  readonly onDone: (plaque: string | undefined) => void;
  readonly onLater: () => void;
};

// One sheet (docs/122, mockups g68/7, g68/8): the face with a badge, who and what, the short card,
// the answer in one tap. A failed answer keeps the sheet with its reason (docs/65 B3).
export function ActionCard({ item, counter, laterLabel, onDone, onLater }: Props) {
  const { colors } = useBrand().theme;
  const { failure, fail, clear } = useFailure();
  const act = (action: SheetAction) => async () => {
    clear();
    try {
      onDone(await action.run());
    } catch (caught) {
      fail(caught);
    }
  };
  const later = item.later === undefined ? laterLabel : item.later;
  const chips = item.chips ? <Chips actions={item.chips} act={act} /> : null;
  return (
    <div className={item.call ? 'action-sheet action-calling' : 'action-sheet'} style={brandVars(colors)}>
      {counter ? <span className="action-count">{counter}</span> : null}
      <SheetFace {...item.face} badge={item.badge} {...(item.call ? { size: CALL_FACE } : {})} />
      <span className="action-kicker">{item.kicker}</span>
      <b className="action-title">{item.title}</b>
      {item.sub ? <span className="action-sub">{item.sub}</span> : null}
      {item.body}
      {item.alert ? <span className="action-alert">{item.alert}</span> : null}
      <ActionFailure error={failure} />
      {item.chipsBelow ? null : chips}
      <div className="action-buttons">
        {item.second ? <Tap action={item.second} run={act(item.second)} kind="second" /> : null}
        <Tap action={item.main} run={act(item.main)} kind="main" />
      </div>
      {item.chipsBelow ? chips : null}
      <Foot item={item} later={later} onLater={onLater} act={act} />
    </div>
  );
}

type Act = (action: SheetAction) => () => Promise<void>;

function Tap({ action, run, kind }: { action: SheetAction; run: () => Promise<void>; kind: string }) {
  const { busy, run: once } = useOneAtATime(run);
  return (
    <Button
      size="l"
      stretched
      mode={kind === 'second' ? 'gray' : 'filled'}
      className={`action-${kind}`}
      loading={busy}
      before={action.icon ? <Icon name={action.icon} size={ICON} /> : undefined}
      onClick={once}
    >
      {action.label}
    </Button>
  );
}

function Chips({ actions, act }: { readonly actions: readonly SheetAction[]; readonly act: Act }) {
  return (
    <div className="action-chips">
      {actions.map((action) => (
        <button key={action.label} type="button" className="action-chip" onClick={() => void act(action)()}>
          {action.label}
        </button>
      ))}
    </div>
  );
}

type FootProps = { item: ActionItem; later: string | null; onLater: () => void; act: Act };

// «Barcha takliflar (2) · Keyinroq», «Yaxshi», or grey words of a call: «Raqamlar yashirin».
function Foot({ item, later, onLater, act }: FootProps) {
  if (item.note) return <span className="action-note">{item.note}</span>;
  if (later === null) return null;
  return (
    <span className="action-foot">
      {item.more ? (
        <>
          <button type="button" onClick={() => void act(item.more as SheetAction)()}>
            {item.more.label}
          </button>
          {' · '}
        </>
      ) : null}
      <button type="button" onClick={onLater}>
        {later}
      </button>
    </span>
  );
}
