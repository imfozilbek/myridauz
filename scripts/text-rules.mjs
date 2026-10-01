// Text rules that ESLint does not cover (CLAUDE.md, docs/22).
const DASHES = /[\u2014\u2013]/;
// A dash inside quotes names the rule itself, so it is allowed.
const QUOTED_DASH = /\u00AB[\u2014\u2013]\u00BB/g;
const BRAND_FREE_DIRS = /^(apps|packages)\//;
const LINTED_CODE = /\.(ts|tsx|js|mjs)$/;
// Encoded coordinates (G24): letters by chance, never words people read.
const ENCODED_DATA = /\/seed\/district-borders\.json$/;
const TEXT_FILE = /\.(ts|tsx|js|mjs|json|md|html|css|yml|yaml|txt|svg|toml)$|(^|\/)\.[\w.-]+$|^[^.]+$/;

export function isTextFile(path) {
  return TEXT_FILE.test(path);
}

// Brand names are the folder names in brands/, so the check works for every brand.
export function findViolations(path, content, brandIds) {
  // A word of its own: «tashqarida» is Uzbek, not the brand inside it (G27).
  const brandWord = new RegExp(`(?<![\\p{L}\\p{N}])(${brandIds.join('|')})(?![\\p{L}\\p{N}])`, 'iu');
  const checkBrand = BRAND_FREE_DIRS.test(path) && !LINTED_CODE.test(path) && !ENCODED_DATA.test(path);
  return content.split('\n').flatMap((line, index) => {
    const where = `${path}:${index + 1}`;
    const found = [];
    if (DASHES.test(line.replace(QUOTED_DASH, ''))) found.push(`${where}: long dash`);
    if (checkBrand && brandWord.test(line)) found.push(`${where}: brand name outside brands/`);
    return found;
  });
}
