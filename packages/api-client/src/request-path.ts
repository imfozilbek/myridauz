// The address of a request without its ids, for the analytics (docs/29, docs/233 №5): the words of the
// path stay, a number, an id or a name becomes «:id». «/api/team/person/u_9f3a» → «api/team/person/:id».
const WORD = /^[a-z][a-z-]*$/;
const MAX_LENGTH = 64;
export const requestOf = (path: string): string =>
  (path.split('?')[0] ?? '')
    .split('/')
    .filter(Boolean)
    .map((part) => (WORD.test(part) ? part : ':id'))
    .join('/')
    .slice(0, MAX_LENGTH);
