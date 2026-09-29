import type { PaymentMethod } from '../types';

// Rekening tujuan untuk metode Transfer Bank.
export const BANK_TRANSFER = {
  bank: 'BCA',
  accountNo: '3620491887',
  // Isi nama pemilik rekening kalau ingin ditampilkan di layar transfer.
  accountName: '',
};

// Nomor rekening dikelompokkan 4-4-2 supaya mudah dibaca: 3620 4918 87
export const fmtAccountNo = (no: string) => no.replace(/(\d{4})(?=\d)/g, '$1 ');

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: 'Tunai',
  qris: 'QRIS',
  'transfer-bca': 'Transfer BCA',
};
