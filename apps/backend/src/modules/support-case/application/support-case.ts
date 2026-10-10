import type { SupportCase } from '@platform/contracts';

// One message of the talk, as the support module keeps it (G32).
type TalkEntry = SupportCase['talk'][number] & { readonly personId: number };
// Who answers: the member counts the work, the others see it was answered (G68, docs/92).
export type Member = { readonly id: number; readonly name: string };

// What a support case reads and does across the modules (wired in index.ts).
export type SupportCaseDeps = {
  readonly person: (publicId: string) => Promise<{ readonly id: number; readonly name: string } | undefined>;
  readonly blocked: (id: number) => Promise<boolean>;
  readonly talk: (id: number) => Promise<readonly TalkEntry[]>;
  readonly operator: (id: number) => Promise<number>;
  // The answer from the support bot as «Operator N»: false when it did not go.
  readonly send: (id: number, operator: number, text: string) => Promise<boolean>;
  readonly record: (entry: TalkEntry) => Promise<void>;
  readonly answered: (id: number, member: Member) => Promise<void>;
  readonly operatorName: (operator: number) => string;
  readonly now: () => number;
};

export async function supportCase(deps: SupportCaseDeps, publicId: string): Promise<SupportCase | undefined> {
  const person = await deps.person(publicId);
  if (!person) return undefined;
  const [appeal, talk] = await Promise.all([deps.blocked(person.id), deps.talk(person.id)]);
  return {
    name: person.name,
    appeal,
    talk: talk.map(({ author, name, kind, text, at }) => ({ author, name, kind, text, at })),
  };
}

export type AnswerResult = 'ok' | 'support.not_found' | 'support.not_sent';

// The answer of a member from the admin app goes as a reply in the bot does (G31, G32): the
// person reads «Operator N», the talk keeps it, the question leaves «Navbat».
export async function answerCase(
  deps: SupportCaseDeps,
  publicId: string,
  text: string,
  member: Member,
): Promise<AnswerResult> {
  const person = await deps.person(publicId);
  if (!person) return 'support.not_found';
  const operator = await deps.operator(person.id);
  if (!(await deps.send(person.id, operator, text))) return 'support.not_sent';
  const name = deps.operatorName(operator);
  await deps.record({ personId: person.id, at: deps.now(), author: 'team', name, kind: 'text', text });
  await deps.answered(person.id, member);
  return 'ok';
}
