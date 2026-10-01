// The approval is told once on this phone (docs/86 V7). No storage (a private window): told each time.
const KEY = 'driver.approvalSeen';

export function approvalSeen(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function markApprovalSeen() {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    // No storage: the driver sees the approval again next time.
  }
}
