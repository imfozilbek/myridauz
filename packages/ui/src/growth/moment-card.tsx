import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import type { MomentWords } from './moment-words';
import './moment-card.css';

// «Doʻstlaringiz shuni koʻradi» (docs/123, mockup g69/3): the card a friend sees, in the voice of
// the person: the phrase, the name and the route, the fact, the words of the link.
export function MomentCard({ words, phrase }: { readonly words: MomentWords; readonly phrase: string }) {
  const brand = useBrand();
  const { t } = useI18n();
  return (
    <div className={words.driver ? 'moment-card moment-card-driver' : 'moment-card'}>
      <span className="moment-card-brand">
        <span className="moment-card-logo">{brand.name.charAt(0).toUpperCase()}</span>
        {brand.name}
      </span>
      <span className="moment-card-face">{words.values.name.charAt(0).toUpperCase()}</span>
      <b className="moment-card-phrase">{t('growth.quote', { phrase })}</b>
      <span className="moment-card-who">{words.who}</span>
      <span className="moment-card-fact">{words.fact}</span>
      <span className="moment-card-link">{words.link}</span>
    </div>
  );
}
