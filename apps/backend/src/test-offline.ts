// No test goes to the network (lesson 344): a bot message that reaches the real Telegram is slow,
// depends on the network of the machine and once held a test past its 5 s, so main never got to
// production. Every request answers here at once, as Telegram would; a test that needs another answer
// stubs fetch itself.
globalThis.fetch = async () => Response.json({ ok: true, result: { message_id: 1 } });
