// The owners of the Telegram «Назад», the newest last (docs/94 B1, B2). One native listener for all
// of them: a tap goes to one owner only, an open camera or window first, then the screen.
export type BackOwner = { readonly overlay: boolean; readonly press: { readonly current: () => void } };
export type NativeBack = {
  readonly show: () => void;
  readonly hide: () => void;
  readonly onClick: (listener: () => void) => () => void;
};

const owners: BackOwner[] = [];
let detach: (() => void) | null = null;
// A step of a wizard gives way to the next one in the same moment: «Назад» hides only when nobody
// claims it after the step left. Telegram never gets «hide» and «show» at once (G38, docs/103).
let hiding: ReturnType<typeof setTimeout> | null = null;

const topOwner = (): BackOwner | undefined => owners.findLast((owner) => owner.overlay) ?? owners.at(-1);

// The owner holds «Назад» until the returned release: the button hides when nobody holds it.
export function claimBack(owner: BackOwner, native: NativeBack): () => void {
  owners.push(owner);
  if (hiding) clearTimeout(hiding);
  hiding = null;
  if (!detach) {
    native.show();
    detach = native.onClick(() => topOwner()?.press.current());
  }
  return () => {
    owners.splice(owners.indexOf(owner), 1);
    if (owners.length > 0 || !detach || hiding) return;
    hiding = setTimeout(() => {
      hiding = null;
      if (owners.length > 0 || !detach) return;
      detach();
      detach = null;
      native.hide();
    });
  };
}
