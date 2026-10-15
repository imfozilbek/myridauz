import { brandForApp } from '@platform/brands';
import type { WaitlistRole } from '@platform/contracts';
import { useMemo, type ReactNode } from 'react';
import { BrandContext, useBrand } from '../context/brand-context';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import './waitlist.css';
import './waitlist-more.css';

type Props = { readonly role: WaitlistRole | null; readonly children: ReactNode };

// After the role the app takes its color (docs/181, mockup 2): the passenger teal, the driver amber.
// The native main button of Telegram reads the same brand, so it changes color too.
export function RoleBrand({ role, children }: Props) {
  useScreenBackground();
  const brand = useBrand();
  const colored = useMemo(
    () => brandForApp(brand, role === 'driver' ? 'driver' : 'passenger'),
    [brand, role],
  );
  return (
    <BrandContext.Provider value={colored}>
      <div className="wl" style={brandVars(colored.theme.colors)}>
        {children}
      </div>
    </BrandContext.Provider>
  );
}
