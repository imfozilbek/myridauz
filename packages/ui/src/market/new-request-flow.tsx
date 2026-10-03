import { DraftRestored } from '../flow/draft-restored';
import { useDirectory } from '../places/use-directory';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { rememberedWay } from '../way/remembered-way';
import { useNewRequest } from './new-request-state';
import { RequestStep, type Find, type Search } from './request-steps';

type Props = {
  readonly onBack: () => void;
  // From an empty day of the search (G35, docs/97 K6): its route and day; sent, the search closes.
  readonly search?: Search;
  readonly onClose?: () => void;
};

// "Soʻrov qoldirish" (G35, docs/97): the route by lists, the day, the way only where a pitak is,
// the points on the maps of their districts, the price, the check with the people. Drivers find
// it. Each step has its key: it opens at the top with its own state (docs/94 S1).
export function NewRequestFlow({ onBack, search, onClose = onBack }: Props) {
  const [places] = useDirectory();
  if (places.status === 'loading') return <ScreenSkeleton onBack={onBack} />;
  const find: Find = places.status === 'ready' ? places.directory.find : () => undefined;
  return <Flow find={find} onBack={onBack} onClose={onClose} {...(search ? { search } : {})} />;
}

function Flow({
  find,
  search,
  onBack,
  onClose,
}: Props & { readonly find: Find; readonly onClose: () => void }) {
  const last = search ? rememberedWay(search.route.from.id, search.route.to.id, find) : null;
  const flow = useNewRequest(search, last);
  const props = { flow, find, search, onBack, onClose };
  return (
    <>
      <RequestStep key={flow.sent ? 'done' : flow.step} {...props} />
      <DraftRestored shown={flow.restored} />
    </>
  );
}
