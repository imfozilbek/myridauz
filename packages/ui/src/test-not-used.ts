// Test helper: API clients where every call fails unless a test gives its own (test-clients.ts).
export const NOT_USED = async (): Promise<never> => {
  throw new Error('test.client_not_used');
};
