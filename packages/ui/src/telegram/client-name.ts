// The engine that draws the Mini App and its major version: an old Android WebView may miss what a
// new one has (G52, docs/112). Only a name and a number, never the whole user agent.
const ENGINES = [
  ['chrome', /Chrome\/(\d{1,4})/],
  ['safari', /Version\/(\d{1,4})[.\d]* (?:Mobile\/\S+ )?Safari/],
  ['firefox', /Firefox\/(\d{1,4})/],
] as const;

function engineOf(userAgent: string): string {
  for (const [name, pattern] of ENGINES) {
    const found = pattern.exec(userAgent);
    if (found) return ` ${name} ${found[1]}`;
  }
  return '';
}

// «android 8.0 chrome 120»: letters for the app, digits for its version, then the engine (G52, docs/112).
export function clientOf(app: string, version: string, userAgent = navigator.userAgent): string {
  const name =
    app
      .toLowerCase()
      .replace(/[^a-z_]/g, '')
      .slice(0, 16) || 'unknown';
  const number = version.replace(/[^0-9.]/g, '').slice(0, 8) || '0';
  return `${name} ${number}${engineOf(userAgent)}`;
}
