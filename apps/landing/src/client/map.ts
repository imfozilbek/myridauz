import type { PublicPrice } from '@platform/contracts';
import { fill, groupThousands } from './format';

const SEATS = { min: 1, max: 4, first: 3 } as const;
const CURVE = 0.25;
// A SOATO code of a region and a Telegram username: the only values that go into links.
const SOATO = /^\d{2,10}$/u;
const USERNAME = /^[A-Za-z0-9_]{5,32}$/u;

type Fetch = (url: string) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

// "Qayerga borasiz?": "from" and "to" draw the road on the map and ask the public API for the
// distance and the price. Without an answer the price rows stay hidden, never a made-up number.
export function initMap(root: HTMLElement, load: Fetch = (url) => fetch(url)) {
  const data = root.dataset;
  const find = <T extends Element>(selector: string) => root.querySelector<T>(selector);
  const selects = {
    from: find<HTMLSelectElement>('[data-side=from]'),
    to: find<HTMLSelectElement>('[data-side=to]'),
  };
  const prices = new Map<string, PublicPrice | null>();
  let count: number = SEATS.first;

  const option = (select: HTMLSelectElement | null) => select?.selectedOptions[0];
  const money = (value: number) =>
    fill(
      data['approx'] ?? '{value}',
      'value',
      fill(data['money'] ?? '{amount}', 'amount', groupThousands(value, data['thousands'] ?? ' ')),
    );
  const text = (selector: string, value: string) => {
    const node = find(selector);
    if (node) node.textContent = value;
  };
  const point = (item: HTMLOptionElement | undefined) =>
    [Number(item?.dataset['x']), Number(item?.dataset['y'])] as const;

  function drawRoad(from: HTMLOptionElement | undefined, to: HTMLOptionElement | undefined) {
    const [[ox, oy], [x, y]] = [point(from), point(to)];
    const [mx, my] = [(ox + x) / 2 - (y - oy) * CURVE, (oy + y) / 2 + (x - ox) * CURVE];
    find('[data-route]')?.setAttribute('d', `M${ox} ${oy}Q${mx} ${my} ${x} ${y}`);
    for (const [side, [px, py]] of [
      ['from', [ox, oy]],
      ['to', [x, y]],
    ] as const) {
      find(`[data-point=${side}]`)?.setAttribute('cx', String(px));
      find(`[data-point=${side}]`)?.setAttribute('cy', String(py));
    }
    for (const region of root.querySelectorAll<SVGElement>('[data-region]')) {
      region.classList.toggle('from', region.dataset['region'] === from?.value);
      region.classList.toggle('to', region.dataset['region'] === to?.value);
    }
  }

  function showPrice(price: PublicPrice | null | undefined) {
    find('[data-price-row]')?.toggleAttribute('hidden', !price);
    find('[data-seats-row]')?.toggleAttribute('hidden', !price);
    text('[data-km-value]', price ? fill(data['km'] ?? '{km}', 'km', String(price.km)) : '');
    if (!price) return;
    text('[data-price]', money(price.price));
    text('[data-count]', String(count));
    text('[data-seats-label]', fill(data['seats'] ?? '{count}', 'count', String(count)));
    text('[data-total]', money(price.price * count));
  }

  async function ask(key: string, from: string, to: string) {
    try {
      const response = await load(`${data['api'] ?? ''}?from=${from}&to=${to}`);
      prices.set(key, response.ok ? ((await response.json()) as PublicPrice) : null);
    } catch {
      prices.set(key, null);
    }
  }

  async function render() {
    const [from, to] = [option(selects.from), option(selects.to)];
    text('[data-name=from]', from?.textContent ?? '');
    text('[data-name=to]', to?.textContent ?? '');
    drawRoad(from, to);
    const route = [from?.value ?? '', to?.value ?? ''];
    // Only codes and usernames go into a link: nothing of the page is read as a URL (CodeQL).
    if (route.every((code) => SOATO.test(code)))
      find<HTMLAnchorElement>('[data-go]')?.setAttribute(
        'href',
        `${data['bot'] ?? ''}?startapp=find_${route.join('_')}`,
      );
    const found = to?.dataset['channel'] ?? from?.dataset['channel'];
    const channel = found && USERNAME.test(found) ? found : undefined;
    const link = find<HTMLAnchorElement>('[data-channel-link]');
    if (link && channel) link.href = `https://t.me/${channel}`;
    link?.toggleAttribute('hidden', !channel);
    const places = [from?.dataset['place'] ?? '', to?.dataset['place'] ?? ''] as const;
    const key = places.join('_');
    if (!prices.has(key)) {
      showPrice(null);
      await ask(key, ...places);
    }
    // The person may have chosen another route while the answer was on its way.
    if (key === [option(selects.from)?.dataset['place'], option(selects.to)?.dataset['place']].join('_'))
      showPrice(prices.get(key));
  }

  const swap = () => {
    if (!selects.from || !selects.to) return;
    [selects.from.value, selects.to.value] = [selects.to.value, selects.from.value];
  };
  selects.from?.addEventListener('change', () => void render());
  selects.to?.addEventListener('change', () => void render());
  find('[data-swap]')?.addEventListener('click', () => {
    swap();
    void render();
  });
  // A tap on a region makes it the destination; on the start of the road it turns the road around.
  for (const region of root.querySelectorAll<SVGElement>('[data-region]')) {
    region.addEventListener('click', () => {
      if (!selects.to || !selects.from) return;
      if (region.dataset['region'] === selects.from.value) swap();
      else selects.to.value = region.dataset['region'] ?? selects.to.value;
      void render();
    });
  }
  const step = (delta: number) => () => {
    count = Math.min(SEATS.max, Math.max(SEATS.min, count + delta));
    const key = [option(selects.from)?.dataset['place'], option(selects.to)?.dataset['place']].join('_');
    showPrice(prices.get(key));
  };
  find('[data-less]')?.addEventListener('click', step(-1));
  find('[data-more]')?.addEventListener('click', step(1));
  return render();
}
