import { mountApp } from '@platform/ui';
import { StartPage } from '../pages/start';

mountApp('passenger', StartPage, { welcome: { icon: 'search', textKey: 'common.passenger.welcome' } });
