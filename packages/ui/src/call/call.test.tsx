import type { CallsClient } from '@platform/api-client';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatScreen } from '../chat/chat-screen';
import { FakeSocket } from '../chat/fake-socket';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { FakePeer, fakeStream } from './fake-voice';

const KEY = 'b00000000-0000-4000-8000-0000000000b1';
const getUserMedia = vi.fn(async () => fakeStream());

beforeEach(() => {
  vi.stubGlobal('WebSocket', FakeSocket);
  vi.stubGlobal('RTCPeerConnection', FakePeer);
  vi.stubGlobal('navigator', { ...navigator, mediaDevices: { getUserMedia } });
  getUserMedia.mockClear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const calls: Partial<CallsClient> = {
  ice: async () => ({ iceServers: [] }),
  connect: vi.fn(async () => ({ sessionId: 's1', answer: 'sfu-answer' })),
  pull: async () => null,
  renegotiate: async () => undefined,
};

async function openChat() {
  renderMarket(
    <ChatScreen chatKey={KEY} title="Jasur" onBack={() => undefined} />,
    testClients({ chat: { socketUrl: async () => 'wss://api.test/socket' }, calls }),
  );
  await waitFor(() => expect(FakeSocket.last).not.toBeNull());
  const socket = FakeSocket.last as FakeSocket;
  act(() => {
    socket.open();
    socket.receive({ type: 'history', messages: [], canCall: true });
  });
  const sent = () => socket.sent.map((data) => JSON.parse(data) as Record<string, unknown>);
  return { socket, sent };
}

describe('a voice call in the chat (docs/08, G13)', () => {
  it('calls after the confirmation, shows the ring, and goes back to the chat when nobody answers', async () => {
    const { socket, sent } = await openChat();
    fireEvent.click(screen.getByText('Qoʻngʻiroq'));
    await waitFor(() => expect(sent()).toContainEqual({ type: 'call', action: 'ring' }));
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    act(() => socket.receive({ type: 'call', call: { status: 'ringing', caller: 'me' } }));
    expect(screen.getByText('Qoʻngʻiroq qilinmoqda…')).toBeTruthy();
    expect(screen.getByText('Ilovani yopmang: qoʻngʻiroq uziladi.')).toBeTruthy();
    act(() => {
      socket.receive({ type: 'call', call: null });
      socket.receive({ type: 'callEnded', reason: 'missed' });
    });
    expect(screen.getByText('Javob berilmadi')).toBeTruthy();
    fireEvent.click(screen.getByText('Chatga yozish'));
    expect(screen.queryByText('Javob berilmadi')).toBeNull();
  });

  it('answers an incoming call, starts the voice and hangs up', async () => {
    const { socket, sent } = await openChat();
    act(() => socket.receive({ type: 'call', call: { status: 'ringing', caller: 'other' } }));
    expect(screen.getByText('Sizga qoʻngʻiroq qilishyapti')).toBeTruthy();
    fireEvent.click(screen.getByText('Javob berish'));
    await waitFor(() => expect(sent()).toContainEqual({ type: 'call', action: 'accept' }));
    act(() => socket.receive({ type: 'call', call: { status: 'connecting', caller: 'other' } }));
    await waitFor(() => expect(sent().some((event) => event.type === 'callTrack')).toBe(true));
    act(() => FakePeer.last?.hears());
    expect(sent()).toContainEqual({ type: 'call', action: 'connected' });
    act(() => socket.receive({ type: 'call', call: { status: 'active', caller: 'other' } }));
    expect(screen.getByText('00:00')).toBeTruthy();
    fireEvent.click(screen.getByText('Ovozni oʻchirish'));
    expect(screen.getByText('Ovozni yoqish')).toBeTruthy();
    fireEvent.click(screen.getByText('Tugatish'));
    expect(sent()).toContainEqual({ type: 'call', action: 'end' });
  });

  it('declines at once and says so when the microphone is refused', async () => {
    getUserMedia.mockRejectedValueOnce(new Error('denied'));
    const { socket, sent } = await openChat();
    act(() => socket.receive({ type: 'call', call: { status: 'ringing', caller: 'other' } }));
    fireEvent.click(screen.getByText('Javob berish'));
    await waitFor(() => expect(sent()).toContainEqual({ type: 'call', action: 'decline' }));
    expect(screen.getByText('Mikrofonga ruxsat bering. Hozircha chatda yozing.')).toBeTruthy();
  });
});
