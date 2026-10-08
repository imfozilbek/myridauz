import type { ApiErrorCode } from '@platform/contracts';
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { AppEnv } from '../../../env';

// An error of the module as its code and HTTP status: the Mini App picks the text by the code.
export const failWith =
  <E extends ApiErrorCode>(statuses: Readonly<Record<E, ContentfulStatusCode>>) =>
  (context: Context<AppEnv>, error: E) =>
    context.json({ error }, statuses[error]);
