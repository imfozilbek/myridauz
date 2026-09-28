// Quality gates for all code (docs/11, docs/22, docs/31). Paths are relative to the repository root.
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const HEX = /#[0-9A-Fa-f]{3,8}\b/.source;
const BRAND = /[Rr][Ii][Dd][Aa]/.source;
const syntax = (pattern, message) => [
  { selector: `Literal[value=/${pattern}/]`, message },
  { selector: `TemplateElement[value.raw=/${pattern}/]`, message },
  { selector: `JSXText[value=/${pattern}/]`, message },
];
const HEX_RULES = syntax(HEX, 'HEX colors live only in brands/<brand>/theme.ts (docs/22).');
const BRAND_RULES = syntax(BRAND, 'Brand name lives only in brands/ and docs/ (docs/22).');

const UI_LIBS = ['@telegram-apps/telegram-ui', 'lucide-react'].map((name) => ({
  name,
  message: 'UI libraries only through @platform/ui (docs/19).',
}));
const layerRule = (regex, message) => ({ regex, message });
const imports = (patterns = [], paths = UI_LIBS) => ['error', { paths, patterns }];

// FSD: a layer imports only layers below it (docs/11).
const FSD = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];
const fsdBlocks = FSD.slice(1).map((layer, i) => ({
  files: [`apps/miniapp-*/src/${layer}/**/*.{ts,tsx}`],
  rules: {
    'no-restricted-imports': imports([
      layerRule(
        `(^|/)(${FSD.slice(0, i + 1).join('|')})(/|$)`,
        `FSD: "${layer}" must not import higher layers.`,
      ),
    ]),
  },
}));

// Text for people only through translation keys (docs/13): no words in JSX or in text props.
const TEXT = 'Text for people only through translation keys: t(key) (docs/13).';
const TEXT_PROPS = '^(title|header|subtitle|description|text|label|placeholder|message|alt|aria-label)$';
const TEXT_RULES = [
  { selector: 'JSXText[value=/[A-Za-z\\u0400-\\u04FF]/]', message: TEXT },
  { selector: `JSXAttribute[name.name=/${TEXT_PROPS}/] > Literal`, message: TEXT },
  { selector: `Property[key.name=/${TEXT_PROPS}/] > Literal[value=/[A-Za-z]/]`, message: TEXT },
];
const textBlock = {
  files: ['apps/miniapp-*/src/**/*.tsx', 'packages/ui/src/**/*.tsx'],
  ignores: ['**/*.test.tsx', 'packages/ui/src/test-shell.tsx'],
  rules: { 'no-restricted-syntax': ['error', ...HEX_RULES, ...BRAND_RULES, ...TEXT_RULES] },
};

// Backend module layers: dependencies point inward; no deep imports into another module.
const DEEP = layerRule(
  '^(\\.\\./){2,}[^./][^/]*/(domain|application|infrastructure|http)(/|$)',
  'Import another module only through its index.ts.',
);
const backendBlocks = [
  ['domain', '(^|/)(application|infrastructure|http)(/|$)|^hono|^@cloudflare/'],
  ['application', '(^|/)(infrastructure|http)(/|$)|^hono|^@cloudflare/'],
  ['infrastructure', '(^|/)http(/|$)'],
].map(([layer, regex]) => ({
  files: [`apps/backend/src/modules/*/${layer}/**/*.ts`],
  rules: {
    'no-restricted-imports': imports([
      layerRule(regex, `Layer "${layer}" depends only inward (docs/11).`),
      DEEP,
    ]),
  },
}));

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      'brands/*/brand-kit/kit/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'max-lines': ['error', { max: 150 }],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-syntax': ['error', ...HEX_RULES, ...BRAND_RULES],
      'no-restricted-imports': imports(),
    },
  },
  { files: ['brands/**'], rules: { 'no-restricted-syntax': ['error', ...HEX_RULES] } },
  { files: ['brands/*/theme.ts'], rules: { 'no-restricted-syntax': 'off' } },
  { files: ['packages/ui/**'], rules: { 'no-restricted-imports': 'off' } },
  { files: ['apps/backend/src/modules/*/*/**/*.ts'], rules: { 'no-restricted-imports': imports([DEEP]) } },
  textBlock,
  ...fsdBlocks,
  ...backendBlocks,
);
