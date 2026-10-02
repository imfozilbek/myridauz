import { mountApp } from '@platform/ui';
import { StartPage } from '../pages/start';

mountApp('driver', StartPage, {
  welcome: {
    textKey: 'common.driver.welcome',
    points: [
      { icon: 'price', textKey: 'common.welcome.costsBack' },
      { icon: 'bonus', textKey: 'common.welcome.bonus' },
      { icon: 'passengers', textKey: 'common.welcome.passengersFind' },
    ],
  },
});
