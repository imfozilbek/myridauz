import { useState, type ReactNode } from 'react';
import { FollowScreen, followToken } from './follow-screen';

type Props = { readonly enabled: boolean; readonly children: ReactNode };

// The passenger app opened from a shared trip card shows the trip first (docs/43).
// "Men ham yoʻlga chiqaman" goes on to the usual app with the registration (docs/18).
export function FollowGate({ enabled, children }: Props) {
  const [token, setToken] = useState(() => (enabled ? followToken() : null));
  return token ? <FollowScreen token={token} onJoin={() => setToken(null)} /> : children;
}
