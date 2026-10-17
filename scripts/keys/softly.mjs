// A step of the setup that may fail without stopping the others (docs/189): the report names the error
// and the same step by hand.
export async function softly(report, work, byHand) {
  try {
    return await work();
  } catch (error) {
    report.push(`failed: ${String(error)}`, `owner: ${byHand}`);
    return null;
  }
}
