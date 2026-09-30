// Frame of every page: type, header, buttons, cards, footer, documents.
export const base = `*{box-sizing:border-box;margin:0}
html{scroll-behavior:smooth}
body{font:17px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
color:var(--text);background:var(--bg);-webkit-text-size-adjust:100%}
a{color:var(--brand-text)}
img{max-width:100%;height:auto;display:block}
svg{flex:none}
.wrap{max-width:1080px;margin:0 auto;padding:0 20px}
.narrow{max-width:760px}
header{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--bg) 92%,transparent);
backdrop-filter:blur(12px);border-bottom:1px solid var(--grouped)}
header .wrap{display:flex;align-items:center;justify-content:space-between;height:64px}
.brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:22px;color:var(--text);text-decoration:none}
.brand img{width:36px;height:36px}
h1{font-size:36px;line-height:1.12;font-weight:800;letter-spacing:-.02em;margin-bottom:14px}
h2{font-size:28px;line-height:1.2;font-weight:800;letter-spacing:-.01em;margin-bottom:12px}
h3{font-size:18px;font-weight:700;margin-bottom:4px}
section{padding:56px 0}
.section-lead{color:var(--muted);font-size:18px;margin-bottom:24px;max-width:640px}
.button{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:16px 22px;border-radius:14px;
font-weight:700;font-size:18px;color:var(--bg);background:var(--strong);text-decoration:none;border:0;cursor:pointer;
transition:transform .15s,box-shadow .15s;box-shadow:0 8px 20px -10px var(--strong)}
.button:hover{transform:translateY(-2px)}
.button.driver{background:var(--driver);box-shadow:0 8px 20px -10px var(--driver)}
.button.small{padding:10px 16px;font-size:16px;border-radius:12px;box-shadow:none}
.button.wide{display:flex;max-width:420px;margin-top:24px}
.actions{display:grid;gap:12px}
.hint{color:var(--muted);font-size:15px;margin-top:12px}
.tile{display:inline-grid;place-items:center;width:44px;height:44px;border-radius:12px;background:var(--strong);
color:var(--bg);margin-bottom:12px}
.tile.amber{background:var(--driver)}
.tile.soft{background:var(--soft);color:var(--brand-text)}
.cards{list-style:none;padding:0;display:grid;gap:12px}
.card{background:var(--bg);border-radius:20px;padding:20px;box-shadow:0 1px 0 var(--grouped),0 10px 30px -24px var(--text)}
.card p{color:var(--muted)}
footer{background:var(--grouped);padding:32px 0;font-size:15px;color:var(--muted)}
footer nav{display:grid;gap:8px;margin:8px 0 16px}
.document{background:var(--bg);border-radius:20px;padding:24px 20px;margin:16px 0 40px}
.document h2{font-size:19px;margin:24px 0 8px}
.document p{white-space:pre-line}
.edition{color:var(--muted);font-size:15px}
main:has(.document){background:var(--grouped);padding-top:1px}`;
