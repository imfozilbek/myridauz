import type { TranslationKey } from '@platform/i18n';
import { useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { errorKey } from '../market/error-text';
import { useLoad } from '../market/use-list';
import { Screen } from '../screen/screen';
import { ActionFailure } from '../states/action-failure';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { MainButton } from '../telegram/bottom-button';
import { downloadPicture } from '../telegram/download';
import { haptic } from '../telegram/feedback';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { drawQrPicture, qrSvg } from './qr-picture';
import { useShareTrack } from './use-share-track';
import './qr.css';

// «Oynaga QR» of a driver (docs/123 loop 1): the own link with the mark qr-<code> as a picture to
// print and put on the glass; a passenger scans it and comes to the brand with the driver's code.
export function QrScreen({ onBack }: { readonly onBack: () => void }) {
  useScreenView('growth.qr');
  useScreenBackground();
  const { t } = useI18n();
  const brand = useBrand();
  const { colors } = brand.theme;
  const { growth } = useApiClients();
  const { value, failed, reload } = useLoad(() => growth.mine(), 'growth.mine');
  const done = useShareTrack('qr', 'growth.qr');
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  const caption = t('growth.qr.picture', { brand: brand.name });
  const download = async () => {
    setFailure(null);
    try {
      const font = getComputedStyle(document.body).fontFamily;
      const picture = await drawQrPicture(value.qr, { brandName: brand.name, caption }, colors, font);
      if (!picture) throw new Error('ui.qr_not_drawn');
      await downloadPicture(await growth.qrPicture(picture), `${brand.id}-qr.png`);
      done();
      haptic.success();
    } catch (caught) {
      setFailure(errorKey(caught));
    }
  };
  return (
    <div className="qr" style={brandVars(colors)}>
      <Screen onBack={onBack} />
      <h1 className="qr-title">{t('growth.qr.title')}</h1>
      <p className="qr-lead">{t('growth.qr.lead', { brand: brand.name })}</p>
      <div className="qr-card">
        <img className="qr-code" src={qrSvg(value.qr, colors)} alt={caption} />
        <b>{caption}</b>
      </div>
      <p className="qr-hint">{t('growth.qr.hint')}</p>
      <ActionFailure error={failure} />
      <MainButton text={t('growth.qr.download')} onClick={download} />
    </div>
  );
}
