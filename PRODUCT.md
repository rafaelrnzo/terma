# TERMA

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

HSE meninjau dan menyetujui rencana, mandor menerima instruksi dan melaporkan tindakan regunya, petugas data memasukkan data pekerja dan lingkungan. Konteks satu lokasi proyek Engineering & Construction.

## Product Purpose

Mengubah penugasan, kehadiran, riwayat adaptasi, dan WBGT/ISBB menjadi rencana kerja-istirahat yang dapat ditindaklanjuti dan diaudit. Bukan diagnosis atau prediksi kesehatan.

## Capabilities and Constraints

- Frontend Next.js/React dengan shadcn/ui, Bahasa Indonesia, data di localStorage. Backend PostgreSQL belum terhubung; pemilih pengguna bukan autentikasi.
- Tujuh langkah: impor, adaptasi, pengukuran, rencana/persetujuan, instruksi, tindakan/verifikasi, laporan.
- Status tindakan dan kualitas sumber harus terpisah. Batas harian dan interval harus eksplisit; data hilang/kedaluwarsa memicu tinjauan HSE.
- Aturan NAB masih fixture, belum disahkan. Tidak ada pengiriman pesan otomatis.
- Ruang kerja demo terisi otomatis pada kunjungan pertama: 8 pekerja fiktif dan alur simulasi pada tanggal awal. Penyimpanan `terma-demo-v2` terpisah dari data lama `terma-v1`; data lama tidak dibaca atau ditimpa.
- Pencarian global, direktori/profil pekerja, pusat perhatian berbasis langkah, dan panduan peran menghubungkan alur. Tanggal lain dapat kosong dan menyediakan jalan kembali ke tanggal demo.
- Dalam demo, tombol WhatsApp membuka pratinjau lokal. Salin pesan tetap tersedia; tidak ada pengiriman eksternal otomatis. Gangguan penyimpanan ditampilkan, bukan dianggap berhasil.
- Perubahan desain tidak boleh mengubah mesin aturan, izin peran, catatan, atau alur persetujuan.

## Brand Commitments

Nama TERMA dipertahankan. Pengguna pada 25 Oktober 2026 menyetujui penggantian identitas Heritage dengan gabungan dua referensi yang dilampirkan: layout pemantauan zona dan navigasi atas dari dashboard warehouse, serta panel lapang, tipografi ringan, dan gradasi hijau–kuning lembut dari dashboard Neka. Isi medis dan angka referensi bukan data produk dan tidak boleh disalin sebagai fakta.

## Evidence on Hand

README.md, web/src/lib/types.ts, config.ts, store.tsx, rules.ts dan seed-data.ts adalah bukti domain/implementasi. Belum ada denah proyek nyata: visualisasi lokasi harus berlabel skema, bukan posisi geografis atau pelacakan langsung.

## Product Principles

- Keputusan dapat dijelaskan dan ditelusuri.
- Informasi keselamatan tidak disembunyikan oleh dekorasi.
- Data demo dan data nyata dibedakan secara terlihat, termasuk cetak dan salin pesan.
- Semua fungsi tetap dapat digunakan melalui keyboard dan layar kecil.
