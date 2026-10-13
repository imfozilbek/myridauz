import type { AppName, BrandBase, BrandConfig, BrandEnvironment, EnvironmentName } from './brand-config';
import { brandConfig as rida } from './rida/brand.config.ts';
import { environments as ridaEnvironments } from './rida/environments.ts';

export type {
  AlertRules,
  BrandChannel,
  BrandColors,
  BrandConfig,
  CommissionRule,
  EnvironmentName,
  HexColor,
  PromoRule,
} from './brand-config';
export { channelOf } from './channels.ts';
export { commissionFor } from './commission.ts';
export { apiHost, appHost, mapHost } from './hosts.ts';

// A brand in each of its environments: the common config with the values of the environment.
const inEnvironments = (
  base: BrandBase,
  environments: Readonly<Record<EnvironmentName, BrandEnvironment>>,
): Readonly<Record<string, BrandConfig>> =>
  Object.fromEntries(Object.entries(environments).map(([name, values]) => [name, { ...base, ...values }]));

const BRANDS: Readonly<Record<string, Readonly<Record<string, BrandConfig>>>> = {
  [rida.id]: inEnvironments(rida, ridaEnvironments),
};
const DEFAULT_BRAND_ID = rida.id;
const DEFAULT_ENVIRONMENT: EnvironmentName = 'production';

export class UnknownBrandError extends Error {
  constructor(id: string) {
    super(`brand.unknown:${id}`);
  }
}

export class UnknownEnvironmentError extends Error {
  constructor(name: string) {
    super(`brand.unknown_environment:${name}`);
  }
}

// The brand and its environment are chosen at build time (docs/22, docs/179); without a choice: the
// main brand in production. Tests and the local stand use production too.
export function loadBrand(
  id: string = DEFAULT_BRAND_ID,
  environment: string = DEFAULT_ENVIRONMENT,
): BrandConfig {
  const brand = BRANDS[id];
  if (!brand) throw new UnknownBrandError(id);
  const config = brand[environment];
  if (!config) throw new UnknownEnvironmentError(environment);
  return config;
}

// The brand as one Mini App sees it: its own main color over the common colors (docs/20).
export function brandForApp(brand: BrandConfig, app: AppName): BrandConfig {
  const colors = { ...brand.theme.colors, ...brand.theme.apps[app] };
  return { ...brand, app, theme: { ...brand.theme, colors } };
}
