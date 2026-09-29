// A socket that the test drives: what the Mini App sends, and what the chat answers.
export class FakeSocket extends EventTarget {
  static last: FakeSocket | null = null;
  readonly sent: string[] = [];
  constructor(readonly url: string) {
    super();
    FakeSocket.last = this;
  }
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    this.dispatchEvent(new Event('close'));
  }
  open() {
    this.dispatchEvent(new Event('open'));
  }
  receive(data: object) {
    this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(data) }));
  }
}
