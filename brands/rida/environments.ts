import type { BrandEnvironment, EnvironmentName } from '../brand-config';
// 67 channels of directions over all districts (owner, 12.10.2026, docs/176): a district may be in
// several of them; Toshkent shahri has none (docs/15).
import channels from './channels.json' with { type: 'json' };

// The bots of production (docs/181: the main one, owner decision 15.10.2026).
const PRODUCTION_BOTS = {
  passenger: 'rida1uz_bot',
  driver: 'rida1uz_haydovchi_bot',
  admin: 'rida1uz_admin_bot',
  support: 'rida1uz_yordam_bot',
  main: 'ridauz_bot',
};

// Two environments (owner, 13.10.2026, docs/179): production for people on its own Cloudflare account,
// the internal one of the team on the first account, with its own bots and channels.
export const environments: Readonly<Record<EnvironmentName, BrandEnvironment>> = {
  internal: {
    // The team never mixes up its bots with the ones of people (owner, 13.10.2026).
    name: 'MyRida',
    domain: 'myrida.uz',
    indexed: false,
    bots: {
      passenger: 'myrida_bot',
      driver: 'myrida_haydovchi_bot',
      admin: 'myrida_admin_bot',
      support: 'myrida_support_bot',
      // The main bot «MyRida» of the waitlist (owner decision 14.10.2026, docs/181).
      main: 'myridauz_bot',
    },
    // Only the team works here; anyone else is sent to the bots of production (owner, 17.10.2026).
    teamOnly: PRODUCTION_BOTS,
    // One private channel of every direction (owner, 13.10.2026): a trip from any place goes there. The
    // avatar of a region stands in for its own picture (G84).
    channels: [
      {
        chat: '-1004497717884',
        title: 'Viloyatlar',
        name: 'MyRida | Viloyatlar',
        code: '10',
        places: [...new Set(channels.flatMap((channel) => channel.places))],
        link: 'https://t.me/+CcXbhDy1iD0yNmYy',
      },
    ],
    mainChannel: 'myrida_uz',
    // The team sees every post before people do (owner, 13.10.2026).
    posts: true,
  },
  production: {
    name: 'Rida',
    domain: 'ridaone.uz',
    indexed: true,
    bots: PRODUCTION_BOTS,
    teamOnly: null,
    channels,
    mainChannel: 'rida1uz',
    // The owner said yes to the posts for people (17.10.2026, docs/33): the trips go to the channels.
    posts: true,
  },
};
