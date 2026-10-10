import { Button, Text } from '@telegram-apps/telegram-ui';
import { useEffect, useRef, useState } from 'react';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { BackButton } from '../telegram/back-button';
import { haptic } from '../telegram/feedback';
import { useInTelegram } from '../telegram/in-telegram-context';
import { brandVars } from '../theme/brand-vars';
import { CameraCar } from './camera-car';
import './camera.css';

// The frame drawn over the camera: where the face or the car should be.
export type CameraGuide = 'face' | 'front' | 'side' | 'interior';
export type CameraFacing = 'user' | 'environment';
type State = 'starting' | 'live' | 'failed';

type CameraScreenProps = {
  readonly facing: CameraFacing;
  readonly guide: CameraGuide;
  readonly title: string;
  readonly hint: string;
  readonly onPhoto: (photo: Blob) => void;
  // The phone's own camera app, when the camera cannot be opened here.
  readonly onNative: () => void;
  readonly onClose: () => void;
};

const JPEG_QUALITY = 0.92;

// Our own camera inside the Mini App: the phone camera app cannot show a frame (docs/04, docs/47).
// In Telegram its «Назад» closes the camera first and the step under it stays (docs/94 F6, F7).
export function CameraScreen({ facing, guide, title, hint, onPhoto, onNative, onClose }: CameraScreenProps) {
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const inTelegram = useInTelegram();
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<State>('starting');
  useEffect(() => {
    let stream: MediaStream | null = null;
    let active = true;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing } }, audio: false }).then(
      (opened) => {
        stream = opened;
        if (!active || !video.current) return opened.getTracks().forEach((track) => track.stop());
        // The shutter waits for the first frames (onLoadedData): until then there is nothing to shoot.
        video.current.srcObject = opened;
      },
      () => setState('failed'),
    );
    return () => {
      active = false;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [facing]);

  const shoot = () => {
    const source = video.current;
    const canvas = document.createElement('canvas');
    canvas.width = source?.videoWidth ?? 0;
    canvas.height = source?.videoHeight ?? 0;
    const context = canvas.getContext('2d');
    if (!source || !context || canvas.width === 0) return;
    context.drawImage(source, 0, 0);
    haptic.tap();
    canvas.toBlob((photo) => photo && onPhoto(photo), 'image/jpeg', JPEG_QUALITY);
  };

  return (
    <div className="camera" role="dialog" aria-label={title} style={brandVars(colors)}>
      {inTelegram ? <BackButton overlay onClick={onClose} /> : null}
      <video
        ref={video}
        className={`camera-video camera-${facing}`}
        autoPlay
        playsInline
        muted
        onLoadedData={() => setState('live')}
      />
      <span className={`camera-guide camera-guide-${guide}`}>{guide === 'front' ? <CameraCar /> : null}</span>
      <div className="camera-top">
        <b>{title}</b>
        <span>{hint}</span>
      </div>
      {state === 'failed' ? <Text className="camera-failed">{t('common.camera.denied')}</Text> : null}
      <div className="camera-bottom">
        {/* In Telegram its «Назад» closes the camera (docs/94 F6); outside it, our own. */}
        {inTelegram ? null : (
          <Button mode="plain" size="m" className="camera-close" onClick={onClose}>
            {t('common.back')}
          </Button>
        )}
        <button
          type="button"
          className="camera-shutter"
          aria-label={t('common.camera.shoot')}
          disabled={state !== 'live'}
          onClick={shoot}
        />
        {/* The phone camera is always one tap away (G75, mockup g75/6 A). */}
        <button type="button" className="camera-native" onClick={onNative}>
          {t('common.camera.native')}
        </button>
      </div>
    </div>
  );
}
