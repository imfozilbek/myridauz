import {
  ADMIN_WALLETS_PATH,
  adminWalletAdjustPath,
  adminWalletPath,
  adminWalletsSchema,
  WALLET_PATH,
  walletDetailSchema,
  walletOperationPath,
  walletSchema,
  type AdminWallets,
  type Adjustment,
  type Wallet,
  type WalletDetail,
  type PersonId,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// The driver's wallet and the team's view of all wallets (docs/12, G08).
export function createWalletClient(options: SignedOptions) {
  const { request, post } = signedRequest(options);
  const wallet = async (response: Response) => walletSchema.parse(await response.json());
  return {
    mine: async (): Promise<Wallet> => wallet(await request(WALLET_PATH)),
    // A commission or its refund «Qaytarildi» of the driver's «Hamyon» (G65, mockup g65/2).
    detail: async (operationId: string): Promise<WalletDetail> =>
      walletDetailSchema.parse(await (await request(walletOperationPath(operationId))).json()),
    // One page of "Hamyonlar" (G42): 0 is the first.
    all: async (page = 0): Promise<AdminWallets> =>
      adminWalletsSchema.parse(await (await request(`${ADMIN_WALLETS_PATH}?page=${page}`)).json()),
    of: async (driverId: PersonId): Promise<Wallet> => wallet(await request(adminWalletPath(driverId))),
    adjust: async (driverId: PersonId, input: Adjustment): Promise<Wallet> =>
      wallet(await post(adminWalletAdjustPath(driverId), input)),
  };
}

export type WalletClient = ReturnType<typeof createWalletClient>;
