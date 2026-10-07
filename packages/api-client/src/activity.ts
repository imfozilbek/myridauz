// One counter of the requests people wait for (docs/121 §3, G72): the top loader of every Mini App
// reads it. The quiet work is not counted: a refresh of the data on the screen, the live update, the
// return of the network (docs/64, G43); the analytics and the sounds never come through here.
type Listener = (busy: number) => void;

let busy = 0;
let quiet = 0;
const listeners = new Set<Listener>();
const tell = () => listeners.forEach((listener) => listener(busy));

export const activity = {
  busy: () => busy,
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

// A request from its start to its answer or its error.
export async function counted<T>(run: () => Promise<T>): Promise<T> {
  if (quiet > 0) return run();
  busy += 1;
  tell();
  try {
    return await run();
  } finally {
    busy -= 1;
    tell();
  }
}

// Every request started while this work runs is quiet.
export async function quietly<T>(run: () => Promise<T>): Promise<T> {
  quiet += 1;
  try {
    return await run();
  } finally {
    quiet -= 1;
  }
}
