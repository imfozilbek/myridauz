import type { PublicDirection } from '@platform/contracts';
import { fill, groupThousands } from './format';

const SEATS = { min: 1, max: 4, first: 3 } as const;
const CURVE = 0.25;

type Fetch = (url: string) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

// "Qayerga borasiz?": a tap on a region draws the road from Toshkent and shows the distance and the
// live price of the public API. Without the API the price rows stay hidden, never a made-up number.
export async function initMap(root: HTMLElement, load: Fetch = (url) => fetch(url)) {
  const data = root.dataset;
  const regions = [...root.querySelectorAll<SVGElement>('[data-region]')];
  const find = <T extends Element>(selector: string) => root.querySelector<T>(selector);
  const origin = find<SVGCircleElement>('.origin-dot');
  const directions = new Map<string, PublicDirection>();
  let selected = regions.find((region) => region.classList.contains('selected')) ?? regions[0];
  let count: number = SEATS.first;

  const money = (value: number) =>
    fill(
      data['approx'] ?? '{value}',
      'value',
      fill(data['money'] ?? '{amount}', 'amount', groupThousands(value, data['thousands'] ?? ' ')),
    );

  function drawRoad(region: SVGElement) {
    const [x, y] = [Number(region.dataset['x']), Number(region.dataset['y'])];
    const [ox, oy] = [Number(origin?.getAttribute('cx')), Number(origin?.getAttribute('cy'))];
    const [mx, my] = [(ox + x) / 2 - (y - oy) * CURVE, (oy + y) / 2 + (x - ox) * CURVE];
    find('[data-route]')?.setAttribute('d', `M${ox} ${oy}Q${mx} ${my} ${x} ${y}`);
    find('[data-target]')?.setAttribute('cx', String(x));
    find('[data-target]')?.setAttribute('cy', String(y));
  }

  function render() {
    if (!selected) return;
    const direction = directions.get(selected.dataset['region'] ?? '');
    const text = (selector: string, value: string) => {
      const node = find(selector);
      if (node) node.textContent = value;
    };
    text('[data-to]', selected.dataset['name'] ?? '');
    text('[data-km-value]', direction ? fill(data['km'] ?? '{km}', 'km', String(direction.km)) : '');
    find<HTMLElement>('[data-price-row]')?.toggleAttribute('hidden', !direction);
    find<HTMLElement>('[data-seats-row]')?.toggleAttribute('hidden', !direction);
    if (direction) {
      text('[data-price]', money(direction.price));
      text('[data-count]', String(count));
      text('[data-seats-label]', fill(data['seats'] ?? '{count}', 'count', String(count)));
      text('[data-total]', money(direction.price * count));
    }
    const channel = selected.dataset['channel'];
    const link = find<HTMLAnchorElement>('[data-channel-link]');
    if (link && channel) link.href = `https://t.me/${channel}`;
    link?.toggleAttribute('hidden', !channel);
    for (const region of regions) region.classList.toggle('selected', region === selected);
    drawRoad(selected);
  }

  for (const region of regions) {
    const choose = () => {
      selected = region;
      render();
    };
    region.addEventListener('click', choose);
    region.addEventListener('keydown', (event) => (event.key === 'Enter' || event.key === ' ') && choose());
  }
  const step = (delta: number) => () => {
    count = Math.min(SEATS.max, Math.max(SEATS.min, count + delta));
    render();
  };
  find('[data-less]')?.addEventListener('click', step(-1));
  find('[data-more]')?.addEventListener('click', step(1));
  render();

  try {
    const response = await load(data['api'] ?? '');
    if (!response.ok) return;
    const body = (await response.json()) as { directions: PublicDirection[] };
    for (const direction of body.directions) {
      const region = direction.to.slice(0, 4);
      if (!directions.has(region)) directions.set(region, direction);
    }
    render();
  } catch {
    // No network: the map still works, only without prices.
  }
}
