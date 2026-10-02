// Generator ilustrasi menu bawaan Martabak Mas Iqbal (SVG → JPG via Chromium).
// Hasilnya ada di backend/assets/menu/<id>.jpg. Hanya perlu dijalankan ulang
// kalau ingin mengubah gaya ilustrasi; foto asli cukup di-upload lewat
// menu "Kelola Menu".
//
//   npm i -D playwright && npx playwright install chromium
//   node tools/menu-art.cjs backend/assets/menu
const W = 640, H = 400;

// RNG deterministik supaya hasil sama setiap dijalankan.
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const hash = (str) => [...str].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

const BG = {
  manis: ['#fbefd6', '#f1d7a6'],
  asin: ['#f9ead0', '#e9c993'],
  drink: ['#e7f1e3', '#c9dfc0'],
  paket: ['#fdf1cf', '#f2d27c'],
};

function background(cat, extra = '') {
  const [a, b] = BG[cat];
  return `
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="75%">
      <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
    </radialGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="10"/></filter>
    <filter id="soft4"><feGaussianBlur stdDeviation="4"/></filter>
    <linearGradient id="crust" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#d9913a"/><stop offset="1" stop-color="#a8611f"/>
    </linearGradient>
    <linearGradient id="kraft" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e2bd84"/><stop offset="1" stop-color="#c99a5b"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".55"/>
      <stop offset=".25" stop-color="#ffffff" stop-opacity=".15"/>
      <stop offset=".8" stop-color="#ffffff" stop-opacity=".05"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity=".4"/>
    </linearGradient>
    ${extra}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <g opacity=".18" fill="#ffffff">
    <circle cx="70" cy="60" r="46"/><circle cx="590" cy="350" r="70"/><circle cx="600" cy="40" r="22"/>
  </g>`;
}

// ── Taburan / topping ────────────────────────────────────────────────
// Semua fungsi menggambar di dalam kotak (x,y,w,h); r = rng.
const T = {
  choco(x, y, w, h, r, n = 22) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const cx = x + 6 + r() * (w - 12), cy = y + 6 + r() * (h - 12), a = r() * 180;
      const c = r() < 0.5 ? '#4a2614' : '#6b3a1e';
      s += `<rect x="${cx - 5}" y="${cy - 1.6}" width="10" height="3.2" rx="1.6" fill="${c}" transform="rotate(${a} ${cx} ${cy})"/>`;
    }
    return s;
  },
  cheese(x, y, w, h, r, n = 16) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const cx = x + 6 + r() * (w - 12), cy = y + 6 + r() * (h - 12), a = r() * 180;
      s += `<rect x="${cx - 9}" y="${cy - 2}" width="18" height="4" rx="2" fill="${r() < 0.5 ? '#ffe680' : '#ffd84a'}" stroke="#e8b923" stroke-width=".6" transform="rotate(${a} ${cx} ${cy})"/>`;
    }
    return s;
  },
  peanut(x, y, w, h, r, n = 10) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const cx = x + 8 + r() * (w - 16), cy = y + 8 + r() * (h - 16);
      s += `<ellipse cx="${cx}" cy="${cy}" rx="${4 + r() * 2}" ry="${3 + r() * 1.5}" fill="#c98f4e" stroke="#9c6a33" stroke-width=".8" transform="rotate(${r() * 180} ${cx} ${cy})"/>`;
    }
    return s;
  },
  sesame(x, y, w, h, r, n = 30) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const cx = x + 4 + r() * (w - 8), cy = y + 4 + r() * (h - 8);
      s += `<ellipse cx="${cx}" cy="${cy}" rx="2.2" ry="1.2" fill="#fff6e0" transform="rotate(${r() * 180} ${cx} ${cy})"/>`;
    }
    return s;
  },
  milk(x, y, w, h, r) {
    // drizzle susu kental manis zig-zag
    const y0 = y + h * (0.3 + r() * 0.3);
    const d = `M${x + 8} ${y0} C ${x + w * 0.3} ${y0 - 18}, ${x + w * 0.55} ${y0 + 22}, ${x + w - 8} ${y0 - 4}`;
    return `<path d="${d}" fill="none" stroke="#fffaf0" stroke-width="3.5" stroke-linecap="round" opacity=".95"/>`;
  },
  banana(x, y, w, h, r, n = 4) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const cx = x + 12 + r() * (w - 24), cy = y + 12 + r() * (h - 24);
      s += `<circle cx="${cx}" cy="${cy}" r="9" fill="#fff3b8" stroke="#e8c96a" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="2.5" fill="#d9b85a" opacity=".7"/>`;
    }
    return s;
  },
  oreo(x, y, w, h, r, n = 18) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const cx = x + 6 + r() * (w - 12), cy = y + 6 + r() * (h - 12);
      s += `<path d="M${cx} ${cy} l${3 + r() * 4} ${-2 - r() * 3} l${2 + r() * 3} ${4 + r() * 3} z" fill="#1f1a1a"/>`;
    }
    return s;
  },
  cocoa(x, y, w, h, r, n = 40) {
    let s = '';
    for (let i = 0; i < n; i++) s += `<circle cx="${x + r() * w}" cy="${y + r() * h}" r="${0.8 + r() * 1.4}" fill="#4a2614" opacity=".55"/>`;
    return s;
  },
  cream(x, y, w, h, r) {
    let s = '';
    const cx = x + w * 0.5 + (r() - 0.5) * 10, cy = y + h * 0.5 + (r() - 0.5) * 10;
    s += `<path d="M${cx - 16} ${cy + 6} q 4 -18 16 -18 q 12 0 16 18 z" fill="#fff8ef"/><circle cx="${cx}" cy="${cy - 14}" r="5" fill="#fff8ef"/><circle cx="${cx - 5}" cy="${cy - 4}" r="3" fill="#ffffff"/>`;
    return s;
  },
};

// ── Martabak manis: kotak kraft berisi potongan ──────────────────────
function manis(spec, seed) {
  const r = rng(seed);
  const cols = spec.cols ?? 4, rows = spec.rows ?? 2;
  const bx = 92, by = 86, bw = 456, bh = 250;
  let s = background('manis');
  s += `<ellipse cx="320" cy="350" rx="250" ry="26" fill="#7a4a1a" opacity=".22" filter="url(#soft)"/>`;
  s += `<rect x="${bx - 14}" y="${by - 14}" width="${bw + 28}" height="${bh + 28}" rx="18" fill="url(#kraft)"/>`;
  s += `<rect x="${bx - 6}" y="${by - 6}" width="${bw + 12}" height="${bh + 12}" rx="12" fill="#f7ead2"/>`;
  const gap = 8;
  const pw = (bw - gap * (cols - 1)) / cols, ph = (bh - gap * (rows - 1)) / rows;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = bx + i * (pw + gap), y = by + j * (ph + gap);
      const round = spec.round ? Math.min(pw, ph) / 2 : 10;
      // sisi/kulit bawah (kesan tebal)
      s += `<rect x="${x}" y="${y + 6}" width="${pw}" height="${ph}" rx="${round}" fill="url(#crust)"/>`;
      // permukaan isian
      const base = typeof spec.base === 'function' ? spec.base(i, j) : spec.base;
      s += `<rect x="${x}" y="${y}" width="${pw}" height="${ph - 6}" rx="${round}" fill="${base}"/>`;
      s += `<rect x="${x + 3}" y="${y + 3}" width="${pw - 6}" height="${(ph - 6) * 0.35}" rx="${Math.max(4, round - 3)}" fill="#ffffff" opacity=".12"/>`;
      // pinggiran kulit tipis kiri-kanan
      s += `<rect x="${x}" y="${y}" width="${pw}" height="${ph - 6}" rx="${round}" fill="none" stroke="#b06a24" stroke-width="3" opacity=".55"/>`;
      const top = spec.top(i, j);
      for (const t of top) s += T[t](x + 2, y + 2, pw - 4, ph - 10, r);
    }
  }
  if (spec.badge) s += badge(spec.badge);
  return s;
}

// ── Martabak telur: potongan kotak renyah dengan isian ───────────────
function telur(spec, seed) {
  const r = rng(seed);
  const cols = spec.cols ?? 3, rows = spec.rows ?? 2;
  const bx = 70, by = 92, bw = 380, bh = 236;
  let s = background('asin');
  s += `<ellipse cx="300" cy="350" rx="260" ry="26" fill="#7a4a1a" opacity=".22" filter="url(#soft)"/>`;
  // piring
  s += `<ellipse cx="260" cy="214" rx="236" ry="158" fill="#ffffff"/><ellipse cx="260" cy="214" rx="214" ry="140" fill="#f6f1e7"/>`;
  const gap = 10;
  const pw = (bw - gap * (cols - 1)) / cols, ph = (bh - gap * (rows - 1)) / rows;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = bx + i * (pw + gap), y = by + j * (ph + gap);
      s += `<rect x="${x}" y="${y + 7}" width="${pw}" height="${ph - 4}" rx="10" fill="#a8621f"/>`;
      s += `<rect x="${x}" y="${y}" width="${pw}" height="${ph - 8}" rx="10" fill="#e3a646"/>`;
      // tekstur kulit renyah
      for (let k = 0; k < 6; k++) {
        const yy = y + 8 + r() * (ph - 26);
        s += `<path d="M${x + 6} ${yy} q ${pw / 2} ${-6 + r() * 12} ${pw - 12} 0" stroke="#c97f2c" stroke-width="2" fill="none" opacity=".6"/>`;
      }
      // potongan depan memperlihatkan isian (pita bawah)
      const fy = y + ph - 30;
      s += `<rect x="${x + 4}" y="${fy}" width="${pw - 8}" height="20" rx="6" fill="${spec.egg}"/>`;
      for (let k = 0; k < 9; k++) {
        const cx = x + 8 + r() * (pw - 16), cy = fy + 4 + r() * 12;
        s += `<circle cx="${cx}" cy="${cy}" r="${1.6 + r() * 1.8}" fill="${spec.meat}"/>`;
      }
      for (let k = 0; k < 7; k++) {
        const cx = x + 8 + r() * (pw - 16), cy = fy + 4 + r() * 12;
        s += `<rect x="${cx}" y="${cy}" width="5" height="2.4" rx="1.2" fill="#4f9a3a" transform="rotate(${r() * 180} ${cx} ${cy})"/>`;
      }
      if (spec.mozz) for (let k = 0; k < 3; k++) {
        const cx = x + 10 + r() * (pw - 30);
        s += `<path d="M${cx} ${fy + 2} q 6 10 14 2" stroke="#fffdf5" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      }
    }
  }
  // mangkuk acar
  s += `<ellipse cx="540" cy="300" rx="62" ry="20" fill="#7a4a1a" opacity=".2" filter="url(#soft4)"/>`;
  s += `<ellipse cx="540" cy="262" rx="64" ry="46" fill="#ffffff"/><ellipse cx="540" cy="256" rx="52" ry="34" fill="#efe9da"/>`;
  for (let k = 0; k < 9; k++) {
    const cx = 512 + r() * 56, cy = 240 + r() * 30;
    s += `<rect x="${cx}" y="${cy}" width="11" height="9" rx="2" fill="${r() < 0.75 ? '#9ccf6a' : '#e04b2c'}" transform="rotate(${r() * 40 - 20} ${cx} ${cy})"/>`;
  }
  // cabai rawit
  s += `<path d="M560 160 q 30 -10 40 18" stroke="#2f7d32" stroke-width="3" fill="none"/><path d="M548 168 q 30 -26 56 14 q -26 -6 -56 -14z" fill="#d93a22"/>`;
  if (spec.badge) s += badge(spec.badge);
  return s;
}

// ── Minuman: gelas dengan es & sedotan ───────────────────────────────
function drink(spec, seed) {
  const r = rng(seed);
  let s = background('drink');
  s += `<ellipse cx="320" cy="352" rx="120" ry="18" fill="#2f4f2a" opacity=".22" filter="url(#soft)"/>`;
  if (spec.bottle) {
    s += `<rect x="270" y="110" width="100" height="232" rx="26" fill="#d8eefa" opacity=".9"/>`;
    s += `<rect x="296" y="60" width="48" height="56" rx="10" fill="#d8eefa"/><rect x="292" y="44" width="56" height="22" rx="6" fill="#2b7bc4"/>`;
    s += `<rect x="270" y="190" width="100" height="74" fill="#2b7bc4"/><rect x="270" y="196" width="100" height="6" fill="#ffffff" opacity=".6"/>`;
    s += `<path d="M300 228 q 20 -26 40 0 q -20 22 -40 0z" fill="#ffffff" opacity=".9"/>`;
    s += `<rect x="282" y="120" width="12" height="210" rx="6" fill="#ffffff" opacity=".6"/>`;
    // gelas kecil di samping
    s += `<path d="M420 228 l 10 112 h 60 l 10 -112z" fill="#e8f5fc" opacity=".8" stroke="#bcd9e8" stroke-width="2"/>`;
    s += `<path d="M424 262 l 7 76 h 58 l 7 -76z" fill="#cfe9f7"/>`;
    return s;
  }
  // gelas (trapesium)
  const top = 116, bot = 344, tl = 228, tr = 412, bl = 248, br = 392;
  s += `<clipPath id="gc${seed}"><path d="M${tl} ${top} L${tr} ${top} L${br} ${bot} L${bl} ${bot}Z"/></clipPath>`;
  s += `<path d="M${tl} ${top} L${tr} ${top} L${br} ${bot} L${bl} ${bot}Z" fill="#ffffff" opacity=".35"/>`;
  s += `<g clip-path="url(#gc${seed})">`;
  const layers = spec.layers; // [{color, from}] from=0..1 tinggi (0 = dasar)
  const fill = spec.fill ?? 0.82;
  const surface = bot - (bot - top) * fill;
  for (const L of layers) {
    const y0 = bot - (bot - top) * fill * (L.to ?? 1);
    const y1 = bot - (bot - top) * fill * (L.from ?? 0);
    s += `<rect x="${tl - 20}" y="${y0}" width="${tr - tl + 40}" height="${y1 - y0}" fill="${L.color}"/>`;
  }
  if (spec.foam) s += `<rect x="${tl - 20}" y="${surface}" width="${tr - tl + 40}" height="16" fill="${spec.foam}"/>`;
  if (spec.powder) for (let k = 0; k < 50; k++) s += `<circle cx="${tl + r() * (tr - tl)}" cy="${surface + 2 + r() * 8}" r="${1 + r() * 1.5}" fill="${spec.powder}"/>`;
  // es batu
  if (spec.ice !== false) for (let k = 0; k < 6; k++) {
    const cx = 250 + r() * 120, cy = surface + 10 + r() * 90, sz = 26 + r() * 12;
    s += `<rect x="${cx}" y="${cy}" width="${sz}" height="${sz}" rx="7" fill="#ffffff" opacity=".42" transform="rotate(${r() * 40 - 20} ${cx + sz / 2} ${cy + sz / 2})"/>`;
  }
  // gelembung soda
  if (spec.bubbles) for (let k = 0; k < 18; k++) s += `<circle cx="${250 + r() * 140}" cy="${surface + 20 + r() * 190}" r="${1.5 + r() * 2.5}" fill="#ffffff" opacity=".6"/>`;
  s += `</g>`;
  // kilap kaca
  s += `<path d="M${tl} ${top} L${tr} ${top} L${br} ${bot} L${bl} ${bot}Z" fill="url(#glass)" stroke="#ffffff" stroke-opacity=".8" stroke-width="3"/>`;
  s += `<ellipse cx="320" cy="${top}" rx="${(tr - tl) / 2}" ry="9" fill="none" stroke="#ffffff" stroke-opacity=".9" stroke-width="3"/>`;
  // sedotan
  s += `<path d="M352 ${top + 70} L392 ${top - 70}" stroke="${spec.straw ?? '#1c5a35'}" stroke-width="12" stroke-linecap="round"/>`;
  s += `<path d="M352 ${top + 70} L392 ${top - 70}" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-dasharray="10 12" opacity=".7"/>`;
  // garnish di bibir gelas
  if (spec.slice) {
    const [c1, c2] = spec.slice;
    s += `<g transform="translate(236 ${top + 6}) rotate(-20)"><path d="M-34 0 A34 34 0 0 1 34 0Z" fill="${c1}"/><path d="M-28 0 A28 28 0 0 1 28 0Z" fill="${c2}"/>`;
    for (let k = 1; k < 4; k++) s += `<path d="M0 0 L${28 * Math.cos(Math.PI + (k * Math.PI) / 4)} ${28 * Math.sin(Math.PI + (k * Math.PI) / 4)}" stroke="${c1}" stroke-width="2"/>`;
    s += `</g>`;
  }
  if (spec.leaf) s += `<path d="M300 ${top - 10} q 20 -30 50 -16 q -18 26 -50 16z" fill="#4f9a3a"/>`;
  if (spec.badge) s += badge(spec.badge);
  return s;
}

// ── Paket: komposisi beberapa item ───────────────────────────────────
function paket(spec, seed) {
  const r = rng(seed);
  let s = background('paket');
  s += `<ellipse cx="320" cy="352" rx="280" ry="24" fill="#7a4a1a" opacity=".22" filter="url(#soft)"/>`;
  const box = (x, y, scale, kind) => {
    const inner = kind === 'telur'
      ? telur({ egg: '#f5c842', meat: '#7a3d1d' }, seed + x).replace(/<defs>[\s\S]*?<\/defs>/, '').replace(/<rect width="640" height="400" fill="url\(#bg\)"\/>/, '').replace(/<g opacity="\.18"[\s\S]*?<\/g>/, '')
      : manis({ base: '#f2c76b', top: (i) => (i % 2 ? ['cheese'] : ['choco']) }, seed + x).replace(/<defs>[\s\S]*?<\/defs>/, '').replace(/<rect width="640" height="400" fill="url\(#bg\)"\/>/, '').replace(/<g opacity="\.18"[\s\S]*?<\/g>/, '');
    return `<g transform="translate(${x} ${y}) scale(${scale})">${inner}</g>`;
  };
  const glass = (x, y, scale, color) =>
    `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M0 0 h80 l-8 120 h-64z" fill="${color}"/><path d="M0 0 h80 l-8 120 h-64z" fill="url(#glass)" stroke="#fff" stroke-width="3"/><rect x="10" y="20" width="22" height="22" rx="5" fill="#fff" opacity=".4"/><path d="M56 30 L74 -40" stroke="#1c5a35" stroke-width="7" stroke-linecap="round"/></g>`;
  for (const it of spec.items) {
    if (it.k === 'manis' || it.k === 'telur') s += box(it.x, it.y, it.s, it.k);
    else s += glass(it.x, it.y, it.s, it.c ?? '#b5651d');
  }
  return s;
}

function badge(text) {
  return `<g transform="translate(24 24)"><rect width="${text.length * 11 + 28}" height="34" rx="9" fill="#1c5a35"/><text x="${(text.length * 11 + 28) / 2}" y="23" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="15" fill="#f5c518">${text}</text></g>`;
}

// ── Daftar menu → spesifikasi gambar ─────────────────────────────────
const alt = (a, b) => (i, j) => ((i + j) % 2 ? a : b);
const SPECS = {
  m1: () => manis({ base: '#f2c76b', top: alt(['choco', 'cheese'], ['cheese', 'choco']) }, 11),
  m2: () => manis({ base: '#f2c76b', top: () => ['banana', 'choco'] }, 12),
  m3: () => manis({ base: '#5a3320', top: () => ['cocoa', 'cream'] }, 13),
  m4: () => manis({ base: '#8dbf6a', top: () => ['cheese'] }, 14),
  m5: () => manis({ base: '#f2c76b', top: (i) => [['choco', 'cheese'], ['peanut', 'milk'], ['cheese', 'milk'], ['choco', 'peanut']][i % 4] }, 15),
  m6: () => manis({ base: '#f2c76b', cols: 6, rows: 2, round: true, top: alt(['choco'], ['cheese']) }, 16),
  m7: () => manis({ base: '#b3263a', top: () => ['cream', 'cheese'] }, 17),
  m8: () => manis({ base: '#efc06a', top: () => ['sesame', 'milk'] }, 18),
  m9: () => manis({ base: '#f2c76b', top: () => ['peanut', 'choco'] }, 19),
  m10: () => manis({ base: '#f6d27e', top: () => ['cheese', 'milk'] }, 20),
  m11: () => manis({ base: '#f4ecdc', top: () => ['oreo', 'cheese'] }, 21),
  m12: () => manis({ base: '#3d2440', top: () => ['cheese', 'milk'] }, 22),
  a1: () => telur({ egg: '#f5c842', meat: '#7a3d1d' }, 31),
  a2: () => telur({ egg: '#f7cf55', meat: '#c98f5a' }, 32),
  a3: () => telur({ egg: '#f2b92a', meat: '#7a3d1d' }, 33),
  a4: () => telur({ egg: '#f5c842', meat: '#7a3d1d', cols: 4, rows: 2 }, 34),
  a5: () => telur({ egg: '#eea21d', meat: '#6b3218' }, 35),
  a6: () => telur({ egg: '#f7d466', meat: '#e8a090', mozz: true }, 36),
  d1: () => drink({ layers: [{ color: '#b5651d' }] }, 41),
  d2: () => drink({ layers: [{ color: '#c89b6d' }], foam: '#efdcc2', ice: false, straw: '#a8611f' }, 42),
  d3: () => drink({ layers: [{ color: '#f39c1f' }], slice: ['#f7b733', '#ffd36b'] }, 43),
  d4: () => drink({ layers: [{ color: '#6b3e1e', to: 0.45 }, { color: '#d9b48a', from: 0.45, to: 0.7 }, { color: '#efe0c8', from: 0.7 }], straw: '#3d2414' }, 44),
  d5: () => drink({ layers: [{ color: '#7a4b2a' }], powder: '#4a2a14', straw: '#2b7a3a' }, 45),
  d6: () => drink({ layers: [{ color: '#c9782a' }], slice: ['#e6d14a', '#fff38a'], leaf: true }, 46),
  d7: () => drink({ layers: [{ color: '#e2445c', to: 0.35 }, { color: '#f4a3b4', from: 0.35, to: 0.7 }, { color: '#fde3e8', from: 0.7 }], bubbles: true, straw: '#e2445c' }, 47),
  d8: () => drink({ bottle: true }, 48),
  p1: () => paket({ label: 'BERDUA', items: [{ k: 'manis', x: 10, y: 70, s: 0.55 }, { k: 'telur', x: 300, y: 80, s: 0.5 }, { k: 'g', x: 250, y: 250, s: 0.8, c: '#b5651d' }, { k: 'g', x: 330, y: 255, s: 0.8, c: '#b5651d' }] }, 51),
  p2: () => paket({ label: 'KELUARGA', items: [{ k: 'manis', x: 0, y: 60, s: 0.5 }, { k: 'manis', x: 300, y: 50, s: 0.5 }, { k: 'telur', x: 150, y: 170, s: 0.5 }, { k: 'g', x: 20, y: 270, s: 0.6, c: '#b5651d' }, { k: 'g', x: 80, y: 275, s: 0.6, c: '#b5651d' }, { k: 'g', x: 520, y: 270, s: 0.6, c: '#f39c1f' }, { k: 'g', x: 580, y: 275, s: 0.6, c: '#f39c1f' }] }, 52),
  p3: () => paket({ label: 'SOLO', items: [{ k: 'manis', x: 40, y: 80, s: 0.6 }, { k: 'g', x: 450, y: 170, s: 1.1, c: '#b5651d' }] }, 53),
  p4: () => paket({ label: 'ARISAN', items: [{ k: 'manis', x: 0, y: 40, s: 0.4 }, { k: 'manis', x: 205, y: 30, s: 0.4 }, { k: 'manis', x: 410, y: 40, s: 0.4 }, { k: 'telur', x: 70, y: 180, s: 0.45 }, { k: 'telur', x: 330, y: 180, s: 0.45 }] }, 54),
};

module.exports = { SPECS, T, rng, W, H, svg: (id) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${SPECS[id]()}</svg>` };

if (require.main === module) {
  const { chromium } = require('playwright');
  const out = process.argv[2];
  const fs = require('fs');
  fs.mkdirSync(out, { recursive: true });
  (async () => {
    const b = await chromium.launch();
    const p = await b.newPage({ viewport: { width: W, height: H } });
    for (const id of Object.keys(SPECS)) {
      await p.setContent(`<body style="margin:0">${module.exports.svg(id)}</body>`);
      await p.screenshot({ path: `${out}/${id}.jpg`, type: 'jpeg', quality: 84, clip: { x: 0, y: 0, width: W, height: H } });
    }
    await b.close();
    console.log('rendered', Object.keys(SPECS).length);
  })();
}
