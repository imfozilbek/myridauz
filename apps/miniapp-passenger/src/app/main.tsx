import { mountApp } from '@platform/ui';
import { StartPage } from '../pages/start';

mountApp('passenger', StartPage, {
  welcome: {
    icon: 'search',
    textKey: 'common.passenger.welcome',
    points: [
      { icon: 'team', textKey: 'common.welcome.verified' },
      { icon: 'price', textKey: 'common.welcome.shareCosts' },
      { icon: 'hidden', textKey: 'common.welcome.hidden' },
    ],
  },
});
