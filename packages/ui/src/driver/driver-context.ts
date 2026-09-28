import type { DriverApplication } from '@platform/contracts';
import { createContext, useContext } from 'react';

// An approved driver inside the driver Mini App: their application and a way to change the car.
export type Driver = { readonly application: DriverApplication; readonly editCar: () => void };

export const DriverContext = createContext<Driver | null>(null);

// null outside the driver Mini App and before approval.
export const useDriver = () => useContext(DriverContext);
