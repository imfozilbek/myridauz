// The rest of the page and the wider screens: map card, cards, Telegram, questions, finale, sticky bar.
export const interactive = `.map-card{background:var(--bg);border-radius:24px;padding:20px;display:grid;gap:12px}
.route-name{display:flex;align-items:center;gap:8px;font-size:20px;font-weight:700}
.route-name svg{color:var(--to)}
.route-name .arrow{color:var(--muted)}
.km{color:var(--muted);min-height:1.5em}
.price-row,.seats-row{display:grid;gap:2px;background:var(--soft);border-radius:16px;padding:12px 14px}
.price-row strong,.seats-row strong{font-size:26px;color:var(--brand-text)}
.price-row small{color:var(--muted)}
.seats-row{background:var(--driver-soft)}
.seats-row strong{color:var(--accent-text)}
.stepper{display:flex;align-items:center;gap:12px}
.stepper button{width:40px;height:40px;border-radius:50%;border:0;background:var(--bg);display:grid;place-items:center;cursor:pointer;color:var(--text)}
.stepper output{font-size:22px;font-weight:800;min-width:1ch;text-align:center}
.go-hint{color:var(--muted);font-size:14px;margin-top:-4px}
.channel{display:flex;align-items:center;gap:8px;font-weight:700;text-decoration:none}
.driver-side{background:linear-gradient(var(--driver-soft),var(--bg))}
.telegram{background:var(--soft)}
.tg-grid{display:grid;gap:24px;align-items:center}
.phone.single .screen{position:static;opacity:1;transform:none}
.chips{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:8px}
.chips a{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;background:var(--bg);
text-decoration:none;font-weight:600;font-size:15px}
.chips svg{width:16px;height:16px}
.chips .code{background:var(--strong);color:var(--bg);border-radius:8px;padding:0 6px;font-size:13px}
details{background:var(--grouped);border-radius:16px;padding:0 18px;margin-bottom:8px}
summary{list-style:none;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:16px 0;font-weight:700;cursor:pointer}
summary::-webkit-details-marker{display:none}
summary svg{transition:transform .2s;color:var(--muted)}
details[open] summary svg{transform:rotate(180deg)}
details p{color:var(--muted);padding-bottom:16px}
.final{text-align:center;background:var(--deep);color:var(--bg)}
.final .crowd{margin:0 auto 16px;width:min(420px,90%);border-radius:28px}
.final-slogan{color:var(--mint);font-size:20px;font-weight:700;margin-bottom:24px}
.final .actions{max-width:420px;margin:0 auto}
.sticky{position:fixed;left:0;right:0;bottom:0;z-index:30;padding:10px 16px calc(10px + env(safe-area-inset-bottom));
background:color-mix(in srgb,var(--bg) 94%,transparent);backdrop-filter:blur(12px);box-shadow:0 -8px 24px -18px var(--text);
transform:translateY(110%);transition:transform .3s}
.sticky.on{transform:none}
.actions.compact{grid-template-columns:1fr 1fr;gap:8px}
.actions.compact .button{padding:12px 8px;font-size:16px}
.js .reveal{opacity:0;transform:translateY(16px);transition:opacity .5s,transform .5s}
.js .reveal.in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}.js .reveal{opacity:1;transform:none}}
@media (min-width:720px){h1{font-size:54px}h2{font-size:36px}section{padding:80px 0}
.hero-grid{grid-template-columns:1.1fr 1fr}.actions{grid-template-columns:1fr 1fr;max-width:520px}
.path.shown{grid-template-columns:340px 1fr}.map-grid{grid-template-columns:1.4fr 1fr}
.tg-grid{grid-template-columns:340px 1fr}.cards{grid-template-columns:repeat(3,1fr)}
.pain-list{grid-template-columns:1fr 1fr}.sticky{display:none}}`;
