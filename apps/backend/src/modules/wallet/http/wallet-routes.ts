import { ADMIN_WALLETS_PATH, adjustmentSchema, WALLET_PATH, type ApiErrorCode } from '@platform/contracts';
import { Hono, type Context } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { sendSignals } from '../../feed';
import type { WalletDeps } from '../application/ports';
import { adjust, adminWallets, walletView } from '../application/wallet';

const STATUS = {
  'auth.not_admin': 403,
  'auth.not_owner': 403,
  'wallet.invalid_input': 400,
  'wallet.not_enough': 422,
} as const satisfies Partial<Record<ApiErrorCode, number>>;

const fail = (context: Context<AppEnv>, error: keyof typeof STATUS) => context.json({ error }, STATUS[error]);
const ONE = `${ADMIN_WALLETS_PATH}/:driverId{[0-9]+}`;
const driverOf = (context: Context<AppEnv>) => Number(context.req.param('driverId'));

// The driver sees the own wallet; the team sees every wallet; only an owner corrects one (docs/12).
export function walletRoutes(deps: (env: Bindings) => WalletDeps) {
  return new Hono<AppEnv>()
    .get(WALLET_PATH, async (context) =>
      context.json(await walletView(deps(context.env), context.get('session').user.id)),
    )
    .use(`${ADMIN_WALLETS_PATH}/*`, async (context, next) =>
      context.get('session').isAdmin ? next() : fail(context, 'auth.not_admin'),
    )
    .use(ADMIN_WALLETS_PATH, async (context, next) =>
      context.get('session').isAdmin ? next() : fail(context, 'auth.not_admin'),
    )
    .get(ADMIN_WALLETS_PATH, async (context) =>
      context.json({ wallets: await adminWallets(deps(context.env)) }),
    )
    .get(ONE, async (context) => context.json(await walletView(deps(context.env), driverOf(context))))
    .post(`${ONE}/adjust`, async (context) => {
      const session = context.get('session');
      if (session.teamRole !== 'owner') return fail(context, 'auth.not_owner');
      const input = adjustmentSchema.safeParse(await context.req.json().catch(() => null));
      if (!input.success) return fail(context, 'wallet.invalid_input');
      const result = await adjust(deps(context.env), session.user.id, driverOf(context), input.data);
      if (result !== 'ok') return fail(context, 'wallet.not_enough');
      // The driver's open Hamyon shows the adjustment at once (docs/64).
      await sendSignals(context.env, [{ userId: driverOf(context), app: 'driver' }]);
      return context.json(await walletView(deps(context.env), driverOf(context)));
    });
}
