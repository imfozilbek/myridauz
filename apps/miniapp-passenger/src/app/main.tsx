import { mountApp } from '@platform/ui';
import { StartPage } from '../pages/start';

mountApp('passenger', StartPage, {
  welcome: {
    textKey: 'common.passenger.welcome',
    points: [
      { icon: 'team', textKey: 'common.welcome.verified' },
      { icon: 'price', textKey: 'common.welcome.shareCosts' },
    ],
  },
});
