export type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

// A Bot API call. Errors carry the Telegram method and code, never the token (docs/32).
export async function callTelegram(
  fetch: Fetch,
  token: string,
  method: string,
  params: object,
): Promise<void> {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) throw new Error(`telegram.${method}_${response.status}`);
}
