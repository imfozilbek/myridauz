import type { BrandConfig } from '@platform/brands';
import { LIMIT_KEYS, limitFits, type LimitKey } from '@platform/contracts';

type Tree = { readonly [name: string]: unknown };

// The value of a limit in the brand config: the default the owner starts from (docs/128 §4).
export function baseOf(brand: BrandConfig, key: LimitKey): number {
  let node: unknown = brand;
  for (const name of key.split('.')) node = (node as Tree)[name];
  return typeof node === 'number' ? node : Number.NaN;
}

function setIn(tree: Tree, path: readonly string[], value: number): Tree {
  const [name, ...rest] = path;
  if (name === undefined) return tree;
  const next = rest.length === 0 ? value : setIn(tree[name] as Tree, rest, value);
  return { ...tree, [name]: next };
}

// The brand with the limits the owner set; a value out of its rule is never used (G75).
export function withLimits(brand: BrandConfig, values: ReadonlyMap<LimitKey, number>): BrandConfig {
  let tree: Tree = brand;
  for (const key of LIMIT_KEYS) {
    const value = values.get(key);
    if (value !== undefined && limitFits(key, value)) tree = setIn(tree, key.split('.'), value);
  }
  return tree as BrandConfig;
}
