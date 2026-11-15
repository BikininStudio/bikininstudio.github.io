/* =========================================================
   DATA TOKO GG SPORT17: file ini yang Anda edit
   ---------------------------------------------------------
   CARA ISI HARGA
     price    : harga jual dalam angka, tanpa titik. Contoh: 42500
                Biarkan null kalau belum ada → tombol "Tanya Harga" via WA.
     oldPrice : harga coret (sebelum diskon). null kalau tidak diskon.

   CARA TAMBAH PRODUK
     1. Taruh foto di folder images/<slug>/01.jpg, 02.jpg, dst.
     2. Copy satu blok produk di bawah, ganti id (angka unik),
        slug (nama folder foto), name, cat, photos (jumlah foto), desc.
     3. Produk yang punya pilihan warna: isi `colors` (lihat WARNA di bawah).
   ========================================================= */

const STORE = {
  name: 'GG Sport17',
  whatsapp: '6285921456628',            // nomor WA tanpa + dan spasi
  whatsappLabel: '+62 859-2145-6628',
  shopeeUrl: 'https://shopee.co.id/search?keyword=gg-sport17',  // ganti dengan link toko Shopee Anda
  // Angka toko dari Shopee. Yang pertama tampil paling besar.
  stats: [
    { value: '4,9', unit: '/5', label: 'Rating toko Gg-Sport17 di Shopee, dinilai pembeli yang sudah menerima pesanannya.' },
    { value: '1.200+', label: 'Produk terjual' },
    { value: '201', label: 'Pengikut toko' },
  ],
};

/* WARNA ROLL
   Dipakai roll 3D, pilihan warna di rak, dan keranjang.
   Tambah warna baru: tulis namanya di sini beserta kode warnanya,
   lalu masukkan ke daftar `colors` produknya. Angka setelah nama
   = nomor foto warna itu (opsional). */
const WARNA = {
  'Krem': '#D6AE86', 'Biru muda': '#2BA3DC', 'Putih': '#ECE8E0', 'Oren': '#F0641E',
  'Pink': '#EC3D85', 'Hitam': '#232427', 'Biru tua': '#22408F', 'Merah': '#D4242B',
  'Kuning': '#F3CE1E', 'Hijau': '#1F9B58', 'Ungu': '#8752C0', 'Tosca': '#18AE96',
  'Hijau muda': '#63CF37',
};

const CATEGORIES = [
  { id: 'kinesio',  name: 'Kinesiology Tape', blurb: 'Tape elastis untuk support otot & sendi' },
  { id: 'rigid',    name: 'Sport Tape Rigid', blurb: 'Tape kaku untuk stabilisasi sendi' },
  { id: 'finger',   name: 'Finger Tape',      blurb: 'Perban kohesif untuk jari & pergelangan' },
  { id: 'foam',     name: 'Foamwrap',         blurb: 'Lapisan dasar sebelum taping' },
  { id: 'paket',    name: 'Paket Hemat',      blurb: 'Bundling tape + foamwrap lebih hemat' },
  { id: 'aksesori', name: 'Aksesori',         blurb: 'Grip raket & kaos kaki anti slip' },
  { id: 'recovery', name: 'Recovery & P3K',   blurb: 'Kompres & pereda nyeri otot' },
];

const PRODUCTS = [
  {
    id: 1, slug: 'kinematic-solid', cat: 'kinesio', photos: 9,
    name: 'Kinematic Tex Strong Plus 5 Cm x 5 M – Solid',
    price: 15000, oldPrice: null, badge: 'Best Seller',
    desc: ['Kinesiology tape original Kinematics Tex Strong Plus', 'Bahan elastis, daya rekat kuat', 'Tersedia banyak pilihan warna polos', 'Ukuran 5 Cm x 5 M'],
    colors: [['Krem', 3], ['Biru muda', 4], ['Putih', 5], ['Oren', 6], ['Pink', 7], ['Hitam', 8], ['Biru tua', 9], ['Merah'], ['Kuning']],
  },
  {
    id: 2, slug: 'kinematic-tattoo', cat: 'kinesio', photos: 4,
    name: 'Kinematic Tex Strong Plus 5 Cm x 5 M – Tattoo',
    price: 15000, oldPrice: null, badge: '',
    desc: ['Kinesiology tape original Kinematics Tex Strong Plus', 'Motif tattoo yang stylish', 'Bahan elastis, daya rekat kuat', 'Ukuran 5 Cm x 5 M'],
  },
  {
    id: 3, slug: 'kindmax', cat: 'kinesio', photos: 11,
    name: 'Kindmax Sports Tape 5 Cm x 5 M',
    price: 15000, oldPrice: null, badge: '',
    desc: ['Kinesiology tape Kindmax', 'Waterproof & extra strong', 'Tersedia berbagai warna', 'Ukuran 5 Cm x 5 M'],
    colors: [['Pink', 1], ['Kuning', 2], ['Oren', 3], ['Hijau', 4], ['Ungu', 5], ['Hitam', 6], ['Merah', 7], ['Biru tua', 8], ['Putih', 9], ['Biru muda', 10], ['Krem', 11]],
  },
  {
    id: 4, slug: 'sport-tape-38', cat: 'rigid', photos: 4,
    name: 'Sport Tape Rigid 3,8 Cm x 13,7 M',
    price: null, oldPrice: null, badge: 'Best Seller',
    desc: ['Bahan kaku, cocok untuk stabilisasi sendi', 'Mudah disobek dengan tangan', 'Daya rekat kuat', 'Ukuran 3,8 Cm x 13,7 M'],
  },
  {
    id: 5, slug: 'sport-tape-5', cat: 'rigid', photos: 4,
    name: 'Sport Tape Rigid 5 Cm x 13,7 M',
    price: null, oldPrice: null, badge: 'Best Seller',
    desc: ['Bahan kaku, cocok untuk stabilisasi sendi', 'Mudah disobek dengan tangan', 'Daya rekat kuat', 'Ukuran 5 Cm x 13,7 M'],
  },
  {
    id: 6, slug: 'mueller-mtape', cat: 'rigid', photos: 3,
    name: 'Mueller M-Tape Original 3,8 Cm x 13,7 M',
    price: null, oldPrice: null, badge: 'Original',
    desc: ['Athletic tape original Mueller', 'Kualitas premium, daya rekat kuat', 'Mudah disobek', 'Ukuran 3,8 Cm x 13,7 M'],
  },
  {
    id: 7, slug: 'fingertape-solid', cat: 'finger', photos: 18,
    name: 'Finger Tape Solid 4,5 Cm x 5 M',
    price: 10000, oldPrice: null, badge: 'Best Seller',
    desc: ['Perban kohesif, menempel ke bahannya sendiri (tanpa lem)', 'Elastis & mudah disobek', 'Banyak pilihan warna polos', 'Ukuran 4,5 Cm x 5 M'],
    colors: [['Merah', 7], ['Putih', 8], ['Pink', 9], ['Tosca', 10], ['Hitam', 11], ['Krem', 12], ['Oren', 13], ['Biru muda', 14], ['Kuning', 15], ['Biru tua', 16], ['Ungu', 17], ['Hijau muda', 18]],
  },
  {
    id: 8, slug: 'fingertape-camo', cat: 'finger', photos: 4,
    name: 'Finger Tape Camo 4,5 Cm x 5 M',
    price: 10000, oldPrice: null, badge: '',
    desc: ['Perban kohesif motif camouflage', 'Menempel ke bahannya sendiri (tanpa lem)', 'Elastis & mudah disobek', 'Ukuran 4,5 Cm x 5 M'],
  },
  {
    id: 9, slug: 'foamwrap', cat: 'foam', photos: 4,
    name: 'Foamwrap / Underwrap 7 Cm x 27 M',
    price: null, oldPrice: null, badge: '',
    desc: ['Lapisan dasar sebelum dipasang sport tape', 'Melindungi kulit & rambut dari lem tape', 'Lembut & nyaman', 'Ukuran 7 Cm x 27 M'],
  },
  {
    id: 10, slug: 'foamwrap-mueller', cat: 'foam', photos: 3,
    name: 'Mueller Foamwrap Original 7 Cm x 27 M',
    price: null, oldPrice: null, badge: 'Original',
    desc: ['Underwrap original Mueller', 'Melindungi kulit dari lem tape', 'Bahan premium, tidak mudah sobek', 'Ukuran 7 Cm x 27 M'],
  },
  {
    id: 11, slug: 'paket-38-foam', cat: 'paket', photos: 4,
    name: 'Paket Hemat Sport Tape 3,8 Cm + Foamwrap 7 Cm',
    price: null, oldPrice: null, badge: 'Hemat',
    desc: ['Isi: 1 Sport Tape Rigid 3,8 Cm x 13,7 M', 'Isi: 1 Foamwrap 7 Cm x 27 M', 'Lebih hemat dibanding beli satuan'],
  },
  {
    id: 12, slug: 'paket-5-foam', cat: 'paket', photos: 4,
    name: 'Paket Hemat Sport Tape 5 Cm + Foamwrap 7 Cm',
    price: null, oldPrice: null, badge: 'Hemat',
    desc: ['Isi: Sport Tape Rigid 5 Cm x 13,7 M', 'Isi: Foamwrap 7 Cm x 27 M', 'Lebih hemat dibanding beli satuan'],
  },
  {
    id: 13, slug: 'cushion-grip', cat: 'aksesori', photos: 4,
    name: 'Cushion Grip Wrap 7 Cm x 27 M',
    price: null, oldPrice: null, badge: '',
    desc: ['Bantalan grip raket badminton / tenis', 'Bikin pegangan lebih tebal & nyaman', 'Ukuran 7 Cm x 27 M'],
  },
  {
    id: 14, slug: 'kaos-kaki', cat: 'aksesori', photos: 4,
    name: 'Kaos Kaki Anti Slip',
    price: null, oldPrice: null, badge: '',
    desc: ['Grip anti slip di telapak kaki', 'Anti-wear & meredam benturan', 'Cocok untuk sepak bola, futsal, gym', 'Tersedia beberapa warna'],
  },
  {
    id: 15, slug: 'ice-bag', cat: 'recovery', photos: 4,
    name: 'Ice Bag Hot & Cold',
    price: null, oldPrice: null, badge: '',
    desc: ['Kantong kompres untuk air es atau air hangat', 'Membantu recovery cedera & nyeri otot', 'Tutup rapat, tidak bocor', 'Motif lucu & berwarna'],
  },
  {
    id: 16, slug: 'salonpas', cat: 'recovery', photos: 4,
    name: 'Salonpas Jet Spray 118 ml',
    price: null, oldPrice: null, badge: 'Original',
    desc: ['Original Hisamitsu, 118 ml', 'Semprotan pereda nyeri otot & pegal', 'Praktis dibawa saat olahraga', 'Harga untuk 1 pcs'],
  },
];
