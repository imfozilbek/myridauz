import './registration.css';
import { nameSchema, type Gender } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { Input, List, Section } from '../../components';
import { useScreenView } from '../../context/analytics-context';
import { useI18n } from '../../context/i18n-context';
import { Icon } from '../../icons';
import { Screen } from '../../screen/screen';
import { MainButton } from '../../telegram/bottom-button';
import { haptic } from '../../telegram/feedback';
import { requestSignedContact } from '../../telegram/permissions';
import { StepLayout } from '../step-layout';
import { FaceCircle } from './face-circle';
import { GenderTiles } from './gender-tiles';

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
  const { t } = useI18n();
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
    <StepLayout
      steps={[2, 2]}
      background="tinted"
      title={t('account.about.title')}
      hint={t('account.about.hint')}
    >
      <Screen onBack={onBack} />
      <FaceCircle photo={photo} onPhoto={(next) => onChange({ ...answers, photo: next })} />
      <List>
        {/* «Ism» small and as written over the field, as on the approved mockup (G58). */}
        <Text className="field-label">{t('account.name.label')}</Text>
        <Section>
          <Input
            value={answers.name}
            status={nameWrong ? 'error' : 'default'}
            onChange={(event) => {
              setEdited(true);
              onChange({ ...answers, name: event.target.value });
            }}
          />
        </Section>
        {nameWrong ? <Text className="step-error">{t('account.name.invalid')}</Text> : null}
      </List>
      <GenderTiles value={gender} onChange={choose} />
      <div className="step-note about-hidden">
        <Icon name="hidden" size={18} />
        <Text>{t('account.about.hidden')}</Text>
      </div>
      {failed ? <Text className="step-error">{t('account.phone.denied')}</Text> : null}
      {/* «Raqamni yuborish» only with the face, the name and the gender (docs/118). */}
      {photo && name.success && gender ? (
        <MainButton text={t('account.phone.send')} onClick={() => send(photo, name.data, gender)} />
      ) : null}
    </StepLayout>
  );
}
