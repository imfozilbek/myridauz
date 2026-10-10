import { createContext, useContext } from 'react';
import type { HomeGo } from './start-action';

// The main screen of the app (G38, docs/103): after a finished action «Назад» and «Tayyor» go there,
// never back into the steps of the wizard. Outside the main screen the screen's own way back.
const HomeContext = createContext<(() => void) | null>(null);

export const HomeProvider = HomeContext.Provider;

export const useGoHome = (fallback: () => void) => useContext(HomeContext) ?? fallback;

// The sections of the main screen open one another (G76): an empty «Suhbatlar» opens the search.
const HomeGoContext = createContext<HomeGo | null>(null);

export const HomeGoProvider = HomeGoContext.Provider;

export const useHomeGo = (): HomeGo | null => useContext(HomeGoContext);
