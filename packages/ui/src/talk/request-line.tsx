import type { RideRequest } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { useTalkTexts } from './talk-texts';
import './talk.css';

type Props = { readonly request: RideRequest; readonly role: 'driver' | 'passenger' };

// The request on top of a talk (mockups g64/4, g64/5): «Soʻrov: Chilonzor → Samarqand, ertaga» for the
// driver with the price and the way, «Soʻrovingiz: …» for the passenger; the deal stays in sight.
export function RequestLine({ request, role }: Props) {
  const { t } = useI18n();
  const texts = useTalkTexts();
  const driver = role === 'driver';
  const title = t(driver ? 'requests.talk.request' : 'requests.talk.mine', {
    route: texts.route(request),
    day: texts.day(request.date),
  });
  return (
    <div className="talk-line">
      <span className="talk-line-text">
        <b>{title}</b>
        <span>{texts.facts(request, driver)}</span>
      </span>
    </div>
  );
}
