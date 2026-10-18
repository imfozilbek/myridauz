import { mountApp } from '@platform/ui';
import { StartPage } from '../pages/start';

mountApp('driver', StartPage, {
  welcome: {
    logo: 'logo-driver.svg',
    points: [
      { icon: 'price', textKey: 'common.welcome.ownPrice' },
      { icon: 'bonus', textKey: 'common.welcome.bonus' },
      { icon: 'passengers', textKey: 'common.welcome.passengersFind' },
    ],
  },
});
