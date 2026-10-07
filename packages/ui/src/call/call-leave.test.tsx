import type { CallsClient } from '@platform/api-client';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatScreen } from '../chat/chat-screen';
import { FakeSocket } from '../chat/fake-socket';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { FakePeer, fakeStream } from './fake-voice';

const sdk = vi.hoisted(() => ({
  closingBehavior: {
    enableConfirmation: { ifAvailable: vi.fn() },
    disableConfirmation: { ifAvailable: vi.fn() },
  },
}));
vi.mock('@telegram-apps/sdk-react', async (original) => ({
  ...(await original<object>()),
  closingBehavior: sdk.closingBehavior,
}));

const KEY = 'b00000000-0000-4000-8000-0000000000b1';
const stop = vi.fn();
const asked = vi.spyOn(window, 'confirm');
const calls: Partial<CallsClient> = {
  ice: async () => ({ iceServers: [] }),
  connect: async () => ({ sessionId: 's1', answer: 'sfu-answer' }),
  pull: async () => null,
  renegotiate: async () => undefined,
};

beforeEach(() => {
  vi.clearAllMocks();
  const microphone = { enabled: true, stop } as unknown as MediaStreamTrack;
  vi.stubGlobal('WebSocket', FakeSocket);
  vi.stubGlobal('RTCPeerConnection', FakePeer);
  vi.stubGlobal('navigator', {
    ...navigator,
    mediaDevices: { getUserMedia: async () => fakeStream(microphone) },
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// The chat of a confirmed booking with a call that rings at the other side.
async function inCall(onBack = vi.fn()) {
  const view = renderMarket(
    <ChatScreen chatKey={KEY} title="Jasur" onBack={onBack} />,
    testClients({ chat: { socketUrl: async () => 'wss://api.test/socket' }, calls }),
  );
  await waitFor(() => expect(FakeSocket.last).not.toBeNull());
  const socket = FakeSocket.last as FakeSocket;
  act(() => {
    socket.open();
    socket.receive({ type: 'history', messages: [], canCall: true });
  });
  fireEvent.click(screen.getByLabelText('Qoʻngʻiroq'));
  await waitFor(() => expect(socket.sent).toContain(JSON.stringify({ type: 'call', action: 'ring' })));
  act(() => socket.receive({ type: 'call', call: { status: 'ringing', caller: 'me' } }));
  return { ...view, socket, onBack };
}

describe('leaving a call (docs/94 F5, C4)', () => {
  it('«Назад» asks to end the call; yes leaves, the microphone goes off and the other side hears it', async () => {
    const { socket, onBack, unmount } = await inCall();
    expect(sdk.closingBehavior.enableConfirmation.ifAvailable).toHaveBeenCalledOnce();
    asked.mockReturnValueOnce(false).mockReturnValueOnce(true);
    await act(async () => fireEvent.click(screen.getByText('Orqaga')));
    expect(asked).toHaveBeenCalledWith('Qoʻngʻiroqni tugatasizmi?');
    expect(onBack).not.toHaveBeenCalled();
    await act(async () => fireEvent.click(screen.getByText('Orqaga')));
    expect(onBack).toHaveBeenCalledOnce();
    expect(stop).not.toHaveBeenCalled();
    unmount();
    expect(stop).toHaveBeenCalled();
    expect(socket.sent).toContain(JSON.stringify({ type: 'call', action: 'end' }));
    expect(sdk.closingBehavior.disableConfirmation.ifAvailable).toHaveBeenCalledOnce();
  });

  it('without a call «Назад» leaves at once', async () => {
    const onBack = vi.fn();
    renderMarket(
      <ChatScreen chatKey={KEY} onBack={onBack} />,
      testClients({ chat: { socketUrl: async () => 'wss://api.test/socket' } }),
    );
    fireEvent.click(screen.getByText('Orqaga'));
    expect(onBack).toHaveBeenCalledOnce();
    expect(asked).not.toHaveBeenCalled();
  });

  it('C4: a call cut with the connection says it ended, it never just disappears', async () => {
    const { socket } = await inCall();
    act(() => socket.receive({ type: 'call', call: { status: 'active', caller: 'me' } }));
    act(() => socket.close());
    expect(screen.getByText('Qoʻngʻiroq tugadi')).toBeTruthy();
    expect(stop).toHaveBeenCalled();
  });
});
