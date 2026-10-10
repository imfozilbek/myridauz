// The line of a car seen from the front in the frame of the front photo (G75, mockup g75/6 A): the
// body, the plate in the middle, the two wheels. A drawing of the frame, not an icon.
export function CameraCar() {
  return (
    <svg className="camera-car" viewBox="0 0 230 110" aria-hidden>
      <path d="M15 80 L25 50 Q35 30 60 28 L170 28 Q195 30 205 50 L215 80 Z" />
      <rect x="85" y="62" width="60" height="16" rx="3" />
      <circle cx="45" cy="88" r="12" />
      <circle cx="185" cy="88" r="12" />
    </svg>
  );
}
