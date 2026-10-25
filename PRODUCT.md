# TERMA

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

HSE meninjau dan menyetujui rencana, mandor menerima instruksi dan melaporkan tindakan regunya, petugas data memasukkan data pekerja dan lingkungan. Konteks satu lokasi proyek Engineering & Construction.

## Product Purpose

Mengubah penugasan, kehadiran, riwayat adaptasi, dan WBGT/ISBB menjadi rencana kerja-istirahat yang dapat ditindaklanjuti dan diaudit. Bukan diagnosis atau prediksi kesehatan.

Penggunaan utama saat ini adalah simulasi pekerjaan HSE harian dengan seluruh data contoh tetap mock. Pengantar menjelaskan TERMA dan alur HSE–mandor–HSE sebelum pengguna masuk ke pekerjaan hari ini, melanjutkan tugas, dan membuka rincian pekerja bila diperlukan.

## Capabilities and Constraints

- Frontend Next.js/React dengan shadcn/ui, Bahasa Indonesia, data di localStorage. Backend PostgreSQL belum terhubung; pemilih pengguna bukan autentikasi.
- Tujuh langkah: impor, adaptasi, pengukuran, rencana/persetujuan, instruksi, tindakan/verifikasi, laporan.
- Status tindakan dan kualitas sumber harus terpisah. Batas harian dan interval harus eksplisit; data hilang/kedaluwarsa memicu tinjauan HSE.
- Aturan NAB masih fixture, belum disahkan. Tidak ada pengiriman pesan otomatis.
- Ruang kerja demo terisi otomatis pada kunjungan pertama: 8 pekerja fiktif dan alur simulasi pada tanggal awal. Penyimpanan `terma-demo-v2` terpisah dari data lama `terma-v1`; data lama tidak dibaca atau ditimpa.
- Pencarian global, direktori/profil pekerja, prioritas dan daftar pekerjaan harian, serta panduan peran menghubungkan alur. Lima kelompok navigasi sidebar menaungi tujuh langkah operasional, dengan drawer pada layar kecil. Dashboard `/ringkasan` langsung menampilkan pilihan zona, interval, peta, dan bacaan; riwayat tersedia melalui accordion. Panduan dashboard enam langkah bersifat opsional, dapat dilewati dan diulang. Tanggal lain dapat kosong dan menyediakan jalan kembali ke tanggal demo.
- Peta awal adalah skema simulasi yang berfungsi tanpa token. Mapbox opsional dimuat hanya setelah dipilih dan token publik tersedia; koordinatnya fiktif, bukan lokasi proyek. Kegagalan layanan kembali ke skema. Tidak ada permintaan geolokasi atau pelacakan pekerja.
- Dalam demo, tombol WhatsApp membuka pratinjau lokal. Salin pesan tetap tersedia; tidak ada pengiriman eksternal otomatis. Gangguan penyimpanan ditampilkan, bukan dianggap berhasil.
- Perubahan desain tidak boleh mengubah mesin aturan, izin peran, catatan, atau alur persetujuan.

## Brand Commitments

Nama TERMA dipertahankan. Pada 25 Oktober 2026 pengguna menyetujui penggantian identitas Heritage dengan Atmosphere, lalu penyederhanaan pengantar produk, alur HSE–mandor–HSE, dan prioritas kerja harian. Perluasan dashboard yang disetujui menambahkan sidebar serta pemantauan zona langsung. Logo TERMA Heatwave dari pengguna dipakai di header landing, sidebar ruang kerja, dan header mobile. Isi medis dan angka referensi visual bukan data produk dan tidak boleh disalin sebagai fakta.

Ruang kerja mempertahankan penyempurnaan layout yang disetujui dari referensi PlanetScale: aksen biru, sidebar pucat, kanvas putih, panel solid, dan sudut ringkas. Skema zona memakai interaksi isometrik yang tetap berfungsi dengan reduced motion. Arahan terbaru pada 25 Oktober 2026 mengganti font bersama menjadi Open Sans untuk isi, kontrol, data, dan sebagian besar judul; Roboto Slab dipakai terbatas pada dua judul aksen di landing. Arahan ini menggantikan pilihan Plus Jakarta Sans sebelumnya.

Landing kini mengikuti hierarki layout referensi Cloudflare: header putih, hero biru dominan dengan pesan ringkas dan CTA ke ruang kerja demo, lalu ilustrasi lokasi interaktif, peran, alur kerja, contoh, batas simulasi, FAQ, dan ajakan akhir. Komposisinya menonjolkan produk sebagai aplikasi yang dapat dicoba, bukan halaman dokumentasi panjang. Bahasa, konten, dan klaim tetap milik TERMA; angka atau janji dari referensi visual tidak menjadi fakta produk. Perubahan ini tidak mengubah makna data maupun alur kerja.

## Evidence on Hand

README.md, web/src/lib/types.ts, config.ts, store.tsx, rules.ts dan seed-data.ts adalah bukti domain/implementasi. Belum ada denah proyek nyata: visualisasi lokasi harus berlabel skema simulasi atau koordinat contoh, bukan posisi lapangan nyata atau pelacakan langsung.

## Product Principles

- Keputusan dapat dijelaskan dan ditelusuri.
- Informasi keselamatan tidak disembunyikan oleh dekorasi.
- Data demo dan data nyata dibedakan secara terlihat, termasuk cetak dan salin pesan.
- Semua fungsi tetap dapat digunakan melalui keyboard dan layar kecil.
