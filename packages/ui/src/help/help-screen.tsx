import './help.css';
import '../account/profile/profile.css';
import { helpQuestions, helpTopicsFor, type HelpQuestion, type HelpTopic } from '@platform/contracts';
import { useState } from 'react';
import { ProfileGroup, ProfileRow } from '../account/profile/profile-row';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { useDriver } from '../driver/driver-context';
import type { IconName } from '../icons';
import { HelpPage, MoreRow, useHelpValues } from './help-parts';

const TOPIC_ICONS: Readonly<Record<HelpTopic, IconName>> = {
  find: 'search',
  booking: 'myTrips',
  driver: 'carSide',
  wallet: 'wallet',
  account: 'locked',
};

type Props = {
  readonly onBack: () => void;
  // A screen where a person got stuck opens its own topic (T6 of G97).
  readonly help?: HelpTopic;
};

// «Yordam» of the Mini Apps (G97, docs/226): «Boshqa savolim bor» on top, the topics, their questions,
// an answer. The same list and words as the bots and the site.
export function HelpScreen({ onBack, help: opened }: Props) {
  const { track } = useAnalytics();
  const [topic, setTopic] = useState<HelpTopic | null>(opened ?? null);
  const [question, setQuestion] = useState<HelpQuestion | null>(null);
  const open = (code: HelpTopic | HelpQuestion, show: () => void) => {
    track({ name: 'help_open', screen: 'help', code });
    show();
  };
  if (question) return <HelpAnswer question={question} onBack={() => setQuestion(null)} />;
  if (topic)
    return (
      <HelpQuestions
        topic={topic}
        onOpen={(next) => open(next, () => setQuestion(next))}
        onBack={() => (opened ? onBack() : setTopic(null))}
      />
    );
  return <HelpTopics onOpen={(next) => open(next, () => setTopic(next))} onBack={onBack} />;
}

function HelpTopics({ onOpen, onBack }: { onOpen: (topic: HelpTopic) => void; onBack: () => void }) {
  useScreenView('help');
  const { t } = useI18n();
  const topics = helpTopicsFor(useDriver() ? 'driver' : 'passenger');
  return (
    <HelpPage title={t('help.title')} lead={t('help.lead')} onBack={onBack}>
      <MoreRow />
      <ProfileGroup>
        {topics.map((topic) => (
          <ProfileRow
            key={topic}
            icon={TOPIC_ICONS[topic]}
            title={t(`help.topic.${topic}`)}
            onClick={() => onOpen(topic)}
          />
        ))}
      </ProfileGroup>
    </HelpPage>
  );
}

type QuestionsProps = {
  readonly topic: HelpTopic;
  readonly onOpen: (question: HelpQuestion) => void;
  readonly onBack: () => void;
};

function HelpQuestions({ topic, onOpen, onBack }: QuestionsProps) {
  useScreenView('help.topic');
  const { t } = useI18n();
  const values = useHelpValues();
  return (
    <HelpPage title={t(`help.topic.${topic}`)} onBack={onBack}>
      <ProfileGroup>
        {helpQuestions(topic).map((question) => (
          <ProfileRow
            key={question}
            icon="help"
            title={t(`help.${question}.q`, values)}
            onClick={() => onOpen(question)}
          />
        ))}
      </ProfileGroup>
      <MoreRow />
    </HelpPage>
  );
}

// The answer: the question on top, the words in a white card, a line per paragraph.
function HelpAnswer({ question, onBack }: { readonly question: HelpQuestion; readonly onBack: () => void }) {
  useScreenView('help.answer');
  const { t } = useI18n();
  const values = useHelpValues();
  return (
    <HelpPage title={t(`help.${question}.q`, values)} onBack={onBack}>
      <div className="help-answer">
        {t(`help.${question}.a`, values)
          .split('\n')
          .map((line) => (
            <p key={line}>{line}</p>
          ))}
      </div>
      <MoreRow after={question} />
    </HelpPage>
  );
}
