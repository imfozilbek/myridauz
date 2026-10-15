import { createContext, useContext } from 'react';

// Realtime is set up on the server (docs/08): without it no call button shows anywhere, a tap would
// only fail (G52, docs/112). Until the answer comes the buttons stay, as calls are on in production.
export const CallsOnContext = createContext(true);

export const useCallsOn = () => useContext(CallsOnContext);
