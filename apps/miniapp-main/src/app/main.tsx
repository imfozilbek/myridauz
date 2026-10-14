import { mountApp } from '@platform/ui';
import { StartPage } from '../pages/start';

// The Mini App of the main bot: the waitlist, no registration (G83, docs/181).
mountApp('main', StartPage);
