import type { Moment, ShareMoment } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useEffect, useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { errorKey } from '../market/error-text';
import { Screen } from '../screen/screen';
import { ActionFailure } from '../states/action-failure';
import { MainButton, SecondaryButton } from '../telegram/bottom-button';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { MomentCard } from './moment-card';
import { MomentPhrases } from './moment-phrases';
import { useMomentWords } from './moment-words';
import { useMomentShare } from './use-moment-share';
import './moment.css';

type Props = { readonly found: Moment & { readonly moment: ShareMoment }; readonly onDone: () => void };

const WHY = 18;

// The celebration of a moment «Men Rida bilan» (docs/123, mockups g69/1 … 3): what happened, why to
// tell friends, the phrase in the person's own voice, the card a friend sees, the story and the chat.
// Never forced: «Keyinroq» is always there, and the moment is offered once.
export function MomentScreen({ found, onDone }: Props) {
  useScreenView('growth.moment');
  useScreenBackground();
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const { growth } = useApiClients();
  const words = useMomentWords(found.moment);
  const share = useMomentShare(found, words);
  const [phrase, setPhrase] = useState(0);
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  useEffect(() => {
    void growth.offered(found.moment).catch(() => undefined);
  }, [growth, found.moment]);
  const run = (action: (chosen: number) => Promise<void>) => async () => {
    setFailure(null);
    await action(phrase).catch((caught: unknown) => setFailure(errorKey(caught)));
  };
  const story = { text: t('growth.toStory'), onClick: run(share.story) };
  const chat = { text: words.chat, onClick: run(share.chat) };
  return (
    <div className="moment" style={brandVars(colors)}>
      <Screen onBack={onDone} />
      <h1 className="moment-title">{words.title}</h1>
      <p className="moment-lead">{words.lead}</p>
      <div className="moment-why">
        <Icon name="favorite" size={WHY} />
        <span>
          <b>{words.whyTitle}</b> {words.whyText}
        </span>
      </div>
      <MomentPhrases phrases={words.phrases} chosen={phrase} onChoose={setPhrase} />
      <p className="moment-head">{t('growth.preview')}</p>
      <MomentCard words={words} phrase={words.phrases[phrase] ?? ''} />
      <ActionFailure error={failure} />
      <button type="button" className="moment-later" onClick={onDone}>
        {t('growth.later')}
      </button>
      {share.canStory ? <MainButton {...story} /> : <MainButton {...chat} />}
      {/* The chat names to whom, a long line: under the story, never squeezed beside it (docs/121). */}
      {share.canStory ? <SecondaryButton under {...chat} /> : null}
    </div>
  );
}
