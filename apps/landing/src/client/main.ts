import { initCompany } from './company';
import { initCount } from './count';
import { initHow } from './how';
import { initMap } from './map';
import { initPains } from './pains';
import { initReveal } from './reveal';

// The only script of the landing (docs/59): small, inline, the page works without it.
const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('js');
const pains = document.querySelector<HTMLElement>('[data-pains]');
if (pains) initPains(pains, !calm);
const how = document.querySelector<HTMLElement>('[data-how]');
if (how) initHow(how, !calm);
const map = document.querySelector<HTMLElement>('[data-map]');
if (map) void initMap(map);
const legal = document.querySelector<HTMLElement>('[data-legal]');
if (legal) void initCompany(legal);
initReveal(document);
initCount(document, !calm);
