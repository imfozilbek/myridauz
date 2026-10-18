// The name, the address and the bot of production on every picture and in the film (owner, 13.10.2026, docs/179).
import { loadBrand } from '../../../index.ts';

const { name, domain, bots } = loadBrand();
export const NAME = name;
export const SITE = domain;
export const BOT = `@${bots.passenger}`;
