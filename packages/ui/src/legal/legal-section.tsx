import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { Accordion, Section } from '../components';

type Props = { readonly title: string; readonly text: string };

// One section of a document: its title opens the text, so the needed point is found faster (docs/88 L18).
export function LegalSection({ title, text }: Props) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Section>
      <Accordion expanded={expanded} onChange={setExpanded}>
        <Accordion.Summary multiline>{title}</Accordion.Summary>
        <Accordion.Content>
          <Text className="legal-text">{text}</Text>
        </Accordion.Content>
      </Accordion>
    </Section>
  );
}
