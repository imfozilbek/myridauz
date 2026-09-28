// Small Cloudflare API client for deploy steps that wrangler does not cover (Pages domains, DNS).
const API = 'https://api.cloudflare.com/client/v4';
const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: accountId } = process.env;

export async function cloudflare(method, path, body) {
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
}
