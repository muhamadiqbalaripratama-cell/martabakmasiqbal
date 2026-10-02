// Informasi toko yang tampil di struk dan layar QRIS.
// Isi sesuai data asli toko; baris yang dikosongkan tidak ditampilkan.
export const STORE = {
  name: 'Martabak Mas Iqbal',
  address: '', // mis. 'Jl. Merdeka No. 10, Bandung'
  phone: '', // mis. '0812-3456-7890'
  instagram: '', // tanpa @, mis. 'martabakmasiqbal'
  // NMID dari QRIS merchant (tertulis di stiker QRIS toko).
  qrisNmid: '',
  // Gambar QRIS asli toko: simpan sebagai app/public/qris-toko.png
  qrisImage: '/qris-toko.png',
  receiptFooter: 'Terima kasih, sampai jumpa lagi!',
};
