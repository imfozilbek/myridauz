// The code a Durable Object closes a socket with when the client closed it. The client may report
// a code nobody is allowed to send, such as 1005 or 1006 when a phone lost the network: closing
// with it throws, and the work after the close never runs. The server may send only 1000 or
// 3000 … 4999 (the WebSocket standard), so anything else is answered with a normal close.
const NORMAL = 1000;
const OWN_FIRST = 3000;
const OWN_LAST = 4999;

export const closeCodeFor = (code: number): number =>
  code === NORMAL || (code >= OWN_FIRST && code <= OWN_LAST) ? code : NORMAL;
