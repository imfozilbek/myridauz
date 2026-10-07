import './registration.css';
import { nameSchema, type Gender } from '@platform/contracts';
import { useState } from 'react';
import { useScreenView } from '../../context/analytics-context';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { Icon } from '../../icons';
import { Screen } from '../../screen/screen';
import { MainButton } from '../../telegram/bottom-button';
import { haptic } from '../../telegram/feedback';
import { requestSignedContact } from '../../telegram/permissions';
import { useScreenBackground } from '../../telegram/screen-background';
import { useOpenAtTop } from '../../telegram/screen-top';
import { brandVars } from './brand-vars';
import { FaceCircle } from './face-circle';
import { GenderTiles } from './gender-tiles';

const NOTE_ICON = 18;

export type Answers = {
  readonly photo: Blob | null;
  readonly name: string;
  readonly gender: Gender | null;
};
export type Registration = {
  readonly photo: Blob;
  readonly firstName: string;
  readonly gender: Gender;
  readonly contact: string;
};

type AboutStepProps = {
  // Kept by the flow: back from here and forward again, the answers are still there (docs/94 B7).
  readonly answers: Answers;
  readonly onChange: (answers: Answers) => void;
  readonly onBack: () => void;
  // Both answers are there and the person asks Telegram for the number (analytics, docs/29).
  readonly onAnswered: () => void;
  // Resolves false when the server refused the registration.
  readonly onSend: (registration: Registration) => Promise<boolean>;
};

// «Siz haqingizda» (G58, docs/118 variant A): the face (required for both roles), the name from
// Telegram, the gender in one tap, then the phone from Telegram itself (docs/19, docs/10 q. 33).
export function AboutStep({ answers, onChange, onBack, onAnswered, onSend }: AboutStepProps) {
  useScreenView('registration.about');
  useScreenBackground('tinted');
  useOpenAtTop();
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const [edited, setEdited] = useState(false);
  const [failed, setFailed] = useState(false);
  const name = nameSchema.safeParse(answers.name);
  const { photo, gender } = answers;
  // A name from Telegram may be emoji: it is shown wrong only after a touch or a choice.
  const nameWrong = !name.success && (edited || gender !== null);

  const choose = (value: Gender) => {
    haptic.select();
    onChange({ ...answers, gender: value });
  };
  const send = async (face: Blob, firstName: string, chosen: Gender) => {
    onAnswered();
    const contact = await requestSignedContact();
    const accepted = contact !== null && (await onSend({ photo: face, firstName, gender: chosen, contact }));
    if (accepted) return;
    haptic.error();
    setFailed(true);
  };

  return (
    <div className="about" style={brandVars(colors)}>
      <Screen onBack={onBack} />
      <div className="about-steps" role="progressbar" aria-valuenow={2} aria-valuemax={2}>
        <i />
        <i />
      </div>
      <h1 className="about-title">{t('account.about.title')}</h1>
      <p className="about-hint">{t('account.about.hint')}</p>
      <FaceCircle photo={photo} onPhoto={(next) => onChange({ ...answers, photo: next })} />
      <label className="about-label" htmlFor="about-name">
        {t('account.name.label')}
      </label>
      <input
        id="about-name"
        className={nameWrong ? 'about-field about-field-wrong' : 'about-field'}
        value={answers.name}
        onChange={(event) => {
          setEdited(true);
          onChange({ ...answers, name: event.target.value });
        }}
      />
      {nameWrong ? <p className="about-error">{t('account.name.invalid')}</p> : null}
      <GenderTiles value={gender} onChange={choose} />
      <p className="about-note">
        <Icon name="hidden" size={NOTE_ICON} />
        {t('account.about.hidden')}
      </p>
      {failed ? <p className="about-error">{t('account.phone.denied')}</p> : null}
      {/* «Raqamni yuborish» works only with the face, the name and the gender (docs/118); before
          it stands gray, as «Davom etish» of screen 1. */}
      <MainButton
        text={t('account.phone.send')}
        disabled={!(photo && name.success && gender)}
        onClick={() => (photo && name.success && gender ? send(photo, name.data, gender) : undefined)}
      />
    </div>
  );
}
