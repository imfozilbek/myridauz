import { useI18n } from '../context/i18n-context';

type Props = {
  readonly phrases: readonly string[];
  readonly chosen: number;
  readonly onChoose: (phrase: number) => void;
};

// «Qaysi soʻz sizniki?» (docs/123, mockup g69/3): three ready phrases in the voice of the person;
// choosing, never typing (docs/19).
export function MomentPhrases({ phrases, chosen, onChoose }: Props) {
  const { t } = useI18n();
  return (
    <div className="moment-phrases" role="radiogroup" aria-label={t('growth.ask')}>
      <p className="moment-head">{t('growth.ask')}</p>
      {phrases.map((phrase, index) => (
        <button
          key={phrase}
          type="button"
          role="radio"
          aria-checked={index === chosen}
          className={index === chosen ? 'moment-phrase moment-phrase-on' : 'moment-phrase'}
          onClick={() => onChoose(index)}
        >
          {phrase}
        </button>
      ))}
    </div>
  );
}
