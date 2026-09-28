import {
  DRIVER_APPLICATION_PATH,
  driverApplicationResponseSchema,
  driverPhotoPath,
  type CarInput,
  type CarPhotoKind,
  type DriverApplication,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// The driver's own application (docs/04), from the driver Mini App.
export function createDriversClient(options: SignedOptions) {
  const { request, post, put } = signedRequest(options);
  const application = async (response: Response) =>
    driverApplicationResponseSchema.parse(await response.json()).application;
  return {
    getApplication: async (): Promise<DriverApplication | null> =>
      application(await request(DRIVER_APPLICATION_PATH)),
    uploadPhoto: async (kind: CarPhotoKind, image: Blob) =>
      application(await put(driverPhotoPath(kind), image)),
    submit: async (car: CarInput) => application(await post(DRIVER_APPLICATION_PATH, car)),
    getPhoto: async (kind: CarPhotoKind): Promise<Blob> => (await request(driverPhotoPath(kind))).blob(),
  };
}

export type DriversClient = ReturnType<typeof createDriversClient>;
