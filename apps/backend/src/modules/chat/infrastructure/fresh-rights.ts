import type { Bindings } from '../../../env';
import type { Member } from '../application/ports';

type RightsOf = (env: Bindings, key: string, userId: number) => Promise<Member | null>;

// Who may write and ring in a chat now (G89 C1, C2): the app wires the rule, the chat room asks it at
// each event of an open socket, so a block, a deletion, a cancel or a closed window ends the rights the
// socket opened with.
let rightsOf: RightsOf = async () => null;
export const wireChatRights = (rights: RightsOf) => void (rightsOf = rights);
export const rightsNow: RightsOf = (env, key, userId) => rightsOf(env, key, userId);
