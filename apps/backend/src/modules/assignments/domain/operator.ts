// The person sees the team as «Operator N» (docs/92): a random N for one question, never a name.
const OPERATORS = 200;

export const operatorNumber = (random: number): number => 1 + Math.floor(random * OPERATORS);
// A question from before the numbers (no row): a steady number from the person's id.
export const steadyOperator = (subjectId: number): number => (Math.abs(subjectId) % OPERATORS) + 1;
