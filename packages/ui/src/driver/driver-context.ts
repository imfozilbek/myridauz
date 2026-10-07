import type { DriverApplication } from '@platform/contracts';
import { createContext, useContext } from 'react';

// A driver inside the driver Mini App: approved, waiting for the check, or with an application
// not sent yet (G34), looking around (owner decision 29.09.2026). Their application (a draft
// one before sending) and a way to change the car or to fill the application.
export type Driver = { readonly application: DriverApplication; readonly editCar: () => void };

export const DriverContext = createContext<Driver | null>(null);

// null outside the driver Mini App and on the screens of the application itself.
export const useDriver = () => useContext(DriverContext);

// Until the application is approved, publishing trips and seeing passengers' requests wait (docs/04).
export const usePending = () => {
  const status = useDriver()?.application.status;
  return status === 'pending' || status === 'draft' || status === 'changes_requested';
};

// A driver who has not sent the application yet (G34): asked to fill it, not told it is checked.
export const useNotSent = () => useDriver()?.application.status === 'draft';
