import type { BrandConfig } from '@platform/brands';

// Colors come only from brands/<brand>/theme.ts (docs/20, docs/22). Light theme only, phone first.
export function styles({ theme }: BrandConfig) {
  const { colors } = theme;
  const driver = { ...colors, ...theme.apps.driver };
  return `:root{--bg:${colors.bg};--grouped:${colors.bgGrouped};--brand:${colors.brand};
--strong:${colors.brandStrong};--brand-text:${colors.brandText};--soft:${colors.brandSoft};
--deep:${colors.brandDeep};--accent:${colors.accent};--accent-text:${colors.accentText};
--driver:${driver.brandStrong};--text:${colors.text};--muted:${colors.textMuted};color-scheme:light}
*{box-sizing:border-box;margin:0}
body{font:17px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
color:var(--text);background:var(--grouped);-webkit-text-size-adjust:100%}
a{color:var(--brand-text)}
.wrap{max-width:960px;margin:0 auto;padding:0 20px}
header{background:var(--bg)}
header .wrap{display:flex;align-items:center;gap:10px;height:64px}
.brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:22px;color:var(--text);text-decoration:none}
.brand img{width:36px;height:36px}
.hero{background:var(--bg);padding:24px 0 40px;border-radius:0 0 28px 28px}
.slogan{display:inline-block;background:var(--accent);color:var(--text);font-weight:700;font-size:14px;
padding:4px 12px;border-radius:999px;margin-bottom:16px}
h1{font-size:32px;line-height:1.2;font-weight:800;margin-bottom:12px}
h2{font-size:24px;line-height:1.25;font-weight:800;margin-bottom:16px}
h3{font-size:18px;font-weight:700;margin-bottom:4px}
.lead{color:var(--muted);font-size:18px;margin-bottom:24px}
.actions{display:grid;gap:12px}
.button{display:block;text-align:center;padding:16px;border-radius:14px;font-weight:700;font-size:18px;
color:var(--bg);background:var(--strong);text-decoration:none}
.button.driver{background:var(--driver)}
.hint{color:var(--muted);font-size:15px;margin-top:12px}
section{padding:40px 0 0}
.cards{display:grid;gap:12px}
.card{background:var(--bg);border-radius:20px;padding:20px}
.card p,.steps li{color:var(--muted)}
.tile{display:inline-grid;place-items:center;width:44px;height:44px;border-radius:12px;
background:var(--strong);color:var(--bg);margin-bottom:12px}
.tile.driver{background:var(--driver)}
.card-head{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.card-head .tile{margin:0}
.steps{list-style:none;padding:0;counter-reset:step;display:grid;gap:12px}
.steps li{counter-increment:step;display:flex;gap:12px}
.steps li::before{content:counter(step);flex:none;display:grid;place-items:center;width:28px;height:28px;
border-radius:50%;background:var(--soft);color:var(--brand-text);font-weight:700;font-size:15px}
.final{text-align:center;padding:48px 0}
.final .actions{max-width:420px;margin:0 auto}
footer{background:var(--bg);padding:32px 0;font-size:15px;color:var(--muted)}
footer nav{display:grid;gap:8px;margin:8px 0 16px}
.document{background:var(--bg);border-radius:20px;padding:24px 20px;margin:16px 0 40px}
.document h2{font-size:19px;margin:24px 0 8px}
.document p{white-space:pre-line}
.edition{color:var(--muted);font-size:15px}
@media (min-width:720px){h1{font-size:44px}.hero{padding:48px 0 64px}
.actions{grid-template-columns:1fr 1fr;max-width:560px}.cards{grid-template-columns:repeat(3,1fr)}
.cards.two{grid-template-columns:1fr 1fr}.cards.four{grid-template-columns:1fr 1fr}}`;
}
