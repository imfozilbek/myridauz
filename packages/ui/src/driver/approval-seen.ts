import { readStored, writeStored } from '../telegram/device-storage';

// The approval is told once to a person, on any of their phones (docs/86 V7, docs/88 L12).
const KEY = 'driver_approval_seen';

export const approvalSeen = () => readStored(KEY) === '1';

export function markApprovalSeen() {
  writeStored(KEY, '1');
}
