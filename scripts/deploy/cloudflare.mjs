// Small Cloudflare API client for deploy steps that wrangler does not cover (Pages domains, DNS).
const API = 'https://api.cloudflare.com/client/v4';

// A client of one key and one account: the deploy has the key of its job, the setup of the keys makes
// its own hour key (docs/189).
export const clientOf = (token, accountId) =>
  async function request(method, path, body) {
    const response = await fetch(`${API}${path.replace(':account', accountId)}`, {
      method,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: body && JSON.stringify(body),
    });
    const data = await response.json();
    // A missing object is a normal answer for "ensure" steps; everything else must stop the deploy.
    if (!data.success && response.status !== 404)
      throw new Error(`cloudflare ${method} ${path}: ${JSON.stringify(data.errors)}`);
    return data.success ? data.result : null;
  };

export const cloudflare = clientOf(process.env.CLOUDFLARE_API_TOKEN, process.env.CLOUDFLARE_ACCOUNT_ID);
