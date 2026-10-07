import { mountApp } from '@platform/ui';
import { StartPage } from '../pages/start';

mountApp('passenger', StartPage, {
  welcome: {
    logo: 'logo.svg',
    points: [
      { icon: 'team', textKey: 'common.welcome.verified' },
      { icon: 'price', textKey: 'common.welcome.shareCosts' },
      { icon: 'hidden', textKey: 'account.about.hidden' },
    ],
  },
});
