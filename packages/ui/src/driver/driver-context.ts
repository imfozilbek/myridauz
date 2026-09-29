import type { DriverApplication } from '@platform/contracts';
import { createContext, useContext } from 'react';

// A driver inside the driver Mini App: approved, or waiting for the check and looking around
// (owner decision 29.09.2026). Their application and a way to change the car.
export type Driver = { readonly application: DriverApplication; readonly editCar: () => void };

export const DriverContext = createContext<Driver | null>(null);

// null outside the driver Mini App and before the application is sent.
export const useDriver = () => useContext(DriverContext);

// While the application is checked, publishing trips and seeing passengers' requests wait (docs/04).
export const usePending = () => useDriver()?.application.status === 'pending';
