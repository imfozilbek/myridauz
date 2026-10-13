import { loadBrand } from '../../brands/index.ts';

// The brand and the environment of a command (docs/22, docs/179): --brand=<brand> --env=<internal|production>.
// A command that reaches Cloudflare or Telegram names both: production is never a silent default.
// The local stand runs the production config on the computer, it needs no environment.
export function targetOf(command, { remote = true } = {}) {
  const value = (name) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1];
  const [id, environment] = [value('brand'), value('env')];
  if (!id) throw new Error(`${command}: --brand=<brand> is required`);
  if (remote && !environment) throw new Error(`${command}: --env=<internal|production> is required`);
  return { brand: loadBrand(id, environment), environment };
}
