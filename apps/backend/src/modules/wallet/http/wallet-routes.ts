import { ADMIN_WALLETS_PATH, adjustmentSchema, WALLET_PATH, type ApiErrorCode } from '@platform/contracts';
import { Hono, type Context } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { sendSignals } from '../../feed';
import type { WalletDeps } from '../application/ports';
import { adminWallets } from '../application/admin-wallets';
import { adjust } from '../application/wallet';
import { walletDetail } from '../application/wallet-detail';
import { walletView } from '../application/wallet-view';

const STATUS = {
  'auth.not_admin': 403,
  'auth.not_owner': 403,
  'wallet.invalid_input': 400,
  'wallet.not_enough': 422,
  'wallet.not_found': 404,
} as const satisfies Partial<Record<ApiErrorCode, number>>;

const fail = (context: Context<AppEnv>, error: keyof typeof STATUS) => context.json({ error }, STATUS[error]);
const ONE = `${ADMIN_WALLETS_PATH}/:driverId{[0-9a-f]+}`;

// The driver sees the own wallet; the team sees every wallet; only an owner corrects one (docs/12).
// The page of "Hamyonlar" from the address: 0 when it is missing or wrong (G42).
const pageOf = (value: string | undefined) => Math.max(0, Math.floor(Number(value) || 0));

export function walletRoutes(deps: (env: Bindings) => WalletDeps) {
  // The path carries the public id (docs/65 A3); 0 is nobody.
  const driverOf = async (context: Context<AppEnv>) =>
    (await deps(context.env).people.idOf(context.req.param('driverId') ?? '')) ?? 0;
  return (
    new Hono<AppEnv>()
      .get(WALLET_PATH, async (context) =>
        context.json(await walletView(deps(context.env), context.get('session').user.id)),
      )
      // The details of a commission or its refund (G65): only the driver's own operation.
      .get(`${WALLET_PATH}/:operationId`, async (context) => {
        const { id } = context.get('session').user;
        const detail = await walletDetail(deps(context.env), id, context.req.param('operationId'));
        return detail ? context.json(detail) : fail(context, 'wallet.not_found');
      })
      .use(`${ADMIN_WALLETS_PATH}/*`, async (context, next) =>
        context.get('session').isAdmin ? next() : fail(context, 'auth.not_admin'),
      )
      .use(ADMIN_WALLETS_PATH, async (context, next) =>
        context.get('session').isAdmin ? next() : fail(context, 'auth.not_admin'),
      )
      .get(ADMIN_WALLETS_PATH, async (context) =>
        context.json(await adminWallets(deps(context.env), pageOf(context.req.query('page')))),
      )
      .get(ONE, async (context) => context.json(await walletView(deps(context.env), await driverOf(context))))
      .post(`${ONE}/adjust`, async (context) => {
        const session = context.get('session');
        if (session.teamRole !== 'owner') return fail(context, 'auth.not_owner');
        const input = adjustmentSchema.safeParse(await context.req.json().catch(() => null));
        if (!input.success) return fail(context, 'wallet.invalid_input');
        const driverId = await driverOf(context);
        const result = await adjust(deps(context.env), session.user.id, driverId, input.data);
        if (result !== 'ok') return fail(context, 'wallet.not_enough');
        // The driver's open Hamyon shows the adjustment at once (docs/64).
        await sendSignals(context.env, [{ userId: driverId, app: 'driver' }]);
        return context.json(await walletView(deps(context.env), driverId));
      })
  );
}
