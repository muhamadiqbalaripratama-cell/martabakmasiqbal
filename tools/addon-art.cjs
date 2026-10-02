// Ilustrasi add-on (topping & tambahan isian) — gaya sama dengan menu-art.cjs.
// Hasil: backend/assets/addons/<id>.jpg (id sama dengan app/src/data/menu.ts).
//
//   node tools/addon-art.cjs backend/assets/addons
const { T, rng } = require('./menu-art.cjs');

const W = 480, H = 270;
const CX = 240, CY = 136, BR = 124; // mangkuk: pusat & jari-jari

function frame(bg, content, seed, extra = '') {
  const r = rng(seed);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="80%"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></radialGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="8"/></filter>
    <clipPath id="bowl"><circle cx="${CX}" cy="${CY}" r="${BR - 14}"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="60" cy="50" r="40" fill="#fff" opacity=".18"/><circle cx="430" cy="230" r="56" fill="#fff" opacity=".18"/>
  <ellipse cx="${CX + 6}" cy="${CY + 18}" rx="${BR}" ry="${BR * 0.92}" fill="#4a2a10" opacity=".22" filter="url(#soft)"/>
  <circle cx="${CX}" cy="${CY}" r="${BR}" fill="#ffffff"/>
  <circle cx="${CX}" cy="${CY}" r="${BR - 8}" fill="#f3eee4"/>
  <g clip-path="url(#bowl)">${content(r)}</g>
  <circle cx="${CX}" cy="${CY}" r="${BR - 8}" fill="none" stroke="#e6dfd0" stroke-width="3"/>
  ${extra}
</svg>`;
}

// Isi mangkuk: kotak area di dalam mangkuk untuk fungsi taburan T.*
const AREA = [CX - 86, CY - 86, 172, 172];
const pile = (fn, n) => (r) => {
  let s = '';
  for (let k = 0; k < n; k++) s += T[fn](...AREA, r);
  return s;
};
const fill = (color) => `<circle cx="${CX}" cy="${CY}" r="${BR}" fill="${color}"/>`;

const SPECS = {
  // ── Topping martabak manis ──
  t1: () => frame(['#fff6cf', '#f5d76e'], (r) => fill('#ffe58a') + pile('cheese', 6)(r)), // Keju
  t2: () => frame(['#f3e3d0', '#d9b28a'], (r) => fill('#8a5230') + pile('choco', 7)(r)), // Cokelat
  t3: () => frame(['#f6ead6', '#e2c08e'], (r) => fill('#e8c48f') + pile('peanut', 8)(r)), // Kacang
  t4: () => frame(['#f7efe0', '#e6d2ae'], (r) => fill('#d9a75a') + pile('sesame', 10)(r)), // Wijen
  t5: () =>
    frame(['#fbf4e6', '#ecd9b6'], () =>
      fill('#fff7e6') +
      `<path d="M${CX - 60} ${CY - 20} q 40 -40 80 0 t 40 30" fill="none" stroke="#fffdf8" stroke-width="16" stroke-linecap="round"/>` +
      `<ellipse cx="${CX - 22}" cy="${CY - 30}" rx="26" ry="10" fill="#ffffff" opacity=".9"/>`), // Susu kental
  t6: () => frame(['#fff6d6', '#f2d675'], (r) => fill('#f6e7a8') + pile('banana', 7)(r)), // Pisang
  t7: () =>
    frame(['#efe0d2', '#c99d7a'], () =>
      fill('#4a2412') +
      `<path d="M${CX - 50} ${CY + 10} q 20 -60 60 -30 q 40 30 0 50 q -30 14 -40 -14" fill="none" stroke="#6e3a1e" stroke-width="12" stroke-linecap="round"/>` +
      `<ellipse cx="${CX - 30}" cy="${CY - 34}" rx="22" ry="8" fill="#ffffff" opacity=".35"/>`), // Nutella
  t8: () =>
    frame(['#ececec', '#c9c9c9'], (r) => {
      let s = fill('#f4f1ec') + pile('oreo', 5)(r);
      for (const [dx, dy] of [[-40, -30], [30, -10], [-10, 40]]) {
        s += `<circle cx="${CX + dx}" cy="${CY + dy}" r="30" fill="#211a1a"/><circle cx="${CX + dx}" cy="${CY + dy}" r="22" fill="#2e2626"/><circle cx="${CX + dx}" cy="${CY + dy}" r="30" fill="none" stroke="#3a3030" stroke-width="2" stroke-dasharray="3 4"/>`;
      }
      return s;
    }), // Oreo
  t9: () =>
    frame(['#e5f0dc', '#b9d39f'], (r) => {
      let s = fill('#9cc56f');
      for (let k = 0; k < 120; k++) s += `<circle cx="${CX - 90 + r() * 180}" cy="${CY - 90 + r() * 180}" r="${1 + r() * 2.5}" fill="${r() < 0.5 ? '#7aab4e' : '#b6d98c'}"/>`;
      return s;
    }), // Greentea

  // ── Tambahan isian martabak telur ──
  x1: () =>
    frame(['#fff3d9', '#f0cf86'], () =>
      fill('#f6efe2') +
      `<path d="M${CX - 70} ${CY + 10} q -10 -60 50 -70 q 60 -10 80 40 q 20 50 -40 70 q -80 20 -90 -40z" fill="#ffffff"/>` +
      `<circle cx="${CX}" cy="${CY}" r="30" fill="#f7b72a"/><ellipse cx="${CX - 10}" cy="${CY - 10}" rx="10" ry="6" fill="#ffffff" opacity=".5"/>`), // Telur
  x2: () =>
    frame(['#f4e2d6', '#d8aa8c'], (r) => {
      let s = fill('#7a3d1d');
      for (let k = 0; k < 70; k++) s += `<circle cx="${CX - 85 + r() * 170}" cy="${CY - 85 + r() * 170}" r="${4 + r() * 7}" fill="${r() < 0.5 ? '#8e4a26' : '#6b3218'}"/>`;
      for (let k = 0; k < 14; k++) {
        const x = CX - 70 + r() * 140, y = CY - 70 + r() * 140;
        s += `<rect x="${x}" y="${y}" width="8" height="3" rx="1.5" fill="#4f9a3a" transform="rotate(${r() * 180} ${x} ${y})"/>`;
      }
      return s;
    }), // Daging
  x3: () =>
    frame(['#fbf7ee', '#e9dcc2'], (r) => {
      let s = fill('#fffaf0');
      for (let k = 0; k < 9; k++) {
        const x = CX - 70 + r() * 140, y = CY - 70 + r() * 140;
        s += `<path d="M${x} ${y} q ${20 + r() * 20} ${-20 + r() * 40} ${40 + r() * 20} ${r() * 10}" fill="none" stroke="#e8d9b8" stroke-width="10" stroke-linecap="round"/>`;
      }
      s += `<circle cx="${CX + 20}" cy="${CY + 10}" r="34" fill="#ffffff" stroke="#efe5cf" stroke-width="3"/>`;
      return s;
    }), // Mozzarella
  x4: () =>
    frame(['#f9e2dc', '#e3a796'], (r) => {
      let s = fill('#f3e7df');
      for (let k = 0; k < 9; k++) {
        const x = CX - 70 + r() * 140, y = CY - 70 + r() * 140;
        s += `<circle cx="${x}" cy="${y}" r="20" fill="#b9432c"/><circle cx="${x}" cy="${y}" r="15" fill="#e58b6f"/>`;
        for (let j = 0; j < 4; j++) s += `<circle cx="${x - 8 + r() * 16}" cy="${y - 8 + r() * 16}" r="1.6" fill="#fff3ea"/>`;
      }
      return s;
    }), // Sosis
};

module.exports = { SPECS };

if (require.main === module) {
  const { chromium } = require('playwright');
  const fs = require('fs');
  const out = process.argv[2];
  fs.mkdirSync(out, { recursive: true });
  (async () => {
    const b = await chromium.launch();
    const p = await b.newPage({ viewport: { width: W, height: H } });
    for (const id of Object.keys(SPECS)) {
      await p.setContent(`<body style="margin:0">${SPECS[id]()}</body>`);
      await p.screenshot({ path: `${out}/${id}.jpg`, type: 'jpeg', quality: 82, clip: { x: 0, y: 0, width: W, height: H } });
    }
    await b.close();
    console.log('rendered', Object.keys(SPECS).length);
  })();
}
