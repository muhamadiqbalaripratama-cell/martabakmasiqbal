// Menu awal Martabak Mas Iqbal. Dimasukkan otomatis saat backend start
// (INSERT IGNORE per id), jadi perubahan dari menu "Kelola Menu" tidak
// tertimpa. Gambar ada di backend/assets/menu/<id>.jpg.

export type SeedItem = {
  id: string;
  category: 'manis' | 'asin' | 'drink' | 'paket';
  name: string;
  price: number;
  description: string;
  monogram: string;
  accent: 'green' | 'yellow' | 'cream' | 'cocoa';
  tag?: string;
  hot?: boolean;
  soldOut?: boolean;
};

export const SEED_MENU: SeedItem[] = [
  // ─── Martabak Manis ─────────────────────────────────────────────
  { id: 'm1', category: 'manis', name: 'Martabak Manis Cokelat Keju', price: 45000, monogram: 'C', accent: 'cocoa', hot: true,
    description: 'Paduan meses cokelat dan keju cheddar parut di atas adonan lembut bermentega.' },
  { id: 'm2', category: 'manis', name: 'Martabak Manis Pisang Cokelat', price: 50000, monogram: 'P', accent: 'cream',
    description: 'Irisan pisang raja matang dengan meses cokelat yang meleleh hangat.' },
  { id: 'm3', category: 'manis', name: 'Martabak Manis Nutella Tiramisu', price: 65000, monogram: 'N', accent: 'cocoa', tag: 'Premium',
    description: 'Olesan Nutella tebal, krim tiramisu, dan taburan bubuk kakao.' },
  { id: 'm4', category: 'manis', name: 'Martabak Manis Greentea Keju', price: 55000, monogram: 'G', accent: 'green',
    description: 'Adonan matcha harum dengan taburan keju cheddar melimpah.' },
  { id: 'm5', category: 'manis', name: 'Martabak Manis Spesial Iqbal', price: 75000, monogram: 'S', accent: 'yellow', hot: true,
    description: 'Andalan rumah: cokelat, keju, kacang sangrai, dan susu kental manis dalam satu loyang.' },
  { id: 'm6', category: 'manis', name: 'Martabak Manis Mini (12 pcs)', price: 38000, monogram: 'M', accent: 'cream',
    description: 'Dua belas martabak mini, setengah cokelat setengah keju. Pas untuk camilan bersama.' },
  { id: 'm7', category: 'manis', name: 'Martabak Red Velvet Cheese', price: 60000, monogram: 'R', accent: 'cocoa',
    description: 'Adonan red velvet lembut dengan cream cheese dan keju parut.' },
  { id: 'm8', category: 'manis', name: 'Martabak Manis Original Wijen', price: 32000, monogram: 'W', accent: 'yellow', soldOut: true,
    description: 'Resep klasik: mentega, gula, wijen sangrai, dan susu kental manis.' },
  { id: 'm9', category: 'manis', name: 'Martabak Manis Kacang Cokelat', price: 40000, monogram: 'K', accent: 'cream',
    description: 'Kacang tanah sangrai tumbuk kasar dengan meses cokelat.' },
  { id: 'm10', category: 'manis', name: 'Martabak Manis Keju Susu', price: 48000, monogram: 'K', accent: 'yellow',
    description: 'Keju cheddar parut berlimpah disiram susu kental manis.' },
  { id: 'm11', category: 'manis', name: 'Martabak Manis Oreo Cheese', price: 58000, monogram: 'O', accent: 'cream', tag: 'Premium',
    description: 'Remahan biskuit Oreo, krim vanila, dan keju parut.' },
  { id: 'm12', category: 'manis', name: 'Martabak Manis Ketan Hitam Keju', price: 52000, monogram: 'K', accent: 'cocoa',
    description: 'Adonan ketan hitam yang legit dengan keju dan susu kental manis.' },

  // ─── Martabak Telur ─────────────────────────────────────────────
  { id: 'a1', category: 'asin', name: 'Martabak Telur Sapi', price: 40000, monogram: 'T', accent: 'yellow', hot: true,
    description: 'Daging sapi cincang berbumbu, telur ayam, dan daun bawang. Disajikan dengan acar.' },
  { id: 'a2', category: 'asin', name: 'Martabak Telur Ayam', price: 38000, monogram: 'A', accent: 'yellow',
    description: 'Daging ayam cincang berbumbu kari ringan, telur, dan daun bawang.' },
  { id: 'a3', category: 'asin', name: 'Martabak Telur Spesial 4 Telur', price: 58000, monogram: 'S', accent: 'cream', tag: 'Premium',
    description: 'Empat butir telur dengan daging sapi ekstra, lebih tebal dan lebih padat.' },
  { id: 'a4', category: 'asin', name: 'Martabak Telur Mini Sapi', price: 28000, monogram: 'M', accent: 'cream',
    description: 'Porsi kecil martabak telur sapi, pas untuk satu orang.' },
  { id: 'a5', category: 'asin', name: 'Martabak Telur Bebek Sapi', price: 48000, monogram: 'B', accent: 'yellow',
    description: 'Telur bebek yang lebih gurih dengan daging sapi cincang berbumbu.' },
  { id: 'a6', category: 'asin', name: 'Martabak Telur Tuna Mozzarella', price: 55000, monogram: 'T', accent: 'cream',
    description: 'Isian tuna, telur, dan keju mozzarella yang lumer.' },

  // ─── Minuman ────────────────────────────────────────────────────
  { id: 'd1', category: 'drink', name: 'Es Teh Manis', price: 6000, monogram: 'T', accent: 'cream', hot: true,
    description: 'Teh melati seduh segar dengan gula dan es batu.' },
  { id: 'd2', category: 'drink', name: 'Teh Tarik', price: 12000, monogram: 'T', accent: 'cream',
    description: 'Teh hitam dan susu yang ditarik hingga berbusa lembut.' },
  { id: 'd3', category: 'drink', name: 'Es Jeruk Peras', price: 10000, monogram: 'J', accent: 'yellow',
    description: 'Jeruk peras segar dengan es batu.' },
  { id: 'd4', category: 'drink', name: 'Es Kopi Susu Gula Aren', price: 18000, monogram: 'K', accent: 'cocoa',
    description: 'Espresso, susu segar, dan gula aren cair.' },
  { id: 'd5', category: 'drink', name: 'Es Milo', price: 15000, monogram: 'M', accent: 'cocoa',
    description: 'Milo cokelat dingin dengan taburan bubuk Milo di atasnya.' },
  { id: 'd6', category: 'drink', name: 'Es Lemon Tea', price: 12000, monogram: 'L', accent: 'yellow',
    description: 'Teh dengan perasan lemon segar dan daun mint.' },
  { id: 'd7', category: 'drink', name: 'Soda Gembira', price: 15000, monogram: 'S', accent: 'cream',
    description: 'Sirup merah, susu kental manis, dan air soda dingin.' },
  { id: 'd8', category: 'drink', name: 'Air Mineral 600 ml', price: 5000, monogram: 'A', accent: 'green',
    description: 'Air mineral botol dingin.' },

  // ─── Paket Hemat ────────────────────────────────────────────────
  { id: 'p1', category: 'paket', name: 'Paket Berdua', price: 85000, monogram: 'B', accent: 'green', hot: true,
    description: '1 Martabak Manis Cokelat Keju + 1 Martabak Telur Ayam + 2 Es Teh Manis.' },
  { id: 'p2', category: 'paket', name: 'Paket Keluarga', price: 165000, monogram: 'K', accent: 'green', tag: 'Hemat 20rb',
    description: '2 Martabak Manis (Cokelat Keju & Spesial) + 1 Martabak Telur Spesial + 4 minuman.' },
  { id: 'p3', category: 'paket', name: 'Paket Hemat Solo', price: 40000, monogram: 'S', accent: 'green',
    description: '1 Martabak Manis Mini (12 pcs) + 1 Es Teh Manis.' },
  { id: 'p4', category: 'paket', name: 'Paket Arisan', price: 230000, monogram: 'A', accent: 'green', tag: 'Hemat 30rb',
    description: '3 Martabak Manis pilihan + 2 Martabak Telur Sapi. Cocok untuk 8–10 orang.' },
];
