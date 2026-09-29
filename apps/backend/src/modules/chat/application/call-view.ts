import type { CallView } from '@platform/contracts';
import type { StoredCall } from './ports';

export const inCall = (call: StoredCall, userId: number) =>
  call.callerId === userId || call.calleeId === userId;

// The call as one person sees it: who started it and where it is; null for anyone else.
export const callView = (call: StoredCall | null, userId: number): CallView | null =>
  call && inCall(call, userId)
    ? { status: call.status, caller: call.callerId === userId ? 'me' : 'other' }
    : null;
