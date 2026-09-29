import { useRef, useState, type ChangeEvent } from 'react';
import { CameraScreen, type CameraFacing, type CameraGuide } from './camera-screen';

type Shot = { readonly guide: CameraGuide; readonly title: string; readonly hint: string };

const canOpenCamera = () => typeof navigator.mediaDevices?.getUserMedia === 'function';

// Takes a photo with our camera and its frame; where the camera cannot open here,
// with the phone camera app (never the gallery, docs/47).
export function usePhotoTaker(facing: CameraFacing, onPhoto: (photo: Blob) => void) {
  const input = useRef<HTMLInputElement>(null);
  const [shot, setShot] = useState<Shot | null>(null);
  const native = () => {
    setShot(null);
    input.current?.click();
  };
  const open = (next: Shot) => (canOpenCamera() ? setShot(next) : input.current?.click());
  const picked = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onPhoto(file);
  };
  const element = (
    <>
      <input
        ref={input}
        className="file-input"
        type="file"
        accept="image/*"
        capture={facing}
        onChange={picked}
      />
      {shot ? (
        <CameraScreen
          {...shot}
          facing={facing}
          onPhoto={(photo) => {
            setShot(null);
            onPhoto(photo);
          }}
          onNative={native}
          onClose={() => setShot(null)}
        />
      ) : null}
    </>
  );
  return { open, element, isOpen: shot !== null };
}
