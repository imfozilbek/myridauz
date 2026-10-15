import { momentLoop, type Moment, type ShareMoment } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { haptic } from '../telegram/feedback';
import { shareCard } from '../telegram/share-card';
import { canShareStory, openStory } from '../telegram/story';
import { drawMomentStory } from './moment-picture';
import type { MomentWords } from './moment-words';
import { useShareTrack } from './use-share-track';

// «Hikoyamga joylash» and «Doʻstlarimga yuborish» of a moment (docs/123) with the phrase the person
// chose: the story is drawn here and kept a day; the chat message is made by the server.
export function useMomentShare(found: Moment & { readonly moment: ShareMoment }, words: MomentWords) {
  const { t } = useI18n();
  const { growth } = useApiClients();
  const brand = useBrand();
  const done = useShareTrack(momentLoop(found.moment), 'growth.moment');
  const story = async (phrase: number) => {
    const quote = t('growth.quote', { phrase: words.phrases[phrase] ?? '' });
    const picture = await drawMomentStory(
      {
        brandName: brand.name,
        initial: words.name.charAt(0).toUpperCase(),
        quote,
        name: words.name,
        fact: words.fact,
        link: words.link,
        slogan: brand.slogan,
      },
      brand.theme.colors,
      getComputedStyle(document.body).fontFamily,
    );
    if (!picture) throw new Error('ui.story_not_drawn');
    const imageUrl = await growth.momentStory(picture);
    const caption = t('growth.story.caption', { phrase: words.phrases[phrase] ?? '', link: found.link });
    openStory(imageUrl, caption, { url: found.link, name: words.link });
    done('story');
    haptic.success();
  };
  const chat = async (phrase: number) => {
    const card = await growth.momentCard(found.moment, phrase);
    if (!(await shareCard(card.prepared, card.link))) return;
    done('chat');
    haptic.success();
  };
  return { story, chat, canStory: canShareStory() };
}
