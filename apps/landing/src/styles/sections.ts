// The sections of the main page, phone first; wider screens get columns in interactive.ts.
export const sections = `.hero{padding:24px 0 32px;background:linear-gradient(var(--soft),var(--bg))}
.hero-grid{display:grid;gap:24px;align-items:center}
.slogan{display:inline-block;background:var(--accent);color:var(--text);font-weight:700;font-size:14px;
padding:4px 12px;border-radius:999px;margin-bottom:16px}
.lead{color:var(--muted);font-size:18px;margin-bottom:24px}
.hero-art img{border-radius:24px;animation:drive 4s ease-in-out infinite}
@keyframes drive{50%{transform:translateY(-6px)}}
.facts{list-style:none;display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:24px;color:var(--brand-text);font-weight:600;font-size:15px}
.facts li{display:flex;align-items:center;gap:6px}
.facts svg{width:18px;height:18px}
.pains{background:var(--grouped)}
.switch{display:inline-flex;background:var(--bg);border-radius:999px;padding:4px;margin-bottom:20px}
.switch button{border:0;background:none;font:inherit;font-weight:700;padding:8px 18px;border-radius:999px;color:var(--muted);cursor:pointer}
.switch button[aria-pressed=true]{background:var(--strong);color:var(--bg)}
.pain-list{list-style:none;padding:0;display:grid;gap:12px}
.pain{background:var(--bg);border-radius:20px;padding:18px;display:grid;grid-template-columns:44px 1fr;gap:4px 14px;align-items:start}
.pain .tile{grid-row:span 2;margin:0}
.pain .before{color:var(--muted);text-decoration:line-through;text-decoration-color:var(--danger)}
.pain .after{font-weight:600}
.js [data-side=before] .after,.js [data-side=after] .before{display:none}
.js [data-side=before] .before{color:var(--text);text-decoration:none;font-weight:600}
.js [data-side=before] .tile{background:var(--grouped);color:var(--muted)}
.tabs{display:inline-flex;gap:8px;margin-bottom:24px;flex-wrap:wrap}
.tabs button{display:flex;align-items:center;gap:8px;border:0;font:inherit;font-weight:700;padding:10px 18px;
border-radius:999px;background:var(--grouped);color:var(--text);cursor:pointer}
.tabs button[aria-selected=true]{background:var(--strong);color:var(--bg)}
.tabs button[data-tab=driver][aria-selected=true]{background:var(--driver)}
.path{display:none;gap:24px;align-items:center}
.path.shown{display:grid}
.phone{position:relative;width:min(330px,80vw);aspect-ratio:560/951;margin:0 auto}
.phone .screen{position:absolute;inset:0;opacity:0;transform:translateX(24px);transition:opacity .45s,transform .45s}
.phone .screen.shown{opacity:1;transform:none}
.steps{list-style:none;padding:0;display:grid;gap:8px;counter-reset:step}
.step button{width:100%;text-align:left;border:0;background:var(--grouped);border-radius:16px;padding:14px 16px 14px 56px;
font:inherit;color:var(--muted);cursor:pointer;position:relative;counter-increment:step}
.step button::before{content:counter(step);position:absolute;left:14px;top:14px;width:28px;height:28px;border-radius:50%;
display:grid;place-items:center;background:var(--bg);color:var(--brand-text);font-weight:700;font-size:15px}
.step b{display:block;color:var(--text)}
.step.active button{background:var(--soft);box-shadow:inset 3px 0 0 var(--strong)}
[data-path=driver] .step.active button{background:var(--driver-soft);box-shadow:inset 3px 0 0 var(--driver)}
.map{background:var(--grouped)}
.map-grid{display:grid;gap:20px;align-items:start}
.uz{width:100%;height:auto;background:var(--bg);border-radius:24px;padding:8px}
.route-form{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:end;margin-bottom:16px}
.place-select{display:grid;gap:4px;font-size:14px;color:var(--muted);font-weight:600}
.place-select select{font:inherit;font-size:17px;color:var(--text);font-weight:700;padding:12px 14px;border-radius:14px;
border:0;background:var(--bg);width:100%;appearance:none;cursor:pointer}
.swap{width:44px;height:44px;border-radius:50%;border:0;background:var(--bg);color:var(--brand-text);display:grid;
place-items:center;cursor:pointer;transform:rotate(90deg)}
.region{fill:var(--soft);stroke:var(--mint);stroke-width:2;cursor:pointer;transition:fill .2s}
.region:hover{fill:var(--mint)}
.region.from{fill:var(--mint)}
.region.to{fill:var(--brand)}
.route-line{fill:none;stroke:var(--driver);stroke-width:5;stroke-dasharray:12 10;stroke-linecap:round;animation:road 1s linear infinite}
@keyframes road{to{stroke-dashoffset:-22}}
.city-dot{fill:var(--brand-text);pointer-events:none;opacity:.6}
.origin-dot{fill:var(--from);stroke:var(--bg);stroke-width:4}
.target-dot{fill:var(--to);stroke:var(--bg);stroke-width:4}`;
