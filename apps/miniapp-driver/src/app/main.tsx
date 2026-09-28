import { mountApp } from '@platform/ui';
import { StartPage } from '../pages/start';

mountApp('driver', StartPage, { welcome: { icon: 'newTrip', textKey: 'common.driver.welcome' } });
