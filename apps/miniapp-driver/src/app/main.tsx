import { mountApp } from '@platform/ui';
import { StartPage } from '../pages/start';

mountApp('driver', StartPage, {
  welcome: {
    icon: 'newTrip',
    textKey: 'common.driver.welcome',
    points: [
      { icon: 'price', textKey: 'common.welcome.costsBack' },
      { icon: 'wallet', textKey: 'common.welcome.bonus' },
      { icon: 'hidden', textKey: 'common.welcome.hidden' },
    ],
  },
});
