import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../test-shell';
import { CameraScreen } from './camera-screen';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const stop = vi.fn();
function camera(getUserMedia: () => Promise<unknown>, guide: 'face' | 'front' = 'face', telegram = false) {
  vi.stubGlobal('navigator', { ...navigator, mediaDevices: { getUserMedia } });
  const done = { onPhoto: vi.fn(), onNative: vi.fn(), onClose: vi.fn() };
  const view = renderInShell(
    <CameraScreen facing="user" guide={guide} title="Yuzingiz rasmi" hint="Ramkaga" {...done} />,
    telegram,
  );
  return { ...done, ...view };
}

describe('CameraScreen (docs/47)', () => {
  it('shows the frame and takes a photo from the live camera', async () => {
    vi.spyOn(HTMLVideoElement.prototype, 'videoWidth', 'get').mockReturnValue(640);
    vi.spyOn(HTMLVideoElement.prototype, 'videoHeight', 'get').mockReturnValue(480);
    const draw = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: draw,
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((done) => done(new Blob(['x'])));
    const { onPhoto, container, unmount } = camera(async () => ({ getTracks: () => [{ stop }] }));
    expect(container.querySelector('.camera-guide-face')).toBeTruthy();
    const shutter = screen.getByLabelText('Rasmga olish');
    // No frames yet: nothing to shoot.
    expect((shutter as HTMLButtonElement).disabled).toBe(true);
    fireEvent.loadedData(container.querySelector('video') as HTMLVideoElement);
    await waitFor(() => expect((shutter as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(shutter);
    expect(draw).toHaveBeenCalled();
    expect(onPhoto).toHaveBeenCalledWith(expect.any(Blob));
    unmount();
    expect(stop).toHaveBeenCalled();
  });

  it('offers the phone camera when the camera cannot open here', async () => {
    const { onNative, onClose } = camera(async () => {
      throw new Error('denied');
    });
    fireEvent.click(await screen.findByText('Telefon kamerasini ochish'));
    expect(onNative).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Orqaga'));
    expect(onClose).toHaveBeenCalled();
  });

  // The car of the mockup g75/6 A: its line in the frame, the phone camera always one tap away; in
  // Telegram its «Назад» closes the camera, no button of our own.
  it('draws the car in the frame of the front photo and always offers the phone camera', async () => {
    const { onNative, container } = camera(async () => ({ getTracks: () => [{ stop }] }), 'front', true);
    expect(container.querySelector('.camera-guide-front .camera-car')).toBeTruthy();
    expect(screen.queryByText('Orqaga')).toBeNull();
    fireEvent.click(screen.getByText('Telefon kamerasini ochish'));
    expect(onNative).toHaveBeenCalled();
  });
});
