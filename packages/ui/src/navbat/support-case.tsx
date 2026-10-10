import { SUPPORT_ANSWER_MAX, type SupportCase as Talk } from '@platform/contracts';
import { useState } from 'react';
import { Textarea } from '../components';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useLoad } from '../market/use-list';
import { Screen } from '../screen/screen';
import { ActionFailure } from '../states/action-failure';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useFailure } from '../states/use-failure';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { CaseHeader } from './case-header';
import type { CaseProps } from './case-props';

// A question of support not answered for two days (G75, docs/158 К): the talk and the answer, which
// the person gets from the support bot as «Operator N». A blocked person writes about the block.
export function SupportCase({ id, onBack, ...props }: CaseProps) {
  const { team } = useApiClients();
  const { value, failed, reload } = useLoad(() => team.support(id));
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  return <Question id={id} talk={value} onBack={onBack} {...props} />;
}

type QuestionProps = Omit<CaseProps, 'item'> & { readonly talk: Talk };

function Question({ id, talk, progress, onBack, onDone }: QuestionProps) {
  const { t } = useI18n();
  const { team } = useApiClients();
  const [text, setText] = useState('');
  const { failure, fail, clear } = useFailure();
  const send = async () => {
    clear();
    try {
      await team.answer(id, text.trim());
      haptic.success();
      onDone('decided');
    } catch (caught) {
      fail(caught);
    }
  };
  return (
    <div className="case">
      <Screen onBack={onBack} />
      <CaseHeader title={t('navbat.support.title', { name: talk.name })} progress={progress} />
      <div className="case-card">
        <div className="case-row">
          <span className="case-muted">{t('navbat.support.about')}</span>
          <b>{t(talk.appeal ? 'team.case.appeal' : 'team.case.question')}</b>
        </div>
      </div>
      <div className="case-card">
        {talk.talk.map((line) => (
          <p key={`${line.at}-${line.author}`} className="case-line">
            <b>{line.name}</b>
            <span>
              {line.kind === 'text'
                ? line.text
                : [t(`navbat.support.${line.kind}`), line.text].filter(Boolean).join(': ')}
            </span>
          </p>
        ))}
      </div>
      <div className="case-card case-answer">
        <Textarea
          placeholder={t('navbat.support.placeholder')}
          value={text}
          maxLength={SUPPORT_ANSWER_MAX}
          onChange={(event) => setText(event.target.value)}
        />
      </div>
      <ActionFailure error={failure} />
      {text.trim() ? <MainButton text={t('navbat.support.send')} onClick={send} /> : null}
    </div>
  );
}
