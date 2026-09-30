// The directions list and the page of one direction (docs/60).
export const pages = `.directions h3{font-size:17px;margin:16px 0 8px;color:var(--muted)}
.direction-groups{display:grid;gap:8px}
.direction-list{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px}
.direction-list a{display:flex;align-items:center;gap:6px;padding:12px 14px;border-radius:14px;background:var(--grouped);
color:var(--text);font-weight:600;text-decoration:none;font-size:15px}
.direction-list a:hover{background:var(--soft)}
.direction-list a[aria-current]{background:var(--strong);color:var(--bg)}
.crumbs{display:flex;gap:8px;font-size:14px;color:var(--muted);margin-bottom:16px}
.crumbs a{color:var(--brand-text)}
.numbers{padding:8px 0 32px}
.number-list{list-style:none;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:12px}
.number-list li{background:var(--soft);border-radius:20px;padding:18px}
.number-list b{display:block;font-size:44px;line-height:1;font-weight:800;color:var(--strong);letter-spacing:-.02em;
font-variant-numeric:tabular-nums}
.number-list span{display:block;margin-top:6px;color:var(--text);font-weight:600;font-size:15px}
@media(min-width:900px){.direction-groups{grid-template-columns:1fr 1fr;gap:32px}
.number-list{grid-template-columns:repeat(4,1fr);gap:16px}.number-list b{font-size:56px}}`;
