import type { ApiErrorCode } from '@platform/contracts';
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { AppEnv } from '../../../env';

// An id of a booking, an offer or a trip in a path.
export const ONE = ':id{[0-9a-f-]{36}}';

// An error of the module as its code and HTTP status: the Mini App picks the text by the code.
export const failWith =
  <E extends ApiErrorCode>(statuses: Readonly<Record<E, ContentfulStatusCode>>) =>
  (context: Context<AppEnv>, error: E) =>
    context.json({ error }, statuses[error]);
