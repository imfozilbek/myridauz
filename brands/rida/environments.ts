import type { BrandEnvironment, EnvironmentName } from '../brand-config';
// 67 channels of directions over all districts (owner, 12.10.2026, docs/176): a district may be in
// several of them; Toshkent shahri has none (docs/15).
import channels from './channels.json' with { type: 'json' };

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
    channels: [],
    mainChannel: 'myrida_uz',
    // The team sees every post before people do (owner, 13.10.2026).
    posts: true,
  },
  production: {
    name: 'Rida',
    domain: 'ridaone.uz',
    indexed: true,
    bots: {
      passenger: 'rida1uz_bot',
      driver: 'rida1uz_haydovchi_bot',
      admin: 'rida1uz_admin_bot',
      support: 'rida1uz_yordam_bot',
      // The owner names the main bot of production before its waitlist opens (docs/181).
      main: '',
    },
    channels,
    mainChannel: 'rida1uz',
    // On only after the owner says yes to the posts for people (docs/33).
    posts: false,
  },
};
