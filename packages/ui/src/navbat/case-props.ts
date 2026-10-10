import type { NavbatItem } from '@platform/contracts';
import type { Progress } from './next-case';

// What the team is told after a decision: «Javob yuborildi» or «Bloklandi» (docs/50).
export type Outcome = 'decided' | 'blocked';

// One case on the screen of «Navbat» (G75, docs/120): after its decision the next one opens.
export type CaseProps = {
  readonly id: string;
  // The case as the list shows it; a case of a bot link may be decided already and not there.
  readonly item: NavbatItem | undefined;
  readonly progress: Progress;
  readonly onBack: () => void;
  readonly onDone: (outcome: Outcome) => void;
};
