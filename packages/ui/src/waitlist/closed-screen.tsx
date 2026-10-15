import { botStartLink } from '@platform/contracts';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { MainButton, SecondaryButton } from '../telegram/bottom-button';
import { openInTelegram } from '../telegram/feedback';

const logoUrl = `${import.meta.env.BASE_URL}logo.svg`;
const LOGO = 72;
// The mark of the links from the main bot to the bots of the trips (docs/116).
const VIA_MAIN = 'main';

// The list is closed by the owner (docs/181): the old link of the questionnaire leads to the trips,
// like the welcome of the bot: «Safar topish» and «Safar eʼlon qilish».
export function ClosedScreen() {
  useScreenView('waitlist_closed');
  const { t } = useI18n();
  const brand = useBrand();
  const open = (bot: string) => () => openInTelegram(botStartLink(bot, VIA_MAIN));
  return (
    <>
      <div className="wl-space" />
      <div className="wl-hero">
        <img className="wl-logo" src={logoUrl} alt={brand.name} width={LOGO} height={LOGO} />
        <h2 className="wl-name">{brand.name}</h2>
        <p className="wl-slogan">{brand.slogan}</p>
      </div>
      <p className="wl-lead">{t('waitlist.closed.about', { brand: brand.name })}</p>
      <div className="wl-space" />
      <MainButton text={t('waitlist.closed.find')} onClick={open(brand.bots.passenger)} />
      <SecondaryButton text={t('waitlist.closed.publish')} onClick={open(brand.bots.driver)} />
    </>
  );
}
